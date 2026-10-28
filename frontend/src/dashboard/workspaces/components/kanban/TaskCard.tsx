import { useDrag } from 'react-dnd';
import { Calendar, Clock, Flag } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import type { Task } from './type';
interface TaskCardProps {
  task: Task;
}

const priorityConfig = {
  high: { color: 'border-red-500', flag: 'text-red-500', bg: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  medium: { color: 'border-amber-500', flag: 'text-amber-500', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  low: { color: 'border-[#20c937]', flag: 'text-[#20c937]', bg: 'bg-[#20c937]/10 text-[#20c937]' },
};

export function TaskCard({ task }: TaskCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const config = priorityConfig[task.priority];

  return (
    <div
      ref={(node) => {
        drag(node);
      }}
      className={`bg-white/90 dark:bg-[#1a1a1a]/95 backdrop-blur-md rounded-xl shadow-sm border-l-4 ${config.color} border-t border-r border-b border-black/[0.06] dark:border-white/10 p-4 cursor-move hover:shadow-md transition-all text-slate-900 dark:text-white ${
        isDragging ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'
      }`}
    >
      {/* Task Title */}
      <h4 className="font-medium mb-3 line-clamp-2 text-slate-900 dark:text-white">{task.title}</h4>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.labels.map((label, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5 bg-black/[0.05] dark:bg-white/10 text-slate-700 dark:text-slate-300 border-none">
              {label}
            </Badge>
          ))}
        </div>
      )}

      {/* Bottom Section */}
      <div className="flex items-center justify-between mt-auto">
        {/* Assignee */}
        <Avatar className="w-7 h-7 border border-white dark:border-[#121212]">
          <AvatarFallback className={`${task.assignee.color} text-white text-xs font-bold`}>
            {task.assignee.avatar}
          </AvatarFallback>
        </Avatar>

        <div className="flex items-center gap-2">
          {/* Priority Flag */}
          <Flag className={`w-4 h-4 ${config.flag} fill-current`} />
          
          {/* Due Date */}
          <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
            <Calendar className="w-3 h-3" />
            <span>{task.dueDate}</span>
          </div>

          {/* Time Tracker */}
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${config.bg}`}>
            <Clock className="w-3 h-3" />
            <span className="font-semibold">{task.timeTracked}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
