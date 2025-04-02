import dotenv from "dotenv";

dotenv.config();

// Always use port 3001
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

export const env = {
  PORT,
  NODE_ENV,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
};

// Validate required environment variables
const requiredEnvVars = ["OPENAI_API_KEY"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}
