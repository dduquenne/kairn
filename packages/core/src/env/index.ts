/**
 * Environment Variable Validation
 *
 * Validates environment variables at startup to catch configuration
 * errors early and provide clear error messages.
 */

import { z } from 'zod';

/**
 * Schema for server-side environment variables
 */
const serverEnvSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z
    .string()
    .url()
    .refine(url => url.startsWith('postgresql://') || url.startsWith('postgres://'), {
      message: 'DATABASE_URL must be a valid PostgreSQL connection string',
    })
    .optional(),

  // Authentication - JWT secrets should be at least 32 characters
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters')
    .optional(),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters')
    .optional(),
  JWT_PASSWORD_RESET_SECRET: z
    .string()
    .min(32, 'JWT_PASSWORD_RESET_SECRET must be at least 32 characters')
    .optional(),

  // Email
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().optional(),

  // Storage
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),

  // AI Services
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Security
  RECAPTCHA_SITE_KEY: z.string().optional(),
  RECAPTCHA_SECRET_KEY: z.string().optional(),
  SOCIAL_ENCRYPTION_KEY: z.string().optional(),
  SECRETS_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'SECRETS_ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
    .optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().optional(),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().positive().optional(),
});

/**
 * Schema for client-side (public) environment variables
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

/**
 * Combined schema for all environment variables
 */
const envSchema = serverEnvSchema.merge(clientEnvSchema);

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type Env = z.infer<typeof envSchema>;

/**
 * Validation result type
 */
export interface EnvValidationResult {
  success: boolean;
  data?: Env;
  errors?: Record<string, string[]>;
}

/**
 * Format Zod errors into a readable structure
 */
function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return errors;
}

/**
 * Validate environment variables
 *
 * @param env - Environment object to validate (defaults to process.env)
 * @returns Validation result with parsed data or errors
 */
export function validateEnv(env: Record<string, unknown> = process.env): EnvValidationResult {
  const result = envSchema.safeParse(env);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  };
}

/**
 * Validate and throw on invalid environment
 *
 * Call this at application startup to fail fast on missing/invalid configuration.
 * In development, missing optional variables are logged as warnings.
 * In production, critical variables cause the process to exit.
 */
export function assertValidEnv(env: Record<string, unknown> = process.env): Env {
  const result = validateEnv(env);

  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error('\n❌ Invalid environment variables:\n');

    for (const [key, messages] of Object.entries(result.errors || {})) {
      // eslint-disable-next-line no-console
      console.error(`  ${key}:`);
      for (const message of messages) {
        // eslint-disable-next-line no-console
        console.error(`    - ${message}`);
      }
    }

    // eslint-disable-next-line no-console
    console.error('\n');

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }

    throw new Error('Invalid environment variables');
  }

  return result.data!;
}

/**
 * Check if required production variables are set
 * Returns warnings for optional variables that should be configured
 */
export function checkProductionReadiness(env: Record<string, unknown> = process.env): {
  ready: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Critical for production
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  for (const key of required) {
    if (!env[key]) {
      missing.push(key);
    }
  }

  // Recommended for production
  const recommended = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'RESEND_API_KEY',
    'RECAPTCHA_SECRET_KEY',
    'SECRETS_ENCRYPTION_KEY',
  ];
  for (const key of recommended) {
    if (!env[key]) {
      warnings.push(`${key} is not set (recommended for production)`);
    }
  }

  // Security checks
  if (env['JWT_SECRET'] && String(env['JWT_SECRET']).length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters');
  }

  return {
    ready: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Get a typed environment variable with fallback
 */
export function getEnv<K extends keyof Env>(key: K, fallback?: Env[K]): Env[K] | undefined {
  const value = process.env[key];
  if (value === undefined || value === '') {
    return fallback;
  }
  return value as Env[K];
}

/**
 * Get a required environment variable (throws if missing)
 */
export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value as NonNullable<Env[K]>;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in test environment
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}
