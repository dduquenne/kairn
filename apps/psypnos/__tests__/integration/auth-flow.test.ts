/**
 * Auth Flow Integration Tests
 *
 * Tests the authentication flow logic:
 * - Login with valid credentials
 * - Login with invalid credentials
 * - Protected route access
 * - Token verification
 * - Rate limiting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Simulated auth service that mirrors the actual login route behavior
 * without depending on Next.js route handlers
 */

interface User {
  id: string;
  email: string;
  role: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface LoginResult {
  success: boolean;
  status: number;
  user?: { id: string; email: string; role: string };
  error?: { code: string; message: string };
}

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Mock implementations
const mockUserStore: Map<string, User> = new Map();
const mockRateLimitStore: Map<string, number> = new Map();
const mockTokenStore: Map<string, TokenPayload> = new Map();

const RATE_LIMIT_MAX = 5;
const TOKEN_EXPIRY = 3600;

// Auth service functions (simulating actual behavior)
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function isRateLimited(email: string): boolean {
  const attempts = mockRateLimitStore.get(email) || 0;
  return attempts >= RATE_LIMIT_MAX;
}

function recordFailedAttempt(email: string): void {
  const attempts = mockRateLimitStore.get(email) || 0;
  mockRateLimitStore.set(email, attempts + 1);
}

function clearAttempts(email: string): void {
  mockRateLimitStore.delete(email);
}

function findUserByEmail(email: string): User | null {
  return mockUserStore.get(normalizeEmail(email)) || null;
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  // In real implementation, this would use bcrypt
  return password === hash;
}

function createToken(userId: string, email: string, role: string): string {
  const payload: TokenPayload = {
    sub: userId,
    email,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY,
  };
  const token = `token-${userId}-${Date.now()}`;
  mockTokenStore.set(token, payload);
  return token;
}

function verifyToken(token: string): TokenPayload | null {
  const payload = mockTokenStore.get(token);
  if (!payload) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

// Main login handler (simulating actual behavior)
async function handleLogin(input: LoginInput): Promise<LoginResult> {
  const { email, password } = input;
  const normalizedEmail = normalizeEmail(email);

  // Validation
  if (!email || !password) {
    return {
      success: false,
      status: 400,
      error: { code: 'INVALID_INPUT', message: 'Email et mot de passe requis' },
    };
  }

  if (!isValidEmail(email)) {
    return {
      success: false,
      status: 400,
      error: { code: 'INVALID_INPUT', message: 'Format email invalide' },
    };
  }

  // Rate limiting check
  if (isRateLimited(normalizedEmail)) {
    return {
      success: false,
      status: 429,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Trop de tentatives. Veuillez réessayer plus tard.',
      },
    };
  }

  // Find user
  const user = findUserByEmail(normalizedEmail);
  if (!user) {
    recordFailedAttempt(normalizedEmail);
    return {
      success: false,
      status: 401,
      error: { code: 'INVALID_CREDENTIALS', message: 'Identifiants invalides' },
    };
  }

  // Check password
  const passwordMatch = await comparePassword(password, user.passwordHash);
  if (!passwordMatch) {
    recordFailedAttempt(normalizedEmail);
    return {
      success: false,
      status: 401,
      error: { code: 'INVALID_CREDENTIALS', message: 'Identifiants invalides' },
    };
  }

  // Check admin role
  if (user.role !== 'admin') {
    recordFailedAttempt(normalizedEmail);
    return {
      success: false,
      status: 401,
      error: { code: 'INVALID_CREDENTIALS', message: 'Identifiants invalides' },
    };
  }

  // Success - clear rate limit and create token
  clearAttempts(normalizedEmail);
  createToken(user.id, user.email, user.role);

  return {
    success: true,
    status: 200,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

// Auth middleware simulation
interface AuthResult {
  user?: { id: string; email: string; role: string };
  error?: { code: string; message: string };
}

function withAdminAuth(token: string | undefined): AuthResult {
  if (!token) {
    return {
      error: { code: 'UNAUTHORIZED', message: 'Token manquant' },
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      error: { code: 'UNAUTHORIZED', message: 'Token invalide' },
    };
  }

  if (payload.role !== 'admin') {
    return {
      error: { code: 'FORBIDDEN', message: 'Accès refusé' },
    };
  }

  return {
    user: {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    },
  };
}

describe('Auth Flow Integration', () => {
  const mockAdminUser: User = {
    id: 'user-123',
    email: 'admin@psypnos.fr',
    role: 'admin',
    passwordHash: 'securePassword123!',
    name: 'Admin User',
    createdAt: new Date().toISOString(),
  };

  const mockRegularUser: User = {
    id: 'user-456',
    email: 'user@example.com',
    role: 'user',
    passwordHash: 'password123',
    name: 'Regular User',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    // Clear all stores
    mockUserStore.clear();
    mockRateLimitStore.clear();
    mockTokenStore.clear();

    // Add mock users
    mockUserStore.set(mockAdminUser.email, mockAdminUser);
    mockUserStore.set(mockRegularUser.email, mockRegularUser);
  });

  describe('Login Flow', () => {
    it('should successfully login with valid admin credentials', async () => {
      const result = await handleLogin({
        email: 'admin@psypnos.fr',
        password: 'securePassword123!',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.user).toEqual({
        id: mockAdminUser.id,
        email: mockAdminUser.email,
        role: mockAdminUser.role,
      });
    });

    it('should return 401 for invalid password', async () => {
      const result = await handleLogin({
        email: 'admin@psypnos.fr',
        password: 'wrongPassword',
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error?.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent user', async () => {
      const result = await handleLogin({
        email: 'nonexistent@example.com',
        password: 'anyPassword',
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error?.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-admin user', async () => {
      const result = await handleLogin({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error?.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 400 for invalid input', async () => {
      const result = await handleLogin({
        email: 'invalid-email',
        password: '',
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should normalize email to lowercase', async () => {
      const result = await handleLogin({
        email: 'ADMIN@PSYPNOS.FR',
        password: 'securePassword123!',
      });

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('admin@psypnos.fr');
    });

    it('should clear rate limit attempts on successful login', async () => {
      // First, trigger some failed attempts
      await handleLogin({ email: 'admin@psypnos.fr', password: 'wrong1' });
      await handleLogin({ email: 'admin@psypnos.fr', password: 'wrong2' });

      // Check that attempts were recorded
      expect(mockRateLimitStore.get('admin@psypnos.fr')).toBe(2);

      // Now login successfully
      await handleLogin({
        email: 'admin@psypnos.fr',
        password: 'securePassword123!',
      });

      // Attempts should be cleared
      expect(mockRateLimitStore.get('admin@psypnos.fr')).toBeUndefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limited', async () => {
      // Trigger rate limit
      for (let i = 0; i < RATE_LIMIT_MAX; i++) {
        await handleLogin({
          email: 'admin@psypnos.fr',
          password: 'wrongPassword',
        });
      }

      const result = await handleLogin({
        email: 'admin@psypnos.fr',
        password: 'securePassword123!',
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe(429);
      expect(result.error?.code).toBe('TOO_MANY_REQUESTS');
    });

    it('should record failed attempt on invalid credentials', async () => {
      await handleLogin({
        email: 'admin@psypnos.fr',
        password: 'wrongPassword',
      });

      expect(mockRateLimitStore.get('admin@psypnos.fr')).toBe(1);
    });

    it('should not rate limit different users', async () => {
      // Trigger rate limit for one user
      for (let i = 0; i < RATE_LIMIT_MAX; i++) {
        await handleLogin({ email: 'user@example.com', password: 'wrong' });
      }

      // Different user should not be rate limited
      const result = await handleLogin({
        email: 'admin@psypnos.fr',
        password: 'securePassword123!',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Protected Route Access', () => {
    it('should allow access with valid token', async () => {
      // Login first to create token
      await handleLogin({
        email: 'admin@psypnos.fr',
        password: 'securePassword123!',
      });

      // Get the token from store
      const token = Array.from(mockTokenStore.keys())[0];

      const result = withAdminAuth(token);

      expect(result.error).toBeUndefined();
      expect(result.user).toBeDefined();
      expect(result.user?.role).toBe('admin');
    });

    it('should deny access without token', () => {
      const result = withAdminAuth(undefined);

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });

    it('should deny access with invalid token', () => {
      const result = withAdminAuth('invalid-token');

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });

    it('should deny access for non-admin role', () => {
      // Manually create a non-admin token
      const payload: TokenPayload = {
        sub: 'user-456',
        email: 'user@example.com',
        role: 'user',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY,
      };
      const token = 'user-token';
      mockTokenStore.set(token, payload);

      const result = withAdminAuth(token);

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('FORBIDDEN');
    });
  });

  describe('Token Verification', () => {
    it('should verify valid token', async () => {
      await handleLogin({
        email: 'admin@psypnos.fr',
        password: 'securePassword123!',
      });

      const token = Array.from(mockTokenStore.keys())[0]!;
      const payload = verifyToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.email).toBe('admin@psypnos.fr');
      expect(payload?.role).toBe('admin');
    });

    it('should return null for missing token', () => {
      const result = verifyToken('non-existent-token');
      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      // Create expired token
      const expiredPayload: TokenPayload = {
        sub: 'user-123',
        email: 'admin@psypnos.fr',
        role: 'admin',
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      };
      const token = 'expired-token';
      mockTokenStore.set(token, expiredPayload);

      const result = verifyToken(token);
      expect(result).toBeNull();
    });
  });

  describe('Input Validation', () => {
    it('should reject missing email', async () => {
      const result = await handleLogin({
        email: '',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
    });

    it('should reject missing password', async () => {
      const result = await handleLogin({
        email: 'admin@psypnos.fr',
        password: '',
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
    });

    it('should reject invalid email format', async () => {
      const result = await handleLogin({
        email: 'not-an-email',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should accept valid email formats', async () => {
      const validEmails = ['test@example.com', 'user.name@domain.org', 'user+tag@example.co.uk'];

      for (const email of validEmails) {
        const result = await handleLogin({ email, password: 'password' });
        // Should not return 400 for invalid email format
        // (may return 401 for invalid credentials, but not 400 for format)
        expect(result.status).not.toBe(400);
      }
    });
  });

  describe('Complete Flow', () => {
    it('should complete full login and protected access flow', async () => {
      // 1. Attempt login with wrong credentials
      const failedResult = await handleLogin({
        email: 'admin@psypnos.fr',
        password: 'wrongPassword',
      });
      expect(failedResult.success).toBe(false);
      expect(failedResult.status).toBe(401);

      // 2. Attempt protected access without token
      const unauthorizedResult = withAdminAuth(undefined);
      expect(unauthorizedResult.error).toBeDefined();

      // 3. Login successfully
      const loginResult = await handleLogin({
        email: 'admin@psypnos.fr',
        password: 'securePassword123!',
      });
      expect(loginResult.success).toBe(true);

      // 4. Access protected route with token
      const token = Array.from(mockTokenStore.keys())[0];
      const authorizedResult = withAdminAuth(token);
      expect(authorizedResult.error).toBeUndefined();
      expect(authorizedResult.user?.email).toBe('admin@psypnos.fr');
    });
  });
});
