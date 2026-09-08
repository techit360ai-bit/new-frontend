import { useDrop } from 'react-dnd';
import { TaskCard } from './TaskCard';
import type { Task } from './type';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  onDrop: (taskId: string) => void;
  color: string;
}

export function KanbanColumn({ title, tasks, onDrop, color }: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item: { id: string }) => onDrop(item.id),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div className="flex-1 min-w-[280px] bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-4 transition-colors">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-black/[0.05] dark:bg-white/10 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button className="p-1 hover:bg-black/[0.05] dark:hover:bg-white/10 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Drop Zone */}
      <div
        ref={(node) => {
          drop(node);
        }}
        className={`space-y-3 min-h-[200px] transition-colors rounded-xl ${
          isOver ? 'bg-[#0066ff]/10 border-2 border-dashed border-[#0066ff] p-2' : ''
        }`}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
