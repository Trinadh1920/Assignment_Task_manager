import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { asyncHandler, HttpError } from "../http.js";
import { loginSchema, signupSchema } from "../validators.js";
import { requireAuth, signToken, type AuthenticatedRequest } from "../auth.js";

export const authRoutes = Router();

function publicUser(user: { id: string; name: string; email: string }) {
  return { id: user.id, name: user.name, email: user.email };
}

authRoutes.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const input = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new HttpError(409, "Email is already registered");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash },
      select: { id: true, name: true, email: true }
    });

    res.status(201).json({ token: signToken({ id: user.id, email: user.email }), user: publicUser(user) });
  })
);

authRoutes.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new HttpError(401, "Invalid email or password");
    }

    res.json({
      token: signToken({ id: user.id, email: user.email }),
      user: publicUser(user)
    });
  })
);

authRoutes.get(
  "/me",
  requireAuth,
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      throw new HttpError(401, "User no longer exists");
    }

    res.json({ user: publicUser(user) });
  })
);
