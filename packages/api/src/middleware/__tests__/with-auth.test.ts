import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@kairn/core', () => ({
  getTokenFromHeader: vi.fn((header?: string) => {
    if (!header) return null;
    if (header.startsWith('Bearer ')) return header.slice(7);
    return null;
  }),
  verifyToken: vi.fn(),
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
    withScope: vi.fn(),
  }),
}));

import { verifyToken } from '@kairn/core';

import { withAuth, AuthErrorCode, createAuthMiddleware } from '../with-auth';
import type { ApiRequest } from '../types';

/**
 * Create a mock API request
 */
function createMockRequest(headers: Record<string, string> = {}): ApiRequest {
  const headersMap = new Map(Object.entries(headers));
  return {
    headers: {
      get: (name: string) => headersMap.get(name) ?? null,
    },
    url: 'http://localhost:3000/api/test',
    method: 'GET',
    clone: () =>
      createMockRequest(headers) as ApiRequest & {
        json(): Promise<unknown>;
        formData(): Promise<FormData>;
      },
    json: () => Promise.resolve({}),
  };
}

describe('withAuth', () => {
  const mockVerifyToken = vi.mocked(verifyToken);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return UNAUTHORIZED when no token is present', async () => {
    const request = createMockRequest();
    const result = await withAuth(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(AuthErrorCode.UNAUTHORIZED);
      expect(result.error.statusCode).toBe(401);
    }
  });

  it('should return INVALID_TOKEN when token verification fails', async () => {
    mockVerifyToken.mockResolvedValueOnce(null);

    const request = createMockRequest({ Authorization: 'Bearer invalid-token' });
    const result = await withAuth(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(AuthErrorCode.INVALID_TOKEN);
      expect(result.error.statusCode).toBe(401);
    }
  });

  it('should return TOKEN_EXPIRED when token is expired', async () => {
    mockVerifyToken.mockResolvedValueOnce({
      sub: 'user-1',
      email: 'user@test.com',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) - 3600,
    });

    const request = createMockRequest({ Authorization: 'Bearer expired-token' });
    const result = await withAuth(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(AuthErrorCode.TOKEN_EXPIRED);
    }
  });

  it('should return success with valid token', async () => {
    const payload = {
      sub: 'user-1',
      email: 'user@test.com',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    mockVerifyToken.mockResolvedValueOnce(payload);

    const request = createMockRequest({ Authorization: 'Bearer valid-token' });
    const result = await withAuth(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.context.user.sub).toBe('user-1');
      expect(result.context.token).toBe('valid-token');
    }
  });

  it('should return INSUFFICIENT_PERMISSIONS when requiredRole does not match', async () => {
    const payload = {
      sub: 'user-1',
      email: 'user@test.com',
      role: 'user',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    mockVerifyToken.mockResolvedValueOnce(payload);

    const request = createMockRequest({ Authorization: 'Bearer valid-token' });
    const result = await withAuth(request, { requiredRole: 'admin' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(AuthErrorCode.INSUFFICIENT_PERMISSIONS);
      expect(result.error.statusCode).toBe(403);
    }
  });

  it('should return success when requiredRole matches', async () => {
    const payload = {
      sub: 'user-1',
      email: 'admin@test.com',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    mockVerifyToken.mockResolvedValueOnce(payload);

    const request = createMockRequest({ Authorization: 'Bearer valid-token' });
    const result = await withAuth(request, { requiredRole: 'admin' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.context.user.role).toBe('admin');
    }
  });

  it('should not check role when requiredRole is not specified', async () => {
    const payload = {
      sub: 'user-1',
      email: 'user@test.com',
      role: 'user',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    mockVerifyToken.mockResolvedValueOnce(payload);

    const request = createMockRequest({ Authorization: 'Bearer valid-token' });
    const result = await withAuth(request);

    expect(result.success).toBe(true);
  });

  it('should extract token from Cookie header', async () => {
    const payload = {
      sub: 'user-1',
      email: 'user@test.com',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    mockVerifyToken.mockResolvedValueOnce(payload);

    const request = createMockRequest({ Cookie: 'auth_token=cookie-token' });
    const result = await withAuth(request);

    expect(result.success).toBe(true);
    expect(mockVerifyToken).toHaveBeenCalledWith('cookie-token');
  });

  it('should extract token using getCookies function', async () => {
    const payload = {
      sub: 'user-1',
      email: 'user@test.com',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    mockVerifyToken.mockResolvedValueOnce(payload);

    const request = createMockRequest();
    const result = await withAuth(request, {
      cookieName: 'custom_token',
      getCookies: () =>
        Promise.resolve({
          get: (name: string) => (name === 'custom_token' ? { value: 'custom-value' } : undefined),
        }),
    });

    expect(result.success).toBe(true);
    expect(mockVerifyToken).toHaveBeenCalledWith('custom-value');
  });
});

describe('createAuthMiddleware', () => {
  const mockVerifyToken = vi.mocked(verifyToken);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a middleware with preset configuration', async () => {
    const payload = {
      sub: 'user-1',
      email: 'admin@test.com',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    mockVerifyToken.mockResolvedValueOnce(payload);

    const adminAuth = createAuthMiddleware({ requiredRole: 'admin' });
    const request = createMockRequest({ Authorization: 'Bearer valid-token' });
    const result = await adminAuth(request);

    expect(result.success).toBe(true);
  });

  it('should reject non-admin users with preset admin middleware', async () => {
    const payload = {
      sub: 'user-1',
      email: 'user@test.com',
      role: 'user',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    mockVerifyToken.mockResolvedValueOnce(payload);

    const adminAuth = createAuthMiddleware({ requiredRole: 'admin' });
    const request = createMockRequest({ Authorization: 'Bearer valid-token' });
    const result = await adminAuth(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(AuthErrorCode.INSUFFICIENT_PERMISSIONS);
    }
  });
});
