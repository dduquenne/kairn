import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateEnv,
  assertValidEnv,
  checkProductionReadiness,
  getEnv,
  requireEnv,
  isProduction,
  isDevelopment,
  isTest,
} from '../env';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    it('should pass with valid environment variables', () => {
      const env = {
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        JWT_SECRET: 'this-is-a-test-secret-that-is-at-least-32-chars',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      };

      const result = validateEnv(env);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should fail with invalid DATABASE_URL', () => {
      const env = {
        NODE_ENV: 'development',
        DATABASE_URL: 'mysql://user:pass@localhost:3306/db',
      };

      const result = validateEnv(env);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty('DATABASE_URL');
    });

    it('should fail with short JWT_SECRET', () => {
      const env = {
        NODE_ENV: 'development',
        JWT_SECRET: 'too-short',
      };

      const result = validateEnv(env);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty('JWT_SECRET');
    });

    it('should accept valid NODE_ENV values', () => {
      expect(validateEnv({ NODE_ENV: 'development' }).success).toBe(true);
      expect(validateEnv({ NODE_ENV: 'production' }).success).toBe(true);
      expect(validateEnv({ NODE_ENV: 'test' }).success).toBe(true);
    });

    it('should reject invalid NODE_ENV', () => {
      const result = validateEnv({ NODE_ENV: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty('NODE_ENV');
    });

    it('should use defaults for optional values', () => {
      const result = validateEnv({});

      expect(result.success).toBe(true);
      expect(result.data?.NODE_ENV).toBe('development');
      expect(result.data?.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
    });

    it('should validate email format for EMAIL_FROM_ADDRESS', () => {
      const result = validateEnv({
        EMAIL_FROM_ADDRESS: 'not-an-email',
      });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty('EMAIL_FROM_ADDRESS');
    });

    it('should validate URL format for SUPABASE_URL', () => {
      const result = validateEnv({
        SUPABASE_URL: 'not-a-url',
      });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty('SUPABASE_URL');
    });
  });

  describe('assertValidEnv', () => {
    it('should return validated env on success', () => {
      const env = {
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      };

      const result = assertValidEnv(env);

      expect(result.NODE_ENV).toBe('test');
    });

    it('should throw on invalid env in development', () => {
      const env = {
        NODE_ENV: 'development',
        JWT_SECRET: 'short',
      };

      expect(() => assertValidEnv(env)).toThrow('Invalid environment variables');
    });
  });

  describe('checkProductionReadiness', () => {
    it('should report missing required variables', () => {
      const result = checkProductionReadiness({});

      expect(result.ready).toBe(false);
      expect(result.missing).toContain('DATABASE_URL');
      expect(result.missing).toContain('JWT_SECRET');
    });

    it('should report ready when required vars are set', () => {
      const env = {
        DATABASE_URL: 'postgresql://prod:prod@localhost:5432/prod',
        JWT_SECRET: 'production-secret-that-is-at-least-32-characters',
      };

      const result = checkProductionReadiness(env);

      expect(result.ready).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should warn about recommended variables', () => {
      const env = {
        DATABASE_URL: 'postgresql://prod:prod@localhost:5432/prod',
        JWT_SECRET: 'production-secret-that-is-at-least-32-characters',
      };

      const result = checkProductionReadiness(env);

      expect(result.warnings.some((w) => w.includes('JWT_ACCESS_SECRET'))).toBe(true);
      expect(result.warnings.some((w) => w.includes('RESEND_API_KEY'))).toBe(true);
    });

    it('should warn about short JWT_SECRET', () => {
      const env = {
        DATABASE_URL: 'postgresql://prod:prod@localhost:5432/prod',
        JWT_SECRET: 'short',
      };

      const result = checkProductionReadiness(env);

      expect(result.warnings.some((w) => w.includes('32 characters'))).toBe(true);
    });
  });

  describe('getEnv', () => {
    it('should return environment variable value', () => {
      process.env.NODE_ENV = 'test';

      expect(getEnv('NODE_ENV')).toBe('test');
    });

    it('should return fallback for missing variable', () => {
      delete process.env.CUSTOM_VAR;

      expect(getEnv('OPENAI_API_KEY', 'default')).toBe('default');
    });

    it('should return undefined without fallback', () => {
      delete process.env.OPENAI_API_KEY;

      expect(getEnv('OPENAI_API_KEY')).toBeUndefined();
    });
  });

  describe('requireEnv', () => {
    it('should return value when present', () => {
      process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';

      expect(requireEnv('JWT_SECRET')).toBe('test-secret-at-least-32-characters-long');
    });

    it('should throw when missing', () => {
      delete process.env.JWT_SECRET;

      expect(() => requireEnv('JWT_SECRET')).toThrow('Missing required environment variable');
    });

    it('should throw when empty string', () => {
      process.env.JWT_SECRET = '';

      expect(() => requireEnv('JWT_SECRET')).toThrow('Missing required environment variable');
    });
  });

  describe('Environment checks', () => {
    it('isProduction should return true in production', () => {
      process.env.NODE_ENV = 'production';
      expect(isProduction()).toBe(true);
      expect(isDevelopment()).toBe(false);
      expect(isTest()).toBe(false);
    });

    it('isDevelopment should return true in development', () => {
      process.env.NODE_ENV = 'development';
      expect(isProduction()).toBe(false);
      expect(isDevelopment()).toBe(true);
      expect(isTest()).toBe(false);
    });

    it('isTest should return true in test', () => {
      process.env.NODE_ENV = 'test';
      expect(isProduction()).toBe(false);
      expect(isDevelopment()).toBe(false);
      expect(isTest()).toBe(true);
    });
  });
});
