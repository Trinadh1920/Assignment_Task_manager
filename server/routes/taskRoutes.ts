import { Router } from "express";
import { ProjectRole } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAuth, type AuthenticatedRequest } from "../auth.js";
import { asyncHandler, HttpError } from "../http.js";
import { taskCreateSchema, taskUpdateSchema } from "../validators.js";
import { getMembership, requireProjectAdmin } from "../authorization.js";

export const taskRoutes = Router();

taskRoutes.use(requireAuth);

taskRoutes.get(
  "/projects/:projectId/tasks",
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const membership = await getMembership(req.params.projectId, req.user.id);
    const tasks = await prisma.task.findMany({
      where: {
        projectId: req.params.projectId,
        ...(membership.role === ProjectRole.ADMIN ? {} : { assigneeId: req.user.id })
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } }
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }]
    });

    res.json({ tasks });
  })
);

taskRoutes.post(
  "/projects/:projectId/tasks",
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    await requireProjectAdmin(req.params.projectId, req.user.id);
    const input = taskCreateSchema.parse(req.body);
    const assignee = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: input.assigneeId, projectId: req.params.projectId } }
    });
    if (!assignee) {
      throw new HttpError(400, "Task assignee must be a project member");
    }

    const task = await prisma.task.create({
      data: {
        projectId: req.params.projectId,
        creatorId: req.user.id,
        assigneeId: input.assigneeId,
        title: input.title,
        description: input.description || null,
        dueDate: new Date(input.dueDate),
        priority: input.priority
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json({ task });
  })
);

taskRoutes.patch(
  "/tasks/:taskId",
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const input = taskUpdateSchema.parse(req.body);
    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      include: { project: true }
    });
    if (!task) {
      throw new HttpError(404, "Task not found");
    }

    const membership = await getMembership(task.projectId, req.user.id);
    const isAdmin = membership.role === ProjectRole.ADMIN;
    const isAssignee = task.assigneeId === req.user.id;

    if (!isAdmin) {
      if (!isAssignee) {
        throw new HttpError(403, "Members can update only their assigned tasks");
      }
      const requestedFields = Object.keys(input);
      if (requestedFields.some((field) => field !== "status")) {
        throw new HttpError(403, "Members can update task status only");
      }
    }

    if (isAdmin && input.assigneeId) {
      const assignee = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: input.assigneeId, projectId: task.projectId } }
      });
      if (!assignee) {
        throw new HttpError(400, "Task assignee must be a project member");
      }
    }

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {}),
        ...(input.priority ? { priority: input.priority } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.assigneeId ? { assigneeId: input.assigneeId } : {})
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } }
      }
    });

    res.json({ task: updated });
  })
);

taskRoutes.delete(
  "/tasks/:taskId",
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task) {
      throw new HttpError(404, "Task not found");
    }

    await requireProjectAdmin(task.projectId, req.user.id);
    await prisma.task.delete({ where: { id: task.id } });
    res.status(204).send();
  })
);
