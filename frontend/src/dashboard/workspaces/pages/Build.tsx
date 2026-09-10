import { useEffect, useMemo, useState } from 'react';
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import type { Task } from '../components/kanban/type';
import { Plus, Github, Code2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { listTasks } from '../lib/api/tasks';
import { chooseBuildPath, getBuildContext, type BuildContext } from '../lib/api/capabilities';
import type { AgentTask } from '../lib/types';

type ColumnType = 'backlog' | 'inProgress' | 'review' | 'done';
const COLUMNS: ColumnType[] = ['backlog', 'inProgress', 'review', 'done'];

const EMPTY_COLUMNS: Record<ColumnType, Task[]> = {
  backlog: [],
  inProgress: [],
  review: [],
  done: [],
};

function columnForStatus(status: AgentTask['status']): ColumnType {
  if (status === 'running' || status === 'needs_approval') return 'inProgress';
  if (status === 'done') return 'done';
  if (status === 'failed' || status === 'cancelled') return 'review';
  return 'backlog';
}

function normalizeTask(task: AgentTask): Task {
  return {
    id: task.id,
    title: task.prompt || 'Workspace task',
    assignee: { name: task.agentId || 'Workspace', avatar: (task.agentId || 'WS').slice(0, 2).toUpperCase(), color: 'bg-status-info' },
    priority: task.status === 'failed' ? 'high' : 'medium',
    dueDate: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '—',
    timeTracked: '0h',
    labels: [task.status],
  };
}

export function Build() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tasks, setTasks] = useState<Record<ColumnType, Task[]>>(EMPTY_COLUMNS);
  const [error, setError] = useState<string | null>(null);
  const [buildContext, setBuildContext] = useState<BuildContext | null>(null);
  const [choosing, setChoosing] = useState(false);
  const workspaceId = new URLSearchParams(location.search).get('workspace') || undefined;

  useEffect(() => {
    let alive = true;
    listTasks()
      .then((rows) => {
        if (!alive) return;
        const next: Record<ColumnType, Task[]> = { backlog: [], inProgress: [], review: [], done: [] };
        rows.forEach((row) => {
          next[columnForStatus(row.status)].push(normalizeTask(row));
        });
        setTasks(next);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setTasks(EMPTY_COLUMNS);
        setError(err instanceof Error ? err.message : 'Live workspace tasks are unavailable.');
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => { void getBuildContext(workspaceId).then(setBuildContext).catch(() => setBuildContext(null)); }, [workspaceId]);

  async function selectPath(path: 'prototype' | 'mvp') {
    setChoosing(true);
    try { const result = await chooseBuildPath(path); if (result) setBuildContext(await getBuildContext(workspaceId)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Build path could not be selected.'); }
    finally { setChoosing(false); }
  }

  const totalTasks = useMemo(
    () => Object.values(tasks).reduce((sum, column) => sum + column.length, 0),
    [tasks],
  );

  const handleDrop = (column: ColumnType) => (taskId: string) => {
    setTasks((prev) => {
      // Find the task in all columns
      let movedTask: Task | null = null;
      let sourceColumn: ColumnType | null = null;

      for (const col of COLUMNS) {
        const task = prev[col].find((item) => item.id === taskId);
        if (task) {
          movedTask = task;
          sourceColumn = col;
          break;
        }
      }

      if (!movedTask || !sourceColumn || sourceColumn === column) return prev;

      // Remove from source and add to destination
      const from = sourceColumn;
      const taskToMove = movedTask;
      return {
        ...prev,
        [from]: prev[from].filter((task) => task.id !== taskId),
        [column]: [...prev[column], taskToMove],
      };
    });
  };

  return (
    <div className="h-full flex flex-col bg-background-primary">
      {/* Page Header */}
      <div className="bg-surface-primary border-b border-border-default px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Build
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Live workspace tasks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/workspaces/code${location.search}`)} className="flex items-center gap-2 px-4 py-2 bg-surface-primary border border-border-strong rounded-lg hover:bg-background-primary transition-colors"><Code2 className="w-4 h-4" /><span className="text-sm font-medium">Open Code</span></button>
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-primary border border-border-strong rounded-lg hover:bg-background-primary transition-colors">
              <Github className="w-4 h-4" />
              <span className="text-sm font-medium">GitHub</span>
              <Badge className="bg-status-success text-white text-xs">Live</Badge>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-auto p-6">
        {!buildContext?.buildProfile?.buildPath && (
          <div className="mb-6 rounded-lg border border-border-default bg-surface-primary p-5">
            <div className="flex items-center justify-between gap-4 mb-4"><div><h2 className="text-lg font-semibold">Choose a build path</h2><p className="text-sm text-text-muted">Use the same editor, files, and live preview for either path.</p></div>{buildContext?.costEstimate && <span className="text-xs text-text-muted">Estimate updates after selection</span>}</div>
            <div className="grid gap-3 md:grid-cols-2">
              <button disabled={choosing} onClick={() => void selectPath('prototype')} className="text-left rounded-lg border border-border-strong p-4 hover:border-brand-primary hover:bg-background-primary disabled:opacity-60"><div className="font-medium">Prototype</div><div className="text-sm text-text-muted mt-1">Narrow hypothesis, scaffold, preview, and feedback.</div><div className="text-xs text-text-muted mt-3">Typical estimate: 35 credits, 15 runtime minutes</div></button>
              <button disabled={choosing} onClick={() => void selectPath('mvp')} className="text-left rounded-lg border border-brand-primary p-4 hover:bg-background-primary disabled:opacity-60"><div className="font-medium">Build MVP</div><div className="text-sm text-text-muted mt-1">Bounded product scope with tests, security, and deployment evidence.</div><div className="text-xs text-text-muted mt-3">Typical estimate: 120 credits, 45 runtime minutes</div></button>
            </div>
          </div>
        )}
        {buildContext?.buildProfile?.buildPath && (
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm"><Badge className="bg-brand-primary text-white">{buildContext.buildProfile.buildPath === 'mvp' ? 'Build MVP' : 'Prototype'}</Badge>{buildContext.costEstimate && <span className="text-text-muted">{buildContext.costEstimate.creditsToConsume ?? 0} credits projected, {buildContext.costEstimate.runtimeMinutes ?? 0} runtime minutes</span>}</div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-status-error bg-status-error-soft px-4 py-3 text-sm text-status-error">
            Live workspace tasks could not be loaded: {error}
          </div>
        )}
        {totalTasks === 0 && !error && (
          <div className="mb-4 rounded-lg border border-dashed border-border-strong bg-surface-primary px-4 py-6 text-sm text-text-muted">
            No workspace tasks are recorded yet.
          </div>
        )}
        <div className="flex gap-6 h-full">
          <KanbanColumn
            title="Backlog"
            tasks={tasks.backlog}
            onDrop={handleDrop('backlog')}
            color="bg-gray-400"
          />
          <KanbanColumn
            title="In Progress"
            tasks={tasks.inProgress}
            onDrop={handleDrop('inProgress')}
            color="bg-brand-primary"
          />
          <KanbanColumn
            title="Review"
            tasks={tasks.review}
            onDrop={handleDrop('review')}
            color="bg-status-warning"
          />
          <KanbanColumn
            title="Done"
            tasks={tasks.done}
            onDrop={handleDrop('done')}
            color="bg-status-success"
          />
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        className="fixed bottom-8 right-8 w-14 h-14 bg-brand-primary text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center group"
        title="Add New Task"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
