export type User = {
  id: string;
  name: string;
  email: string;
};

export type ProjectRole = "ADMIN" | "MEMBER";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type ProjectSummary = {
  id: string;
  name: string;
  description?: string | null;
  inviteCode: string;
  role: ProjectRole;
  taskCount: number;
  memberCount: number;
};

export type ProjectMember = {
  id: string;
  userId: string;
  projectId: string;
  role: ProjectRole;
  user: User;
};

export type ProjectDetail = {
  id: string;
  name: string;
  description?: string | null;
  inviteCode: string;
  members: ProjectMember[];
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string;
  assignee: User;
  creator: User;
};

export type Dashboard = {
  totalTasks: number;
  byStatus: Record<TaskStatus, number>;
  tasksPerUser: Array<{ userId: string; name: string; email: string; count: number }>;
  overdueTasks: number;
};
