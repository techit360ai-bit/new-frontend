import type { AgentTaskStatus } from '../../lib/types';

export interface Task {
  id: string;
  title: string;
  assignee: {
    name: string;
    avatar: string;
    color: string;
  };
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  status: AgentTaskStatus;
  labels?: string[];
}
