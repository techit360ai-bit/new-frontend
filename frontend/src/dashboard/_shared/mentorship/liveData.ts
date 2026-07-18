export interface Mentee {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: "active" | "pending" | "completed";
  progress: number;
  joinedDate: string;
  skills: string[];
  goals: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  status: "pending" | "in-progress" | "completed" | "overdue";
  priority: "low" | "medium" | "high";
  reward?: string;
}

export interface MentorshipRoom {
  id: string;
  name: string;
  description: string;
  mentor: { name: string; avatar: string; expertise: string[] };
  menteeCount: number;
  paymentModel: "hourly" | "monthly" | "equity" | "hybrid";
  rate?: string;
  equityPercentage?: number;
  capacity: number;
  createdDate: string;
}

export interface Application {
  id: string;
  applicantName: string;
  email: string;
  avatar: string;
  appliedDate: string;
  roomId: string;
  roomName: string;
  coverLetter: string;
  skills: string[];
  experience: string;
  status: "pending" | "accepted" | "rejected";
}

export const mentees: Mentee[] = [];
export const tasks: Task[] = [];
export const rooms: MentorshipRoom[] = [];
export const applications: Application[] = [];

export const analyticsData = {
  totalMentees: 0,
  activeMentees: 0,
  completedMentees: 0,
  totalRevenue: 0,
  equityDistributed: 0,
  averageProgress: 0,
  tasksCompleted: 0,
  totalTasks: 0,
  monthlyGrowth: [] as Array<{ month: string; mentees: number; revenue: number }>,
};
