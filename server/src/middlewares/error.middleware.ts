import { Request, Response, NextFunction } from "express";
import { Logger } from "../utils/logger";

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "APIError";
  }
}

/**
 * Error handling middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  Logger.error("Error:", err);

  // Handle specific API errors
  if (err instanceof APIError) {
    res.status(err.statusCode).json({
      error: err.message,
      status: "error",
    });
    return;
  }

  // Handle OpenAI API errors
  if (err.name === "APIError" && "status" in (err as any)) {
    const openAIError = err as any;
    res.status(openAIError.status || 500).json({
      error: openAIError.message,
      status: "error",
      details: openAIError.details,
    });
    return;
  }

  // Default error handler
  res.status(500).json({
    error: "An unexpected error occurred",
    status: "error",
    message: err.message,
  });
};
