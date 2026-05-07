import { describe, expect, it } from "vitest";
import { buildDashboard } from "./dashboard.js";

describe("buildDashboard", () => {
  it("calculates totals, status buckets, user counts, and overdue tasks", () => {
    const now = new Date("2026-05-05T12:00:00.000Z");
    const dashboard = buildDashboard(
      [
        { status: "TODO", dueDate: new Date("2026-05-04T12:00:00.000Z"), assigneeId: "u1" },
        { status: "IN_PROGRESS", dueDate: new Date("2026-05-06T12:00:00.000Z"), assigneeId: "u2" },
        { status: "DONE", dueDate: new Date("2026-05-01T12:00:00.000Z"), assigneeId: "u1" }
      ],
      [
        { userId: "u1", user: { id: "u1", name: "One", email: "one@example.com" } },
        { userId: "u2", user: { id: "u2", name: "Two", email: "two@example.com" } }
      ],
      now
    );

    expect(dashboard.totalTasks).toBe(3);
    expect(dashboard.byStatus).toEqual({ TODO: 1, IN_PROGRESS: 1, DONE: 1 });
    expect(dashboard.tasksPerUser.map((user) => user.count)).toEqual([2, 1]);
    expect(dashboard.overdueTasks).toBe(1);
  });
});
