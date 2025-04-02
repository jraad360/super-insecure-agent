import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { agentRouter } from "./routes/agent.routes";
import { memoryRouter } from "./routes/memory.routes";
import { errorHandler } from "./middlewares/error.middleware";
import { Logger } from "./utils/logger";

const app = express();

// Configure CORS options with proper origin validation
const corsOptions = {
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Get allowed origins from environment or default to empty array
    const allowedOriginsStr = env.ALLOWED_ORIGINS || '';
    const allowedOrigins = allowedOriginsStr ? allowedOriginsStr.split(',').map(o => o.trim()) : [];
    
    // In development mode, allow all origins
    if (env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }
    
    // In production mode
    if (allowedOrigins.length === 0) {
      // If no allowed origins are configured, warn but allow all (maintains backward compatibility)
      Logger.warn('CORS is configured to allow all origins in production. Configure ALLOWED_ORIGINS for security.');
      callback(null, true);
    } else if (!origin) {
      // Allow requests with no origin (like mobile apps or curl requests)
      callback(null, true);
    } else if (allowedOrigins.indexOf(origin) !== -1) {
      // Allow specific origin
      callback(null, true);
    } else {
      // Origin not allowed
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
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