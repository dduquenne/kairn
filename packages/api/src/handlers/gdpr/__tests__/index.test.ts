/**
 * GDPR Handler Tests
 *
 * Tests for the GDPR Right to Erasure handler including:
 * - Successful deletion by sessionId
 * - Successful deletion by visitorId (audit only)
 * - Validation of required parameters
 * - Multi-tenant isolation via siteId
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { handleGdprDelete, gdprDeleteSchema, createGdprDeleteHandler } from '../index';

import type { GdprHandlerConfig } from '../index';

/**
 * Create a mock Prisma client for GDPR operations
 */
function createMockPrisma() {
  return {
    analyticsEvent: {
      deleteMany: vi.fn().mockResolvedValue({ count: 5 }),
    },
    visitorGeolocation: {
      deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
  };
}

describe('GDPR Handler', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let config: GdprHandlerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();
    config = { prisma: mockPrisma, siteId: 'site-123' };
  });

  describe('gdprDeleteSchema', () => {
    it('should accept valid sessionId', () => {
      const result = gdprDeleteSchema.safeParse({ sessionId: 'ses_abc' });
      expect(result.success).toBe(true);
    });

    it('should accept valid visitorId', () => {
      const result = gdprDeleteSchema.safeParse({ visitorId: 'v_abc' });
      expect(result.success).toBe(true);
    });

    it('should accept both sessionId and visitorId', () => {
      const result = gdprDeleteSchema.safeParse({ sessionId: 'ses_abc', visitorId: 'v_abc' });
      expect(result.success).toBe(true);
    });

    it('should reject when neither sessionId nor visitorId is provided', () => {
      const result = gdprDeleteSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('handleGdprDelete', () => {
    it('should delete analytics events and geolocation by sessionId', async () => {
      const result = await handleGdprDelete({ sessionId: 'ses_abc' }, config);

      expect(result.success).toBe(true);
      expect(result.totalDeleted).toBe(7);
      expect(result.details.analyticsEvents).toBe(5);
      expect(result.details.visitorGeolocations).toBe(2);
    });

    it('should filter by siteId for multi-tenant isolation', async () => {
      await handleGdprDelete({ sessionId: 'ses_abc' }, config);

      expect(mockPrisma.analyticsEvent.deleteMany).toHaveBeenCalledWith({
        where: { sessionId: 'ses_abc', siteId: 'site-123' },
      });
      expect(mockPrisma.visitorGeolocation.deleteMany).toHaveBeenCalledWith({
        where: { sessionId: 'ses_abc', siteId: 'site-123' },
      });
    });

    it('should log audit trail for visitorId deletion', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await handleGdprDelete({ visitorId: 'v_abc' }, config);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('visitorId: v_abc'));
      warnSpy.mockRestore();
    });

    it('should not call deleteMany when only visitorId is provided', async () => {
      const result = await handleGdprDelete({ visitorId: 'v_abc' }, config);

      expect(mockPrisma.analyticsEvent.deleteMany).not.toHaveBeenCalled();
      expect(result.totalDeleted).toBe(0);
    });

    it('should handle deletion errors', async () => {
      mockPrisma.analyticsEvent.deleteMany.mockRejectedValue(new Error('DB error'));

      await expect(handleGdprDelete({ sessionId: 'ses_abc' }, config)).rejects.toThrow('DB error');
    });
  });

  describe('createGdprDeleteHandler', () => {
    it('should return a handler function', () => {
      const handler = createGdprDeleteHandler(config);
      expect(typeof handler).toBe('function');
    });

    it('should validate and process valid input', async () => {
      const handler = createGdprDeleteHandler(config);
      const { response, result } = await handler({ sessionId: 'ses_abc' });

      expect(result).not.toBeNull();
      expect(result?.totalDeleted).toBe(7);
      expect(response).toBeDefined();
    });

    it('should return error response for invalid input', async () => {
      const handler = createGdprDeleteHandler(config);
      const { response, result } = await handler({});

      expect(result).toBeNull();
      expect(response).toBeDefined();
    });
  });
});
