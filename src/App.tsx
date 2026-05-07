import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  LogOut,
  Plus,
  Shield,
  Trash2,
  UserPlus,
  Users
} from "lucide-react";
import { api, getToken, setToken } from "./api";
import type { Dashboard, ProjectDetail, ProjectSummary, Task, TaskPriority, TaskStatus, User } from "./types";

const statusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done"
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High"
};

function todayInput() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const activeProject = useMemo(
    () => projects.find((item) => item.id === activeProjectId) || null,
    [projects, activeProjectId]
  );

  async function refreshProjects(selectFirst = false) {
    const response = await api.projects();
    setProjects(response.projects);
    if (selectFirst && response.projects.length > 0) {
      setActiveProjectId(response.projects[0].id);
    }
  }

  async function refreshProject(projectId: string) {
    const [projectResponse, tasksResponse, dashboardResponse] = await Promise.all([
      api.project(projectId),
      api.tasks(projectId),
      api.dashboard(projectId)
    ]);
    setProject(projectResponse.project);
    setRole(projectResponse.role);
    setTasks(tasksResponse.tasks);
    setDashboard(dashboardResponse.dashboard);
  }

  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then((response) => {
        setUser(response.user);
        return refreshProjects(true);
      })
      .catch(() => setToken(null));
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      refreshProject(activeProjectId).catch((error) => setMessage(error.message));
    } else {
      setProject(null);
      setTasks([]);
      setDashboard(null);
    }
  }, [activeProjectId]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const payload =
        authMode === "signup"
          ? await api.signup({
              name: String(form.get("name") || ""),
              email: String(form.get("email") || ""),
              password: String(form.get("password") || "")
            })
          : await api.login({
              email: String(form.get("email") || ""),
              password: String(form.get("password") || "")
            });
      setToken(payload.token);
      setUser(payload.user);
      await refreshProjects(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api.createProject({
        name: String(form.get("name") || ""),
        description: String(form.get("description") || "")
      });
      formElement.reset();
      await refreshProjects(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Project creation failed");
    }
  }

  async function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api.joinProject({ inviteCode: String(form.get("inviteCode") || "") });
      formElement.reset();
      await refreshProjects(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not join project");
    }
  }

  async function submitMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeProjectId) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api.addMember(activeProjectId, {
        email: String(form.get("email") || ""),
        role: String(form.get("role") || "MEMBER") as "ADMIN" | "MEMBER"
      });
      formElement.reset();
      await Promise.all([refreshProject(activeProjectId), refreshProjects()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add member");
    }
  }

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeProjectId) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api.createTask(activeProjectId, {
        title: String(form.get("title") || ""),
        description: String(form.get("description") || ""),
        dueDate: new Date(`${String(form.get("dueDate"))}T12:00:00.000Z`).toISOString(),
        priority: String(form.get("priority") || "MEDIUM") as TaskPriority,
        assigneeId: String(form.get("assigneeId") || "")
      });
      formElement.reset();
      await refreshProject(activeProjectId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create task");
    }
  }

  async function updateStatus(taskId: string, status: TaskStatus) {
    if (!activeProjectId) return;
    try {
      await api.updateTask(taskId, { status });
      await refreshProject(activeProjectId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update task");
    }
  }

  async function deleteTask(taskId: string) {
    if (!activeProjectId) return;
    try {
      await api.deleteTask(taskId);
      await refreshProject(activeProjectId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete task");
    }
  }

  async function removeMember(userId: string) {
    if (!activeProjectId) return;
    try {
      await api.removeMember(activeProjectId, userId);
      await Promise.all([refreshProject(activeProjectId), refreshProjects()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove member");
    }
  }

  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <div>
            <div className="brand-row">
              <ClipboardList aria-hidden="true" />
              <span>Team Task Manager</span>
            </div>
            <h1>{authMode === "login" ? "Sign in to your workspace" : "Create your account"}</h1>
            <p>Manage projects, assignments, status updates, and project metrics from one dashboard.</p>
          </div>
          <form onSubmit={submitAuth} className="form-grid">
            {authMode === "signup" && (
              <label>
                Name
                <input name="name" autoComplete="name" required minLength={2} />
              </label>
            )}
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Password
              <input name="password" type="password" autoComplete="current-password" required minLength={8} />
            </label>
            {message && <div className="alert">{message}</div>}
            <button className="primary" disabled={loading}>
              {authMode === "login" ? "Sign in" : "Sign up"}
            </button>
            <button className="link-button" type="button" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
              {authMode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand-row compact">
            <ClipboardList aria-hidden="true" />
            <span>Team Tasks</span>
          </div>
          <button
            className="icon-button"
            aria-label="Sign out"
            onClick={() => {
              setToken(null);
              setUser(null);
              setProjects([]);
              setActiveProjectId(null);
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
        <div className="user-block">
          <strong>{user.name}</strong>
          <span>{user.email}</span>
        </div>
        <nav className="project-list" aria-label="Projects">
          {projects.map((item) => (
            <button
              key={item.id}
              className={item.id === activeProjectId ? "project-item active" : "project-item"}
              onClick={() => setActiveProjectId(item.id)}
            >
              <span>{item.name}</span>
              <small>{item.role === "ADMIN" ? "Admin" : "Member"} · {item.taskCount} tasks</small>
            </button>
          ))}
        </nav>
        <form className="sidebar-form" onSubmit={submitProject}>
          <strong>Create project</strong>
          <input name="name" placeholder="Project name" required minLength={2} />
          <textarea name="description" placeholder="Description" rows={3} />
          <button className="secondary">
            <Plus size={16} /> Create
          </button>
        </form>
        <form className="sidebar-form" onSubmit={submitJoin}>
          <strong>Join project</strong>
          <input name="inviteCode" placeholder="Invite code" required />
          <button className="secondary">
            <UserPlus size={16} /> Join
          </button>
        </form>
      </aside>

      <section className="workspace">
        {message && (
          <button className="alert dismissible" onClick={() => setMessage("")}>
            {message}
          </button>
        )}
        {!activeProject || !project ? (
          <section className="empty-state">
            <ClipboardList size={42} />
            <h2>Select or create a project</h2>
            <p>Projects you create make you an admin. Invite codes let registered users join as members.</p>
          </section>
        ) : (
          <>
            <header className="project-header">
              <div>
                <div className="eyebrow">{role === "ADMIN" ? "Admin workspace" : "Member workspace"}</div>
                <h1>{project.name}</h1>
                <p>{project.description || "No project description provided."}</p>
              </div>
              <div className="invite-box">
                <span>Invite code</span>
                <strong>{project.inviteCode}</strong>
              </div>
            </header>

            <section className="metrics-grid">
              <Metric icon={<ClipboardList />} label="Total tasks" value={dashboard?.totalTasks ?? 0} />
              <Metric icon={<BarChart3 />} label="To Do" value={dashboard?.byStatus.TODO ?? 0} />
              <Metric icon={<CheckCircle2 />} label="Done" value={dashboard?.byStatus.DONE ?? 0} />
              <Metric icon={<CalendarClock />} label="Overdue" value={dashboard?.overdueTasks ?? 0} tone="danger" />
            </section>

            <section className="content-grid">
              <div className="panel span-two">
                <div className="panel-header">
                  <div>
                    <h2>Tasks</h2>
                    <p>{role === "ADMIN" ? "All project tasks" : "Tasks assigned to you"}</p>
                  </div>
                </div>
                <div className="task-table">
                  <div className="task-row task-head">
                    <span>Task</span>
                    <span>Assignee</span>
                    <span>Due</span>
                    <span>Status</span>
                    <span></span>
                  </div>
                  {tasks.map((task) => (
                    <div className="task-row" key={task.id}>
                      <div>
                        <strong>{task.title}</strong>
                        <small>{task.description || "No description"}</small>
                        <span className={`priority ${task.priority.toLowerCase()}`}>{priorityLabels[task.priority]}</span>
                      </div>
                      <span>{task.assignee.name}</span>
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      <select value={task.status} onChange={(event) => updateStatus(task.id, event.target.value as TaskStatus)}>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      {role === "ADMIN" ? (
                        <button className="icon-button danger" aria-label="Delete task" onClick={() => deleteTask(task.id)}>
                          <Trash2 size={17} />
                        </button>
                      ) : (
                        <span />
                      )}
                    </div>
                  ))}
                  {tasks.length === 0 && <div className="empty-row">No tasks in this view.</div>}
                </div>
              </div>

              <div className="panel">
                <h2>Tasks per user</h2>
                <div className="user-metrics">
                  {(dashboard?.tasksPerUser || []).map((item) => (
                    <div key={item.userId}>
                      <span>{item.name}</span>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <h2>Members</h2>
                <div className="member-list">
                  {project.members.map((member) => (
                    <div key={member.id} className="member-row">
                      <div>
                        <strong>{member.user.name}</strong>
                        <small>{member.user.email}</small>
                      </div>
                      <span className="role-pill">
                        <Shield size={14} /> {member.role === "ADMIN" ? "Admin" : "Member"}
                      </span>
                      {role === "ADMIN" && member.userId !== user.id && (
                        <button className="icon-button danger" aria-label="Remove member" onClick={() => removeMember(member.userId)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {role === "ADMIN" && (
                <>
                  <form className="panel form-grid" onSubmit={submitTask}>
                    <h2>Create task</h2>
                    <label>
                      Title
                      <input name="title" required minLength={2} />
                    </label>
                    <label>
                      Description
                      <textarea name="description" rows={3} />
                    </label>
                    <div className="form-pair">
                      <label>
                        Due date
                        <input name="dueDate" type="date" defaultValue={todayInput()} required />
                      </label>
                      <label>
                        Priority
                        <select name="priority" defaultValue="MEDIUM">
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                      </label>
                    </div>
                    <label>
                      Assignee
                      <select name="assigneeId" required>
                        {project.members.map((member) => (
                          <option key={member.userId} value={member.userId}>
                            {member.user.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="primary">
                      <Plus size={16} /> Add task
                    </button>
                  </form>

                  <form className="panel form-grid" onSubmit={submitMember}>
                    <h2>Add member</h2>
                    <label>
                      Registered email
                      <input name="email" type="email" required />
                    </label>
                    <label>
                      Role
                      <select name="role" defaultValue="MEMBER">
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </label>
                    <button className="primary">
                      <Users size={16} /> Add or update
                    </button>
                  </form>
                </>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function Metric({ icon, label, value, tone }: { icon: JSX.Element; label: string; value: number; tone?: "danger" }) {
  return (
    <div className={tone === "danger" ? "metric danger" : "metric"}>
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
