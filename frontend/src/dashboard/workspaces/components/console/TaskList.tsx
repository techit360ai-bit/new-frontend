import { Badge } from '@/components/ui/badge';
import { useConsole } from '../../lib/console/ConsoleContext';
import type { AgentTaskStatus } from '../../lib/types';

const STATUS_STYLE: Record<AgentTaskStatus, string> = {
  queued: 'bg-surface-secondary text-text-muted', running: 'bg-status-info-soft text-status-info',
  needs_approval: 'bg-status-warning-soft text-status-warning', done: 'bg-status-success-soft text-status-success',
  failed: 'bg-status-error-soft text-status-error', cancelled: 'bg-surface-secondary text-text-muted',
};

export function TaskList() {
  const { state, dispatch } = useConsole();
  return (
    <div className="w-[260px] border-r border-border-default overflow-y-auto">
      <div className="p-3 text-xs font-semibold uppercase text-text-disabled">Tasks</div>
      {state.tasks.length === 0 && <p className="px-3 text-sm text-text-disabled">No tasks yet.</p>}
      <ul>
        {state.tasks.map((t) => (
          <li key={t.id}>
            <button
              onClick={() => dispatch({ type: 'select', id: t.id })}
              className={`w-full text-left px-3 py-3 border-b border-border-subtle hover:bg-background-primary ${state.activeTaskId === t.id ? 'bg-background-primary' : ''}`}>
              <p className="text-sm font-medium text-text-primary line-clamp-2">{t.prompt}</p>
              <Badge className={`mt-1.5 text-xs ${STATUS_STYLE[t.status]}`}>{t.status.replace('_', ' ')}</Badge>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
