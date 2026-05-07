import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160).transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128)
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(160).transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(128)
});

export const projectCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal(""))
});

export const joinProjectSchema = z.object({
  inviteCode: z.string().trim().min(4).max(24)
});

export const addMemberSchema = z.object({
  email: z.string().trim().email().max(160).transform((email) => email.toLowerCase()),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER")
});

export const taskCreateSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  dueDate: z.string().datetime(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  assigneeId: z.string().min(1)
});

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  assigneeId: z.string().min(1).optional()
});
