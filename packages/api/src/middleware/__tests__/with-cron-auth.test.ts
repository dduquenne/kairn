import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @kairn/core/scheduler
vi.mock('@kairn/core/scheduler', () => ({
  verifyCronAuth: vi.fn(),
}));

import { verifyCronAuth } from '@kairn/core/scheduler';
import { withCronAuth } from '../with-cron-auth';

const mockVerifyCronAuth = vi.mocked(verifyCronAuth);

describe('withCronAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne success quand l'auth est valide", async () => {
    mockVerifyCronAuth.mockResolvedValueOnce({
      valid: true,
      source: 'qstash',
    });

    const request = new Request('http://localhost/api/cron/test');
    const result = await withCronAuth(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.source).toBe('qstash');
    }
  });

  it("retourne une erreur 401 quand l'auth échoue", async () => {
    mockVerifyCronAuth.mockResolvedValueOnce({
      valid: false,
      source: 'cron_secret',
      error: 'Invalid token',
    });

    const request = new Request('http://localhost/api/cron/test');
    const result = await withCronAuth(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.statusCode).toBe(401);
      expect(result.error.code).toBe('UNAUTHORIZED');
    }
  });

  it('passe la config au verifyCronAuth', async () => {
    mockVerifyCronAuth.mockResolvedValueOnce({
      valid: true,
      source: 'cron_secret',
    });

    const request = new Request('http://localhost/api/cron/test');
    const config = { cronSecret: 'test-secret' };
    await withCronAuth(request, config);

    expect(mockVerifyCronAuth).toHaveBeenCalledWith(request, config);
  });

  it('supporte la source development', async () => {
    mockVerifyCronAuth.mockResolvedValueOnce({
      valid: true,
      source: 'development',
    });

    const request = new Request('http://localhost/api/cron/test');
    const result = await withCronAuth(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.source).toBe('development');
    }
  });
});
