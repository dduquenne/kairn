/**
 * Structured Logger for Kairn
 *
 * Provides consistent, structured logging across the application
 * with log levels, timestamps, and context enrichment.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  scope?: string;
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

export interface LoggerConfig {
  /** Minimum log level to output */
  minLevel?: LogLevel;
  /** Custom output handler */
  output?: (entry: LogEntry) => void;
  /** Enable/disable logging */
  enabled?: boolean;
}

// Global config
let globalConfig: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enabled: true,
};

/**
 * Configure global logger settings
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

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
  scope?: string,
  context?: LogContext,
  error?: unknown
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    scope,
    context,
    error: formatError(error),
  };
}

/**
 * Check if log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  if (!globalConfig.enabled) return false;
  const minLevel = globalConfig.minLevel || 'debug';
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

/**
 * Default output handler
 */
function defaultOutput(entry: LogEntry): void {
  const { level, message, scope, context, error, timestamp } = entry;

  const prefix = scope
    ? `[${timestamp}] [${level.toUpperCase()}] [${scope}]`
    : `[${timestamp}] [${level.toUpperCase()}]`;

  const contextStr = context ? JSON.stringify(context) : '';

  if (level === 'error') {
    console.error(prefix, message, contextStr, error || '');
  } else if (level === 'warn') {
    console.warn(prefix, message, contextStr);
  } else if (level === 'info') {
    console.info(prefix, message, contextStr);
  } else {
    console.debug(prefix, message, contextStr);
  }
}

/**
 * Output log entry
 */
function outputLog(entry: LogEntry): void {
  const output = globalConfig.output || defaultOutput;
  output(entry);
}

/**
 * Logger class for scoped logging
 */
export class Logger {
  private scope: string;
  private defaultContext: LogContext;

  constructor(scope: string, defaultContext: LogContext = {}) {
    this.scope = scope;
    this.defaultContext = defaultContext;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: unknown): void {
    if (!shouldLog(level)) return;

    const entry = createLogEntry(
      level,
      message,
      this.scope,
      { ...this.defaultContext, ...context },
      error
    );

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

  /**
   * Create a child logger with a sub-scope
   */
  withScope(subScope: string): Logger {
    return new Logger(`${this.scope}:${subScope}`, this.defaultContext);
  }
}

/**
 * Create a scoped logger
 */
export function createLogger(scope: string, defaultContext?: LogContext): Logger {
  return new Logger(scope, defaultContext);
}

// Default logger
export const logger = createLogger('App');

export default logger;
