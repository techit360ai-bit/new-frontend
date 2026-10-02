import { Bot, RefreshCw } from 'lucide-react';
import { useConsole } from '../../lib/console/ConsoleContext';
import { getTask, resolveApproval } from '../../lib/api/tasks';
import { ToolCallEvent } from './ToolCallEvent';
import { ApprovalCard } from './ApprovalCard';

export function Transcript() {
  const { state, dispatch } = useConsole();
  const task = state.tasks.find((t) => t.id === state.activeTaskId);

  // Reflect the decision on the card immediately, and unblock the stream.
  const handleResolve = (taskId: string, approvalId: string, decision: 'approved' | 'rejected') => {
    dispatch({ type: 'resolve_approval', taskId, approvalId, decision });
    resolveApproval(taskId, approvalId, decision);
  };

  const refresh = async (taskId: string) => {
    const latest = await getTask(taskId);
    if (latest) dispatch({ type: 'set_task', task: latest });
  };

  if (!task) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-text-disabled">
        <Bot className="w-10 h-10 mb-2" />
        <p>Select a task or start a new one below.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex items-start gap-2 rounded border border-border-default bg-background-primary px-3 py-2">
        <p className="flex-1 text-xs text-text-muted">
          Live transcript. This view polls the backend task record, which is the real producer: runs execute server-side
          against the AI router and each event (status, message, error) is written as it happens.
        </p>
        <button type="button" onClick={() => void refresh(task.id)} className="inline-flex items-center gap-1 rounded border border-border-default px-2 py-0.5 text-xs text-text-muted hover:bg-background-soft">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>
      {task.events.length === 0 && (
        <p className="text-sm text-text-muted">No events have been recorded on this task yet.</p>
      )}
      {task.events.map((e) => {
        if (e.type === 'message' || e.type === 'status') {
          return <p key={e.id} className={`text-sm ${e.type === 'status' ? 'text-text-disabled italic' : 'text-text-primary'}`}>{e.text}</p>;
        }
        if (e.type === 'error') {
          return <p key={e.id} className="text-sm text-status-error">{e.text}</p>;
        }
        if (e.type === 'tool_call' || e.type === 'tool_result') {
          return <ToolCallEvent key={e.id} event={e} />;
        }
        if (e.type === 'approval_request' && e.approval) {
          const ap = e.approval;
          return <ApprovalCard key={e.id} approval={ap} onResolve={(d) => handleResolve(task.id, ap.id, d)} />;
        }
        return null;
      })}
    </div>
  );
}
