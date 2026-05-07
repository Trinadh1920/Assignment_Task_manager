import { Router } from "express";
import { ProjectRole } from "@prisma/client";
import { requireAuth, type AuthenticatedRequest } from "../auth.js";
import { getMembership } from "../authorization.js";
import { prisma } from "../db.js";
import { asyncHandler } from "../http.js";
import { buildDashboard } from "../dashboard.js";

export const dashboardRoutes = Router();

dashboardRoutes.use(requireAuth);

dashboardRoutes.get(
  "/projects/:projectId/dashboard",
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const membership = await getMembership(req.params.projectId, req.user.id);
    const scope =
      membership.role === ProjectRole.ADMIN
        ? { projectId: req.params.projectId }
        : { projectId: req.params.projectId, assigneeId: req.user.id };

    const [tasks, members] = await Promise.all([
      prisma.task.findMany({ where: scope, select: { status: true, dueDate: true, assigneeId: true } }),
      prisma.projectMember.findMany({
        where:
          membership.role === ProjectRole.ADMIN
            ? { projectId: req.params.projectId }
            : { projectId: req.params.projectId, userId: req.user.id },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" }
      })
    ]);

    res.json({ dashboard: buildDashboard(tasks, members) });
  })
);
