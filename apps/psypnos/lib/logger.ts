/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Structured Logger for Psypnos
 *
 * Provides consistent, structured logging across the application
 * with log levels, timestamps, and context enrichment.
 *
 * In production, logs can be sent to external services (Sentry, DataDog, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Log levels priority
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level based on environment
const MIN_LOG_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

/**
 * Format error object for logging
 */
function formatError(error: unknown): LogEntry['error'] | undefined {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error,
    };
  }
  return undefined;
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    error: formatError(error),
  };
}

/**
 * Check if log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

/**
 * Output log entry
 */
function outputLog(entry: LogEntry): void {
  const { level, message, context, error, timestamp } = entry;

  // Format for console output
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  if (level === 'error') {
    console.error(prefix, message, context ? JSON.stringify(context) : '', error || '');
  } else if (level === 'warn') {
    console.warn(prefix, message, context ? JSON.stringify(context) : '');
  } else if (level === 'info') {
    console.info(prefix, message, context ? JSON.stringify(context) : '');
  } else {
    console.debug(prefix, message, context ? JSON.stringify(context) : '');
  }

  // In production, send to external logging service
  // if (process.env.NODE_ENV === 'production') {
  //   sendToExternalService(entry);
  // }
}

/**
 * Logger class for scoped logging
 */
class Logger {
  private scope: string;
  private defaultContext: LogContext;

  constructor(scope: string, defaultContext: LogContext = {}) {
    this.scope = scope;
    this.defaultContext = defaultContext;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: unknown): void {
    if (!shouldLog(level)) return;

    const entry = createLogEntry(level, `[${this.scope}] ${message}`, {
      ...this.defaultContext,
      ...context,
    }, error);

    outputLog(entry);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger(this.scope, {
      ...this.defaultContext,
      ...additionalContext,
    });
  }
}

/**
 * Create a scoped logger
 */
export function createLogger(scope: string, defaultContext?: LogContext): Logger {
  return new Logger(scope, defaultContext);
}

// Pre-configured loggers for common modules
export const authLogger = createLogger('Auth');
export const analyticsLogger = createLogger('Analytics');
export const apiLogger = createLogger('API');
export const dbLogger = createLogger('Database');
export const securityLogger = createLogger('Security');

// Default logger
export const logger = createLogger('App');

export default logger;
