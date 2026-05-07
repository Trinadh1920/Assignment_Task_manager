import { ProjectRole } from "@prisma/client";
import { prisma } from "./db.js";
import { HttpError } from "./http.js";

export async function getMembership(projectId: string, userId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    include: { user: { select: { id: true, name: true, email: true } } }
  });

  if (!membership) {
    throw new HttpError(403, "You are not a member of this project");
  }

  return membership;
}

export async function requireProjectAdmin(projectId: string, userId: string) {
  const membership = await getMembership(projectId, userId);
  if (membership.role !== ProjectRole.ADMIN) {
    throw new HttpError(403, "Admin access required");
  }
  return membership;
}
