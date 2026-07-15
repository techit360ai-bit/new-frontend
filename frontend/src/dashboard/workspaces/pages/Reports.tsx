import { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, Clock, Download, TrendingDown, TrendingUp } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { listTasks } from '../lib/api/tasks';
import { listActivity } from '../lib/api/connectors';
import type { ActivityEvent, AgentTask, AgentTaskStatus } from '../lib/types';

interface ContributorRow {
  id: string;
  name: string;
  avatar: string;
  tasksTotal: number;
  tasksCompleted: number;
  eventCount: number;
  powerScore: number;
  trend: 'up' | 'down';
}

const STATUS_ORDER: AgentTaskStatus[] = ['queued', 'running', 'needs_approval', 'done', 'failed', 'cancelled'];
const STATUS_COLORS: Record<AgentTaskStatus, string> = {
  queued: '#94A3B8',
  running: '#2196F3',
  needs_approval: '#F59E0B',
  done: '#10B981',
  failed: '#EF4444',
  cancelled: '#64748B',
};

function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'WS';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function contributorName(agentId: string): string {
  return agentId || 'Workspace';
}

function buildContributors(tasks: AgentTask[]): ContributorRow[] {
  const groups = new Map<string, AgentTask[]>();
  for (const task of tasks) {
    const key = task.agentId || 'workspace';
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }

  return [...groups.entries()]
    .map(([id, rows]) => {
      const completed = rows.filter((task) => task.status === 'done').length;
      const failed = rows.filter((task) => task.status === 'failed' || task.status === 'cancelled').length;
      const eventCount = rows.reduce((sum, task) => sum + task.events.length, 0);
      const trend: ContributorRow['trend'] = failed > 0 ? 'down' : 'up';
      return {
        id,
        name: contributorName(id),
        avatar: initials(contributorName(id)),
        tasksTotal: rows.length,
        tasksCompleted: completed,
        eventCount,
        powerScore: rows.length === 0 ? 0 : Math.round((completed / rows.length) * 100),
        trend,
      };
    })
    .sort((a, b) => b.powerScore - a.powerScore || b.tasksCompleted - a.tasksCompleted);
}

function buildStatusData(tasks: AgentTask[]): Array<{ status: AgentTaskStatus; count: number }> {
  return STATUS_ORDER.map((status) => ({
    status,
    count: tasks.filter((task) => task.status === status).length,
  })).filter((row) => row.count > 0);
}

export function Reports() {
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
        setError(err instanceof Error ? err.message : 'Live workspace reports are unavailable.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const contributorData = useMemo(() => buildContributors(tasks), [tasks]);
  const statusData = useMemo(() => buildStatusData(tasks), [tasks]);
  const completedTasks = tasks.filter((task) => task.status === 'done').length;
  const openTasks = tasks.filter((task) => task.status !== 'done' && task.status !== 'cancelled').length;
  const totalEvents = tasks.reduce((sum, task) => sum + task.events.length, 0) + activity.length;

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Contribution Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Live workspace task and activity metrics
            </p>
          </div>
          <button onClick={() => toast('Report export requires a persisted export endpoint.')} className="flex items-center gap-2 px-4 py-2 bg-[#2196F3] text-white rounded-lg hover:bg-[#2196F3]/90 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export Report</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading && <p className="text-sm text-gray-500">Loading live workspace report...</p>}
        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Live workspace report could not be loaded: {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#2196F3]/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[#2196F3]" />
              </div>
              <Badge className="bg-[#10B981] text-white">Live</Badge>
            </div>
            <div className="text-3xl font-bold mb-1">{completedTasks}</div>
            <div className="text-sm text-gray-600">Completed Tasks</div>
            <div className="text-xs text-gray-500 mt-2">{tasks.length} total recorded</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <Badge className="bg-[#F59E0B] text-white">Open</Badge>
            </div>
            <div className="text-3xl font-bold mb-1">{openTasks}</div>
            <div className="text-sm text-gray-600">Open Workflow Items</div>
            <div className="text-xs text-gray-500 mt-2">Queued, running, approval, or failed</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-[#10B981]" />
              </div>
              <Badge className="bg-[#10B981] text-white">Events</Badge>
            </div>
            <div className="text-3xl font-bold mb-1">{totalEvents}</div>
            <div className="text-sm text-gray-600">Activity Events</div>
            <div className="text-xs text-gray-500 mt-2">Task transcript events + workspace reports</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="font-semibold text-lg">Contributor Summary</h2>
              <p className="text-sm text-gray-600 mt-1">Grouped by live agent or workspace owner</p>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-600 border-b">
                    <th className="pb-3 font-medium">Contributor</th>
                    <th className="pb-3 font-medium">Completed</th>
                    <th className="pb-3 font-medium">Total Tasks</th>
                    <th className="pb-3 font-medium">Activity Events</th>
                    <th className="pb-3 font-medium">Power Score</th>
                    <th className="pb-3 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {contributorData.map((contributor, idx) => (
                    <tr key={contributor.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-[#2196F3] text-white">
                                {contributor.avatar}
                              </AvatarFallback>
                            </Avatar>
                            {idx < 3 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFD700] rounded-full flex items-center justify-center text-xs font-bold text-black">
                                {idx + 1}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{contributor.name}</div>
                            <div className="text-xs text-gray-500">{contributor.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4"><span className="font-medium">{contributor.tasksCompleted}</span></td>
                      <td className="py-4"><span className="font-medium">{contributor.tasksTotal}</span></td>
                      <td className="py-4"><span className="font-medium">{contributor.eventCount}</span></td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[100px] h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#2196F3] rounded-full" style={{ width: `${contributor.powerScore}%` }} />
                          </div>
                          <span className="text-sm font-medium">{contributor.powerScore}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        {contributor.trend === 'up' ? (
                          <TrendingUp className="w-5 h-5 text-[#10B981]" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                  {!loading && !error && contributorData.length === 0 && (
                    <tr><td className="py-6 text-sm text-gray-500" colSpan={6}>No live task contributors are recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="font-semibold text-lg">Task Status</h2>
              <p className="text-sm text-gray-600 mt-1">Live workspace task distribution</p>
            </div>
            <div className="p-6">
              {statusData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-sm text-gray-500">No live tasks yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8px 12px',
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {statusData.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium mb-2">Recent Activity Reports</div>
                {activity.slice(0, 4).length > 0 ? (
                  <ul className="space-y-2">
                    {activity.slice(0, 4).map((item) => (
                      <li key={item.id} className="text-xs text-gray-600">
                        {item.summary || item.kind} <span className="text-gray-400">{item.at}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500">No live activity reports yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
