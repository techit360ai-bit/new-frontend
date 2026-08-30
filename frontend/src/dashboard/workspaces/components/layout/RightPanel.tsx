import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
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

export function RightPanel() {
  const location = useLocation();
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

  if (location.pathname === '/workspaces/copilot' || location.pathname === '/workspaces/code') return null;

  if (
    location.pathname === '/workspaces/build' ||
    location.pathname === '/workspaces' ||
    location.pathname === '/workspaces/'
  ) {
    return (
      <div className="w-[320px] shrink-0 bg-surface-primary border-l border-border-default flex flex-col max-md:hidden">
        <div className="p-4 border-b border-border-default">
          <h3 className="font-semibold">Team Activity</h3>
          <p className="text-xs text-text-muted mt-1">Live workspace updates</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {loading && <p className="text-sm text-text-muted">Loading live activity...</p>}
            {!loading && error && (
              <div className="rounded-lg border border-status-error bg-status-error-soft px-3 py-2 text-xs text-status-error">
                {error}
              </div>
            )}
            {!loading && activities.map((activityRow) => (
              <div key={activityRow.id} className="flex gap-3 group hover:bg-background-primary p-2 rounded-lg -mx-2 transition-colors">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-brand-primary text-white text-xs">
                    {activityRow.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activityRow.actor}</span>
                    {' '}
                    <span className="text-text-muted">{activityRow.action}</span>
                  </p>
                  <p className="text-sm text-brand-primary truncate">{activityRow.detail}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-text-muted">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(activityRow.at)}
                  </div>
                </div>
              </div>
            ))}
            {!loading && !error && activities.length === 0 && (
              <p className="text-sm text-text-muted">No live workspace activity is recorded yet.</p>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border-default">
          <div className="bg-gradient-to-r from-brand-primary/10 to-status-pending/10 p-3 rounded-lg border border-brand-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-status-success" />
              <span className="text-sm font-medium">Task Progress</span>
            </div>
            {tasks.length > 0 ? (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">{completedTasks} of {tasks.length} tasks</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-status-success rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted">No live task progress yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
