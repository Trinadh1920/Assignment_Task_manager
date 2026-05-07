export const config = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || "dev-only-change-me",
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
};

if (config.nodeEnv === "production" && config.jwtSecret === "dev-only-change-me") {
  throw new Error("JWT_SECRET must be set in production.");
}
