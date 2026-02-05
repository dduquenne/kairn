/**
 * Login Handler Tests
 *
 * Tests for the authentication login handler including:
 * - Successful login
 * - Invalid credentials
 * - Rate limiting
 * - Validation errors
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the rate limiter module
const mockGetClientIP = vi.fn().mockReturnValue('127.0.0.1');
vi.mock('../../../middleware/with-rate-limit', () => ({
  withRateLimit: vi.fn(),
  getClientIP: () => mockGetClientIP(),
  RATE_LIMIT_PRESETS: {
    strict: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
    },
  },
}));

// Mock @kairn/core for JWT creation
const mockCreateToken = vi.fn().mockResolvedValue('mock-jwt-token');
vi.mock('@kairn/core', () => ({
  createToken: (...args: unknown[]) => mockCreateToken(...args),
}));

// Import mocked modules after mock setup
import { withRateLimit } from '../../../middleware/with-rate-limit';
import { handleLogin } from '../login';
import type { AuthHandlerConfig } from '../types';

/**
 * Create a mock request with JSON body
 */
function createMockRequest(body: unknown, headers: Record<string, string> = {}): Request {
  const request = {
    json: vi.fn().mockResolvedValue(body),
    clone: vi.fn().mockReturnThis(),
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers,
    }),
    url: 'http://localhost:3000/api/auth/login',
  } as unknown as Request;

  return request;
}

/**
 * Create a basic auth handler config
 */
function createMockConfig(overrides: Partial<AuthHandlerConfig> = {}): AuthHandlerConfig {
  return {
    findUserByEmail: vi.fn(),
    comparePassword: vi.fn(),
    onFailedAttempt: vi.fn(),
    onSuccessfulLogin: vi.fn(),
    ...overrides,
  };
}

describe('Login Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock return values after clearAllMocks
    mockGetClientIP.mockReturnValue('127.0.0.1');
    mockCreateToken.mockResolvedValue('mock-jwt-token');

    // Default: rate limit passes
    vi.mocked(withRateLimit).mockResolvedValue({
      success: true,
      info: {
        remaining: 4,
        limit: 5,
        reset: Date.now() + 900000,
      },
      headers: {
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '4',
        'X-RateLimit-Reset': String(Date.now() + 900000),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful Login', () => {
    it('should return success with user data for valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        passwordHash: 'hashed-password',
      };

      const config = createMockConfig({
        findUserByEmail: vi.fn().mockResolvedValue(mockUser),
        comparePassword: vi.fn().mockResolvedValue(true),
      });

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'valid-password',
      });

      const result = await handleLogin(request, config);

      expect(result.statusCode).toBe(200);
      expect(result.response).toEqual({
        success: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'admin',
        },
      });
      expect(result.cookie).toBeDefined();
      expect(result.cookie?.name).toBe('auth_token');
      expect(result.cookie?.value).toBe('mock-jwt-token');
    });

    it('should normalize email to lowercase', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        passwordHash: 'hashed-password',
      };

      const findUserByEmail = vi.fn().mockResolvedValue(mockUser);
      const config = createMockConfig({
        findUserByEmail,
        comparePassword: vi.fn().mockResolvedValue(true),
      });

      const request = createMockRequest({
        email: 'TEST@EXAMPLE.COM',
        password: 'valid-password',
      });

      await handleLogin(request, config);

      expect(findUserByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should call onSuccessfulLogin callback', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        passwordHash: 'hashed-password',
      };

      const onSuccessfulLogin = vi.fn();
      const config = createMockConfig({
        findUserByEmail: vi.fn().mockResolvedValue(mockUser),
        comparePassword: vi.fn().mockResolvedValue(true),
        onSuccessfulLogin,
      });

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'valid-password',
      });

      await handleLogin(request, config);

      expect(onSuccessfulLogin).toHaveBeenCalledWith('test@example.com', '127.0.0.1');
    });

    it('should include token in body when includeTokenInBody is true', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        passwordHash: 'hashed-password',
      };

      const config = createMockConfig({
        findUserByEmail: vi.fn().mockResolvedValue(mockUser),
        comparePassword: vi.fn().mockResolvedValue(true),
        includeTokenInBody: true,
      });

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'valid-password',
      });

      const result = await handleLogin(request, config);

      expect(result.statusCode).toBe(200);
      expect((result.response as { token?: string }).token).toBe('mock-jwt-token');
      expect((result.response as { expiresAt?: string }).expiresAt).toBeDefined();
    });

    it('should set secure cookie options in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        passwordHash: 'hashed-password',
      };

      const config = createMockConfig({
        findUserByEmail: vi.fn().mockResolvedValue(mockUser),
        comparePassword: vi.fn().mockResolvedValue(true),
      });

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'valid-password',
      });

      const result = await handleLogin(request, config);

      expect(result.cookie?.options.secure).toBe(true);
      expect(result.cookie?.options.httpOnly).toBe(true);
      expect(result.cookie?.options.sameSite).toBe('strict');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Invalid Credentials', () => {
    it('should return 401 when user is not found', async () => {
      const onFailedAttempt = vi.fn();
      const config = createMockConfig({
        findUserByEmail: vi.fn().mockResolvedValue(null),
        onFailedAttempt,
      });

      const request = createMockRequest({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      const result = await handleLogin(request, config);

      expect(result.statusCode).toBe(401);
      expect(result.response).toEqual({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Identifiants invalides',
        },
      });
      expect(onFailedAttempt).toHaveBeenCalledWith('nonexistent@example.com', '127.0.0.1');
    });

    it('should return 401 when password is incorrect', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        passwordHash: 'hashed-password',
      };

      const onFailedAttempt = vi.fn();
      const config = createMockConfig({
        findUserByEmail: vi.fn().mockResolvedValue(mockUser),
        comparePassword: vi.fn().mockResolvedValue(false),
        onFailedAttempt,
      });

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'wrong-password',
      });

      const result = await handleLogin(request, config);

      expect(result.statusCode).toBe(401);
      expect(result.response).toEqual({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Identifiants invalides',
        },
      });
      expect(onFailedAttempt).toHaveBeenCalledWith('test@example.com', '127.0.0.1');
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit is exceeded', async () => {
      vi.mocked(withRateLimit).mockResolvedValue({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Trop de tentatives. Veuillez réessayer plus tard.',
          statusCode: 429,
          details: {
            retryAfter: 60,
          },
        },
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + 60000),
          'Retry-After': '60',
        },
      });

      const config = createMockConfig();
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await handleLogin(request, config);

      expect(result.statusCode).toBe(429);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
        },
      });
      expect(result.headers['Retry-After']).toBeDefined();
    });

    it('should include rate limit headers in response', async () => {
      const config = createMockConfig({
        findUserByEmail: vi.fn().mockResolvedValue(null),
      });

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await handleLogin(request, config);

      expect(result.headers['X-RateLimit-Limit']).toBeDefined();
      expect(result.headers['X-RateLimit-Remaining']).toBeDefined();
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for invalid email format', async () => {
      const config = createMockConfig();
      const request = createMockRequest({
        email: 'invalid-email',
        password: 'password123',
      });

      const result = await handleLogin(request, config);

      expect(result.statusCode).toBe(400);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_INPUT',
        },
      });
    });

    it('should return 400 for missing password', async () => {
      const config = createMockConfig();
      const request = createMockRequest({
        email: 'test@example.com',
      });

      const result = await handleLogin(request, config);

      expect(result.statusCode).toBe(400);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_INPUT',
        },
      });
    });

    it('should return 400 for missing email', async () => {
      const config = createMockConfig();
      const request = createMockRequest({
        password: 'password123',
      });

      const result = await handleLogin(request, config);

      expect(result.statusCode).toBe(400);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_INPUT',
        },
      });
    });

    it('should return 400 for empty password', async () => {
      const config = createMockConfig();
      const request = createMockRequest({
        email: 'test@example.com',
        password: '',
      });

      const result = await handleLogin(request, config);

      expect(result.statusCode).toBe(400);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_INPUT',
        },
      });
    });
  });

  describe('Custom Configuration', () => {
    it('should use custom cookie name', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        passwordHash: 'hashed-password',
      };

      const config = createMockConfig({
        findUserByEmail: vi.fn().mockResolvedValue(mockUser),
        comparePassword: vi.fn().mockResolvedValue(true),
        cookieName: 'custom_auth_token',
      });

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'valid-password',
      });

      const result = await handleLogin(request, config);

      expect(result.cookie?.name).toBe('custom_auth_token');
    });

    it('should use custom token expiration', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        passwordHash: 'hashed-password',
      };

      const config = createMockConfig({
        findUserByEmail: vi.fn().mockResolvedValue(mockUser),
        comparePassword: vi.fn().mockResolvedValue(true),
        tokenExpiration: '7d',
      });

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'valid-password',
      });

      const result = await handleLogin(request, config);

      // 7 days = 604800 seconds
      expect(result.cookie?.options.maxAge).toBe(604800);
    });
  });
});
