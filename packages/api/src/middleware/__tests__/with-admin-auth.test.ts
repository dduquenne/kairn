import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @kairn/core/auth
vi.mock('@kairn/core/auth', () => ({
  verifyToken: vi.fn(),
}));

import { verifyToken } from '@kairn/core/auth';
import { withAdminAuth, createAdminAuth } from '../with-admin-auth';

const mockVerifyToken = vi.mocked(verifyToken);

describe('withAdminAuth', () => {
  const mockGetCookies = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne success quand l'admin est authentifié", async () => {
    const payload = { sub: 'user-1', role: 'admin', email: 'admin@test.com' };
    mockGetCookies.mockResolvedValueOnce({
      get: (name: string) => (name === 'test_token' ? { value: 'valid-token' } : undefined),
    });
    mockVerifyToken.mockResolvedValueOnce(payload);

    const result = await withAdminAuth({
      cookieName: 'test_token',
      getCookies: mockGetCookies,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user).toEqual(payload);
    }
  });

  it('retourne 401 quand le cookie est absent', async () => {
    mockGetCookies.mockResolvedValueOnce({
      get: () => undefined,
    });

    const result = await withAdminAuth({
      cookieName: 'test_token',
      getCookies: mockGetCookies,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.statusCode).toBe(401);
    }
  });

  it('retourne 401 quand le token est invalide', async () => {
    mockGetCookies.mockResolvedValueOnce({
      get: () => ({ value: 'invalid-token' }),
    });
    mockVerifyToken.mockResolvedValueOnce(null);

    const result = await withAdminAuth({
      cookieName: 'test_token',
      getCookies: mockGetCookies,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.statusCode).toBe(401);
    }
  });

  it("retourne 403 quand l'utilisateur n'est pas admin", async () => {
    mockGetCookies.mockResolvedValueOnce({
      get: () => ({ value: 'valid-token' }),
    });
    mockVerifyToken.mockResolvedValueOnce({
      sub: 'user-1',
      role: 'user',
      email: 'user@test.com',
    });

    const result = await withAdminAuth({
      cookieName: 'test_token',
      getCookies: mockGetCookies,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.statusCode).toBe(403);
      expect(result.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    }
  });

  it('supporte un rôle admin personnalisé', async () => {
    mockGetCookies.mockResolvedValueOnce({
      get: () => ({ value: 'valid-token' }),
    });
    mockVerifyToken.mockResolvedValueOnce({
      sub: 'user-1',
      role: 'superadmin',
      email: 'super@test.com',
    });

    const result = await withAdminAuth({
      cookieName: 'test_token',
      getCookies: mockGetCookies,
      adminRole: 'superadmin',
    });

    expect(result.success).toBe(true);
  });

  it('gère les erreurs de vérification gracieusement', async () => {
    mockGetCookies.mockRejectedValueOnce(new Error('Cookie error'));

    const result = await withAdminAuth({
      cookieName: 'test_token',
      getCookies: mockGetCookies,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.statusCode).toBe(401);
    }
  });
});

describe('createAdminAuth', () => {
  const mockGetCookies = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crée une factory préconfigurée', async () => {
    mockGetCookies.mockResolvedValueOnce({
      get: () => ({ value: 'valid-token' }),
    });
    mockVerifyToken.mockResolvedValueOnce({
      sub: 'user-1',
      role: 'admin',
      email: 'admin@test.com',
    });

    const withSiteAdmin = createAdminAuth({
      cookieName: 'site_admin_token',
      getCookies: mockGetCookies,
    });

    const result = await withSiteAdmin();
    expect(result.success).toBe(true);
  });
});
