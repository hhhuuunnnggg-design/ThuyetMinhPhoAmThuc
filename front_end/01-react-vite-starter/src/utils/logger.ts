// utils/logger.ts
// Centralized logging utility

type LogLevel = "log" | "error" | "warn" | "info" | "debug";

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private logMessage(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.isDevelopment) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case "error":
        console.error(prefix, message, ...args);
        break;
      case "warn":
        console.warn(prefix, message, ...args);
        break;
      case "info":
        console.info(prefix, message, ...args);
        break;
      case "debug":
        console.debug(prefix, message, ...args);
        break;
      default:
        console.log(prefix, message, ...args);
    }
  }

  log(message: string, ...args: unknown[]): void {
    this.logMessage("log", message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.logMessage("error", message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.logMessage("warn", message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.logMessage("info", message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    this.logMessage("debug", message, ...args);
  }
}

export const logger = new Logger();
