import { env } from "../config/env";

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Simple logger utility for the application
 */
export class Logger {
  private static readonly currentLevel =
    LOG_LEVELS[env.LOG_LEVEL as LogLevel] || LOG_LEVELS.info;

  /**
   * Log a debug message
   */
  static debug(message: string, ...args: any[]): void {
    if (Logger.currentLevel <= LOG_LEVELS.debug) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log an info message
   */
  static info(message: string, ...args: any[]): void {
    if (Logger.currentLevel <= LOG_LEVELS.info) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log a warning message
   */
  static warn(message: string, ...args: any[]): void {
    if (Logger.currentLevel <= LOG_LEVELS.warn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Log an error message
   */
  static error(message: string, ...args: any[]): void {
    if (Logger.currentLevel <= LOG_LEVELS.error) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}
