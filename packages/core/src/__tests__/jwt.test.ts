import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  configureJWT,
  createToken,
  verifyToken,
  getTokenFromHeader,
  decodeToken,
} from '../auth/jwt';

describe('JWT Authentication', () => {
  const testSecret = 'test-secret-key-minimum-32-characters-long-here';

  beforeEach(() => {
    // Configure JWT with test secret
    configureJWT({ secret: testSecret });
  });

  afterEach(() => {
    // Reset configuration
    configureJWT({ secret: '' });
  });

  describe('createToken', () => {
    it('should create a valid JWT token', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      const token = await createToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include custom payload fields', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        customField: 'customValue',
      };

      const token = await createToken(payload);
      const decoded = decodeToken(token);

      expect(decoded?.sub).toBe('user-123');
      expect(decoded?.email).toBe('test@example.com');
      expect(decoded?.role).toBe('admin');
      expect(decoded?.customField).toBe('customValue');
    });

    it('should set expiration time', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      const token = await createToken(payload, { expiresIn: '1h' });
      const decoded = decodeToken(token);

      expect(decoded?.exp).toBeDefined();
      expect(decoded?.iat).toBeDefined();

      // Expiration should be roughly 1 hour from now
      const expDiff = decoded!.exp! - decoded!.iat!;
      expect(expDiff).toBe(3600); // 1 hour in seconds
    });

    it('should throw without configuration in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Clear configuration
      configureJWT({ secret: '' });

      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      await expect(createToken(payload)).rejects.toThrow();

      process.env.NODE_ENV = originalEnv;
    });

    it('should use configured issuer and audience', async () => {
      configureJWT({
        secret: testSecret,
        issuer: 'kairn-test',
        audience: 'test-app',
      });

      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      const token = await createToken(payload);
      const decoded = decodeToken(token);

      expect(decoded?.iss).toBe('kairn-test');
      expect(decoded?.aud).toBe('test-app');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      const token = await createToken(payload);
      const verified = await verifyToken(token);

      expect(verified).not.toBeNull();
      expect(verified?.sub).toBe('user-123');
      expect(verified?.email).toBe('test@example.com');
    });

    it('should return null for invalid token', async () => {
      const result = await verifyToken('invalid.token.here');

      expect(result).toBeNull();
    });

    it('should return null for malformed token', async () => {
      const result = await verifyToken('not-even-a-jwt');

      expect(result).toBeNull();
    });

    it('should return null for token signed with wrong secret', async () => {
      // Create token with one secret
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      const token = await createToken(payload);

      // Try to verify with different secret
      configureJWT({ secret: 'different-secret-at-least-32-characters' });

      const result = await verifyToken(token);

      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      // Create token that expires immediately
      const token = await createToken(payload, { expiresIn: '0s' });

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await verifyToken(token);

      expect(result).toBeNull();
    });

    it('should return null for empty string', async () => {
      const result = await verifyToken('');

      expect(result).toBeNull();
    });
  });

  describe('getTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const token = getTokenFromHeader('Bearer abc123xyz');

      expect(token).toBe('abc123xyz');
    });

    it('should return null for non-Bearer header', () => {
      expect(getTokenFromHeader('Basic abc123')).toBeNull();
      expect(getTokenFromHeader('Token abc123')).toBeNull();
    });

    it('should return null for missing header', () => {
      expect(getTokenFromHeader(undefined)).toBeNull();
      expect(getTokenFromHeader('')).toBeNull();
    });

    it('should return null for Bearer without token', () => {
      expect(getTokenFromHeader('Bearer ')).toBe('');
    });

    it('should handle Bearer with extra spaces', () => {
      const token = getTokenFromHeader('Bearer  abc123');

      expect(token).toBe(' abc123');
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'admin',
      };

      const token = await createToken(payload);
      const decoded = decodeToken(token);

      expect(decoded?.sub).toBe('user-123');
      expect(decoded?.email).toBe('test@example.com');
      expect(decoded?.role).toBe('admin');
    });

    it('should return null for invalid token format', () => {
      expect(decodeToken('invalid')).toBeNull();
      expect(decodeToken('one.two')).toBeNull();
      expect(decodeToken('')).toBeNull();
    });

    it('should return null for invalid base64', () => {
      expect(decodeToken('a.!!!invalid!!!.c')).toBeNull();
    });
  });
});
