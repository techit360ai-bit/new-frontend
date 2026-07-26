import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, Clock, Loader2, Send, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api/client';
import { listActivity } from '../../lib/api/connectors';
import { listTasks } from '../../lib/api/tasks';
import type { ActivityEvent, AgentTask, TaskEvent } from '../../lib/types';

interface ActivityRow {
  id: string;
  actor: string;
  action: string;
  detail: string;
  at: string;
  avatar: string;
}

function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'WS';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function formatTimestamp(value: string): string {
  if (!value) return 'No timestamp';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function eventDetail(event: TaskEvent, task: AgentTask): string {
  if (event.text) return event.text;
  if (event.approval?.summary) return event.approval.summary;
  if (event.tool?.name) return event.tool.name;
  return task.prompt;
}

function buildActivityRows(tasks: AgentTask[], reports: ActivityEvent[]): ActivityRow[] {
  const taskRows = tasks.flatMap((task) => task.events.map((event) => {
    const actor = task.agentId || 'Workspace';
    return {
      id: `${task.id}-${event.id}`,
      actor,
      action: event.type.replace(/_/g, ' '),
      detail: eventDetail(event, task),
      at: event.at || task.createdAt,
      avatar: initials(actor),
    };
  }));

  const reportRows = reports.map((report) => {
    const actor = report.connectorId || 'Workspace';
    return {
      id: report.id,
      actor,
      action: report.kind.replace(/_/g, ' '),
      detail: report.summary,
      at: report.at,
      avatar: initials(actor),
    };
  });

  return [...taskRows, ...reportRows]
    .sort((a, b) => {
      const left = new Date(a.at).getTime();
      const right = new Date(b.at).getTime();
      return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left);
    })
    .slice(0, 6);
}

interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function CopilotPanel({ message, setMessage }: { message: string; setMessage: (v: string) => void }) {
  const [chatHistory, setChatHistory] = useState<CopilotMessage[]>([]);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleCopilotSend = async () => {
    const userMessage = message.trim();
    if (!userMessage || copilotLoading) return;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setMessage('');
    setCopilotLoading(true);

    try {
      const response = await apiPost<{ result?: string; output?: string; error?: string }>(
        '/workspace/tools/invoke',
        { tool: 'copilot', input: userMessage },
      );
      const assistantContent = response.result || response.output || 'No response received.';
      const assistantMsg: CopilotMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantContent,
      };
      setChatHistory((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Copilot request failed.';
      const errorMsg: CopilotMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${errorText}`,
      };
      setChatHistory((prev) => [...prev, errorMsg]);
      toast.error(errorText);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCopilotSend();
    }
  };

  return (
    <div className="w-[320px] bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#2196F3] to-purple-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Copilot</h3>
            <p className="text-xs text-gray-500">
              {copilotLoading ? 'Thinking...' : 'Ask anything about your workspace'}
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {chatHistory.length === 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700">
                Ask me anything about your workspace, agents, or tools.
              </p>
            </div>
          )}
          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-[#2196F3]/10 text-gray-800 ml-4'
                  : 'bg-gray-50 text-gray-700 mr-4'
              }`}
            >
              <p className="text-[10px] font-medium text-gray-500 mb-1">
                {msg.role === 'user' ? 'You' : 'Copilot'}
              </p>
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
          ))}
          {copilotLoading && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mr-4">
              <Loader2 className="w-3 h-3 animate-spin text-[#2196F3]" />
              <span className="text-xs text-gray-500">Copilot is thinking...</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={copilotLoading}
            className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] outline-none disabled:opacity-50"
          />
          <button
            className="p-2 bg-[#2196F3] text-white rounded-lg hover:bg-[#2196F3]/90 transition-colors disabled:opacity-50"
            onClick={handleCopilotSend}
            disabled={copilotLoading || !message.trim()}
          >
            {copilotLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RightPanel() {
  const location = useLocation();
  const [message, setMessage] = useState('');
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([listTasks(), listActivity()])
      .then(([taskRows, activityRows]) => {
        if (!alive) return;
        setTasks(taskRows);
        setActivity(activityRows);
      })
      .catch((err) => {
        if (!alive) return;
        setTasks([]);
        setActivity([]);
        setError(err instanceof Error ? err.message : 'Live workspace activity is unavailable.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const activities = useMemo(() => buildActivityRows(tasks, activity), [tasks, activity]);
  const completedTasks = tasks.filter((task) => task.status === 'done').length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

  if (location.pathname === '/workspaces/ai-agents') {
    return <CopilotPanel message={message} setMessage={setMessage} />;
  }

  if (
    location.pathname === '/workspaces/build' ||
    location.pathname === '/workspaces' ||
    location.pathname === '/workspaces/'
  ) {
    return (
      <div className="w-[320px] bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold">Team Activity</h3>
          <p className="text-xs text-gray-500 mt-1">Live workspace updates</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {loading && <p className="text-sm text-gray-500">Loading live activity...</p>}
            {!loading && error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}
            {!loading && activities.map((activityRow) => (
              <div key={activityRow.id} className="flex gap-3 group hover:bg-gray-50 p-2 rounded-lg -mx-2 transition-colors">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-[#2196F3] text-white text-xs">
                    {activityRow.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activityRow.actor}</span>
                    {' '}
                    <span className="text-gray-600">{activityRow.action}</span>
                  </p>
                  <p className="text-sm text-[#2196F3] truncate">{activityRow.detail}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(activityRow.at)}
                  </div>
                </div>
              </div>
            ))}
            {!loading && !error && activities.length === 0 && (
              <p className="text-sm text-gray-500">No live workspace activity is recorded yet.</p>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-[#2196F3]/10 to-purple-500/10 p-3 rounded-lg border border-[#2196F3]/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <span className="text-sm font-medium">Task Progress</span>
            </div>
            {tasks.length > 0 ? (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">{completedTasks} of {tasks.length} tasks</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#10B981] rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">No live task progress yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
