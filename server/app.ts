import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { config } from "./config.js";
import { errorHandler, HttpError } from "./http.js";
import { authRoutes } from "./routes/authRoutes.js";
import { projectRoutes } from "./routes/projectRoutes.js";
import { taskRoutes } from "./routes/taskRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(
    cors({
      origin: config.nodeEnv === "production" ? false : config.clientOrigin
    })
  );
  app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api", taskRoutes);
  app.use("/api", dashboardRoutes);

  const clientDir = path.resolve(__dirname, "../client");
  app.use(express.static(clientDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next(new HttpError(404, "API route not found"));
    }
    res.sendFile(path.join(clientDir, "index.html"));
  });

  app.use(errorHandler);
  return app;
}
