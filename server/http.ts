import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function asyncHandler<T extends Request>(
  handler: (req: T, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return ((req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req as T, res, next)).catch(next);
  }) as RequestHandler;
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: error.errors.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message, details: error.details });
  }

  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
}
