import type { Dashboard, ProjectDetail, ProjectSummary, Task, TaskPriority, TaskStatus, User } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "team-task-manager-token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(payload.error || "Request failed");
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  signup: (body: { name: string; email: string; password: string }) =>
    request<{ token: string; user: User }>("/api/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request<{ user: User }>("/api/auth/me"),
  projects: () => request<{ projects: ProjectSummary[] }>("/api/projects"),
  createProject: (body: { name: string; description?: string }) =>
    request<{ project: ProjectDetail }>("/api/projects", { method: "POST", body: JSON.stringify(body) }),
  joinProject: (body: { inviteCode: string }) =>
    request<{ project: ProjectDetail }>("/api/projects/join", { method: "POST", body: JSON.stringify(body) }),
  project: (projectId: string) => request<{ project: ProjectDetail; role: "ADMIN" | "MEMBER" }>(`/api/projects/${projectId}`),
  addMember: (projectId: string, body: { email: string; role: "ADMIN" | "MEMBER" }) =>
    request<{ member: unknown }>(`/api/projects/${projectId}/members`, { method: "POST", body: JSON.stringify(body) }),
  removeMember: (projectId: string, userId: string) =>
    request<void>(`/api/projects/${projectId}/members/${userId}`, { method: "DELETE" }),
  tasks: (projectId: string) => request<{ tasks: Task[] }>(`/api/projects/${projectId}/tasks`),
  createTask: (
    projectId: string,
    body: { title: string; description?: string; dueDate: string; priority: TaskPriority; assigneeId: string }
  ) => request<{ task: Task }>(`/api/projects/${projectId}/tasks`, { method: "POST", body: JSON.stringify(body) }),
  updateTask: (taskId: string, body: Partial<{ status: TaskStatus; assigneeId: string; dueDate: string; priority: TaskPriority; title: string; description: string }>) =>
    request<{ task: Task }>(`/api/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteTask: (taskId: string) => request<void>(`/api/tasks/${taskId}`, { method: "DELETE" }),
  dashboard: (projectId: string) => request<{ dashboard: Dashboard }>(`/api/projects/${projectId}/dashboard`)
};
