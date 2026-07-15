import { useEffect, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listAgents } from '../../lib/api/agents';
import { createTask, streamTask, getTask, listTasks } from '../../lib/api/tasks';
import { suggestTasks, flattenSuggestions } from '../../lib/api/workspaceAI';
import { useConsole } from '../../lib/console/ConsoleContext';
import type { AIAgent } from '../ai/AIAgentCard';

export function Composer() {
  const { dispatch } = useConsole();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [agentId, setAgentId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // B6 — pull AI task suggestions from ai-router WorkspaceAIService.
  const fetchSuggestions = async () => {
    if (suggesting) return;
    setSuggesting(true);
    try {
      const res = await suggestTasks({ agentId, currentPrompt: prompt });
      setSuggestions(flattenSuggestions(res).slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Task suggestions are unavailable.');
    } finally {
      setSuggesting(false);
    }
  };

  useEffect(() => {
    let alive = true;
    listAgents()
      .then((all) => {
        if (!alive) return;
        const enabled = all.filter((a) => a.enabled);
        setAgents(enabled);
        if (enabled[0]) setAgentId(enabled[0].id);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : 'Live workspace agents are unavailable.');
      });
    listTasks()
      .then((tasks) => { if (alive) dispatch({ type: 'set_tasks', tasks }); })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : 'Live workspace tasks are unavailable.');
      });
    return () => { alive = false; };
  }, [dispatch]);

  const submit = async () => {
    if (!prompt.trim() || !agentId || busy) return;
    setBusy(true);
    try {
      const id = await createTask(agentId, prompt.trim());
      const created = await getTask(id);
      if (created) dispatch({ type: 'add_task', task: created });
      setPrompt('');
      dispatch({ type: 'set_status', taskId: id, status: 'running' });
      for await (const event of streamTask(id)) {
        dispatch({ type: 'append_event', taskId: id, event });
        if (event.type === 'approval_request') dispatch({ type: 'set_status', taskId: id, status: 'needs_approval' });
        if (event.type === 'approval_resolved' || event.type === 'tool_call') dispatch({ type: 'set_status', taskId: id, status: 'running' });
        if (event.type === 'status' && event.text === 'Completed') dispatch({ type: 'set_status', taskId: id, status: 'done' });
        if (event.type === 'status' && event.text === 'Cancelled by user') dispatch({ type: 'set_status', taskId: id, status: 'cancelled' });
        if (event.type === 'error') dispatch({ type: 'set_status', taskId: id, status: 'failed' });
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Workspace task creation failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <div className="flex items-center gap-2 mb-2">
        <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5">
          {agents.length === 0 && <option value="">No live agents</option>}
          {agents.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
        </select>
        <button
          type="button"
          onClick={fetchSuggestions}
          disabled={suggesting}
          className="text-xs inline-flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {suggesting ? 'Thinking…' : 'Suggest tasks'}
        </button>
        {busy && <span className="text-xs text-gray-400">Agent working…</span>}
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setPrompt(s); setSuggestions([]); }}
              className="text-xs text-left max-w-full truncate border border-[#2196F3]/30 bg-[#2196F3]/5 text-[#1976D2] rounded-full px-2.5 py-1 hover:bg-[#2196F3]/10"
              title={s}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Ask an agent to carry out a task..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2196F3]" />
        <Button className="bg-[#2196F3] hover:bg-[#1976D2]" onClick={submit} disabled={busy || agents.length === 0}><Send className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}
