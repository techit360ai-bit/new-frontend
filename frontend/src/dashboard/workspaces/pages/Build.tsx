import { useEffect, useMemo, useState } from 'react';
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import type { Task } from '../components/kanban/type';
import { Plus, Github, Code2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { listTasks } from '../lib/api/tasks';
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
