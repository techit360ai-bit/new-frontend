import { useDrop } from 'react-dnd';
import { TaskCard } from './TaskCard';
import type { Task } from './type';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  onDrop: (taskId: string) => void;
  onAdd?: () => void;
  color: string;
}

export function KanbanColumn({ title, tasks, onDrop, onAdd, color }: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item: { id: string }) => onDrop(item.id),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div className="flex-1 min-w-[280px] bg-background-primary rounded-lg p-4">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <h3 className="font-semibold">{title}</h3>
          <span className="text-sm text-text-muted bg-surface-primary px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={!onAdd}
          aria-label={`New task in ${title}`}
          title={`New task in ${title}`}
          className="p-1 hover:bg-surface-primary rounded transition-colors disabled:opacity-40 disabled:cursor-default"
        >
          <Plus className="w-4 h-4 text-text-muted" />
        </button>
      </div>

      {/* Drop Zone */}
      <div
        ref={(node) => {
          drop(node);
        }}
        className={`space-y-3 min-h-[200px] ${
          isOver ? 'bg-brand-primary/5 border-2 border-dashed border-brand-primary rounded-lg p-2' : ''
        }`}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
