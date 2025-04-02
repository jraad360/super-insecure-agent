import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { agentRouter } from "./routes/agent.routes";
import { memoryRouter } from "./routes/memory.routes";
import { errorHandler } from "./middlewares/error.middleware";
import { Logger } from "./utils/logger";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/agent", agentRouter);
app.use("/api/memory", memoryRouter);

// Health check endpoint
app.get("/health", (req: express.Request, res: express.Response) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
  Logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

// Handle unhandled errors
process.on("unhandledRejection", (err) => {
  Logger.error("Unhandled Rejection:", err);
});

export default app;
