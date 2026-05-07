import { Router } from "express";
import crypto from "node:crypto";
import { ProjectRole } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAuth, type AuthenticatedRequest } from "../auth.js";
import { asyncHandler, HttpError } from "../http.js";
import { addMemberSchema, joinProjectSchema, projectCreateSchema } from "../validators.js";
import { getMembership, requireProjectAdmin } from "../authorization.js";

export const projectRoutes = Router();

projectRoutes.use(requireAuth);

function inviteCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

projectRoutes.get(
  "/",
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            _count: { select: { tasks: true, members: true } }
          }
        }
      },
      orderBy: { joinedAt: "desc" }
    });

    res.json({
      projects: memberships.map((membership) => ({
        id: membership.project.id,
        name: membership.project.name,
        description: membership.project.description,
        inviteCode: membership.project.inviteCode,
        role: membership.role,
        taskCount: membership.project._count.tasks,
        memberCount: membership.project._count.members
      }))
    });
  })
);

projectRoutes.post(
  "/",
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const input = projectCreateSchema.parse(req.body);
    const project = await prisma.project.create({
      data: {
        name: input.name,
        description: input.description || null,
        creatorId: req.user.id,
        inviteCode: inviteCode(),
        members: { create: { userId: req.user.id, role: ProjectRole.ADMIN } }
      }
    });

    res.status(201).json({ project });
  })
);

projectRoutes.post(
  "/join",
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const input = joinProjectSchema.parse(req.body);
    const project = await prisma.project.findUnique({ where: { inviteCode: input.inviteCode } });
    if (!project) {
      throw new HttpError(404, "Project invite code not found");
    }

    const membership = await prisma.projectMember.upsert({
      where: { userId_projectId: { userId: req.user.id, projectId: project.id } },
      update: {},
      create: { userId: req.user.id, projectId: project.id, role: ProjectRole.MEMBER }
    });

    res.status(201).json({ project, role: membership.role });
  })
);

projectRoutes.get(
  "/:projectId",
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const membership = await getMembership(req.params.projectId, req.user.id);
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { joinedAt: "asc" }
        }
      }
    });

    if (!project) {
      throw new HttpError(404, "Project not found");
    }

    res.json({ project, role: membership.role });
  })
);

projectRoutes.post(
  "/:projectId/members",
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    await requireProjectAdmin(req.params.projectId, req.user.id);
    const input = addMemberSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new HttpError(404, "No registered user exists with that email");
    }

    const member = await prisma.projectMember.upsert({
      where: { userId_projectId: { userId: user.id, projectId: req.params.projectId } },
      update: { role: input.role },
      create: { userId: user.id, projectId: req.params.projectId, role: input.role },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    res.status(201).json({ member });
  })
);

projectRoutes.delete(
  "/:projectId/members/:userId",
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    await requireProjectAdmin(req.params.projectId, req.user.id);
    if (req.params.userId === req.user.id) {
      throw new HttpError(400, "Admins cannot remove themselves");
    }

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.params.userId, projectId: req.params.projectId } }
    });
    if (!membership) {
      throw new HttpError(404, "Member not found");
    }

    await prisma.projectMember.delete({ where: { id: membership.id } });
    res.status(204).send();
  })
);
