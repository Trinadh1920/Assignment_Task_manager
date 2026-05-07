import type { TaskStatus } from "@prisma/client";

export type DashboardTask = {
  status: TaskStatus;
  dueDate: Date;
  assigneeId: string;
};

export type DashboardMember = {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export function buildDashboard(tasks: DashboardTask[], members: DashboardMember[], now = new Date()) {
  const byStatus = {
    TODO: 0,
    IN_PROGRESS: 0,
    DONE: 0
  };

  for (const task of tasks) {
    byStatus[task.status] += 1;
  }

  const tasksPerUser = members.map((member) => ({
    userId: member.userId,
    name: member.user.name,
    email: member.user.email,
    count: tasks.filter((task) => task.assigneeId === member.userId).length
  }));

  return {
    totalTasks: tasks.length,
    byStatus,
    tasksPerUser,
    overdueTasks: tasks.filter((task) => task.status !== "DONE" && task.dueDate < now).length
  };
}
