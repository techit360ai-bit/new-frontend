import { Terminal, CheckCircle2, XCircle } from 'lucide-react';
import type { TaskEvent } from '../../lib/types';

export function ToolCallEvent({ event }: { event: TaskEvent }) {
  if (event.type === 'tool_call' && event.tool) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-muted bg-background-primary rounded-md px-3 py-2 font-mono">
        <Terminal className="w-4 h-4 text-brand-primary" />
        <span>{event.tool.connectorId}.{event.tool.name}()</span>
      </div>
    );
  }
  if (event.type === 'tool_result' && event.result) {
    const ok = event.result.ok;
    return (
      <div className="flex items-center gap-2 text-xs text-text-muted pl-6">
        {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-status-success" /> : <XCircle className="w-3.5 h-3.5 text-status-error" />}
        <span>{String(event.result.detail)}</span>
      </div>
    );
  }
  return null;
}
