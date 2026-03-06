import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@kairn/core', () => ({
  getTokenFromHeader: vi.fn((header?: string) => {
    if (!header) return null;
    if (header.startsWith('Bearer ')) return header.slice(7);
    return null;
  }),
  verifyToken: vi.fn(),
}));

import { verifyToken } from '@kairn/core';

import { withAdmin, AdminErrorCode, createAdminMiddleware } from '../with-admin';
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
    url: 'http://localhost:3000/api/admin/test',
    method: 'GET',
    clone: () =>
      createMockRequest(headers) as ApiRequest & {
        json(): Promise<unknown>;
        formData(): Promise<FormData>;
      },
    json: () => Promise.resolve({}),
  };
}

describe('withAdmin', () => {
  const mockVerifyToken = vi.mocked(verifyToken);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return UNAUTHORIZED when no token is present', async () => {
    const request = createMockRequest();
    const result = await withAdmin(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.statusCode).toBe(401);
    }
  });

  it('should return INSUFFICIENT_PERMISSIONS for non-admin user', async () => {
    mockVerifyToken.mockResolvedValueOnce({
      sub: 'user-1',
      email: 'user@test.com',
      role: 'user',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const request = createMockRequest({ Authorization: 'Bearer valid-token' });
    const result = await withAdmin(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(AdminErrorCode.INSUFFICIENT_PERMISSIONS);
      expect(result.error.statusCode).toBe(403);
    }
  });

  it('should return success for admin user', async () => {
    mockVerifyToken.mockResolvedValueOnce({
      sub: 'admin-1',
      email: 'admin@test.com',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const request = createMockRequest({ Authorization: 'Bearer valid-token' });
    const result = await withAdmin(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.context.user.role).toBe('admin');
    }
  });

  it('should support custom admin role name', async () => {
    mockVerifyToken.mockResolvedValueOnce({
      sub: 'superadmin-1',
      email: 'super@test.com',
      role: 'superadmin',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const request = createMockRequest({ Authorization: 'Bearer valid-token' });
    const result = await withAdmin(request, { adminRole: 'superadmin' });

    expect(result.success).toBe(true);
  });

  it('should reject user with wrong custom admin role', async () => {
    mockVerifyToken.mockResolvedValueOnce({
      sub: 'admin-1',
      email: 'admin@test.com',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const request = createMockRequest({ Authorization: 'Bearer valid-token' });
    const result = await withAdmin(request, { adminRole: 'superadmin' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(AdminErrorCode.INSUFFICIENT_PERMISSIONS);
    }
  });
});

describe('createAdminMiddleware', () => {
  const mockVerifyToken = vi.mocked(verifyToken);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a middleware with preset configuration', async () => {
    mockVerifyToken.mockResolvedValueOnce({
      sub: 'admin-1',
      email: 'admin@test.com',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const adminMiddleware = createAdminMiddleware({ cookieName: 'admin_token' });
    const request = createMockRequest({ Authorization: 'Bearer valid-token' });
    const result = await adminMiddleware(request);

    expect(result.success).toBe(true);
  });
});
