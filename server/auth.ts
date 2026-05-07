import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { HttpError } from "./http.js";

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthenticatedRequest = Request & {
  user: AuthUser;
};

export function signToken(user: AuthUser) {
  return jwt.sign(user, config.jwtSecret, { expiresIn: "7d" });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    return next(new HttpError(401, "Authentication required"));
  }

  try {
    (req as AuthenticatedRequest).user = jwt.verify(token, config.jwtSecret) as AuthUser;
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}
