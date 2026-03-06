import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@kairn/core', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
    withScope: vi.fn(),
  }),
}));

import { generateCSRFToken, validateCSRFToken } from '../with-csrf';

describe('CSRF Middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.CSRF_SECRET = 'test-csrf-secret-that-is-at-least-32-characters';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getCSRFSecret (via generateCSRFToken)', () => {
    it('should throw when CSRF_SECRET is not defined', () => {
      delete process.env.CSRF_SECRET;
      delete process.env.JWT_SECRET;

      expect(() => generateCSRFToken()).toThrow('CSRF_SECRET must be defined');
    });

    it('should NOT fallback to JWT_SECRET', () => {
      delete process.env.CSRF_SECRET;
      process.env.JWT_SECRET = 'jwt-secret-that-should-not-be-used-for-csrf';

      expect(() => generateCSRFToken()).toThrow('CSRF_SECRET must be defined');
    });

    it('should use CSRF_SECRET when defined', () => {
      process.env.CSRF_SECRET = 'a-valid-csrf-secret-at-least-32-characters';

      expect(() => generateCSRFToken()).not.toThrow();
    });

    it('should use config secret over env variable', () => {
      const token = generateCSRFToken({ secret: 'config-secret-at-least-32-chars-long' });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('generateCSRFToken', () => {
    it('should generate a valid base64 token', () => {
      const token = generateCSRFToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      expect(decoded).toHaveProperty('value');
      expect(decoded).toHaveProperty('timestamp');
      expect(decoded).toHaveProperty('signature');
    });

    it('should generate unique tokens on each call', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('validateCSRFToken', () => {
    it('should validate a freshly generated token', () => {
      const token = generateCSRFToken();
      const isValid = validateCSRFToken(token);

      expect(isValid).toBe(true);
    });

    it('should reject null token', () => {
      expect(validateCSRFToken(null)).toBe(false);
    });

    it('should reject undefined token', () => {
      expect(validateCSRFToken(undefined)).toBe(false);
    });

    it('should reject empty string token', () => {
      expect(validateCSRFToken('')).toBe(false);
    });

    it('should reject tampered token', () => {
      const token = generateCSRFToken();
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      decoded.value = 'tampered-value';
      const tampered = Buffer.from(JSON.stringify(decoded)).toString('base64');

      expect(validateCSRFToken(tampered)).toBe(false);
    });

    it('should reject expired token', () => {
      const token = generateCSRFToken();
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      decoded.timestamp = Date.now() - 7200 * 1000;
      const expired = Buffer.from(JSON.stringify(decoded)).toString('base64');

      expect(validateCSRFToken(expired)).toBe(false);
    });

    it('should reject token signed with different secret', () => {
      const token = generateCSRFToken({ secret: 'secret-one-at-least-32-characters-long' });
      const isValid = validateCSRFToken(token, {
        secret: 'secret-two-at-least-32-characters-long',
      });

      expect(isValid).toBe(false);
    });
  });
});
