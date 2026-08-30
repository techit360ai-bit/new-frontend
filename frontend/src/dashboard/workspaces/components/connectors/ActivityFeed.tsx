import { Webhook, Bot, RefreshCw, ShieldCheck } from 'lucide-react';
import type { ActivityEvent } from '../../lib/types';

const KIND_ICON = {
  webhook: <Webhook className="w-4 h-4 text-status-info" />,
  agent_action: <Bot className="w-4 h-4 text-status-pending" />,
  sync: <RefreshCw className="w-4 h-4 text-text-muted" />,
  approval: <ShieldCheck className="w-4 h-4 text-status-warning" />,
} as const;

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) return <p className="text-sm text-text-disabled">No recent activity.</p>;
  return (
    <ul className="space-y-3">
      {events.map((e) => (
        <li key={e.id} className="flex items-start gap-3">
          <div className="mt-0.5">{KIND_ICON[e.kind]}</div>
          <div>
            <p className="text-sm text-text-secondary">{e.summary}</p>
            <p className="text-xs text-text-disabled">{e.at}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
