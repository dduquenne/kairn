/**
 * QStash Signature Verification Tests
 *
 * Tests for verifying QStash request signatures, CRON_SECRET fallback,
 * and development mode bypass.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@upstash/qstash', () => {
  const MockReceiver = vi.fn().mockImplementation(() => ({
    verify: vi.fn().mockResolvedValue(true),
  }));
  return { Receiver: MockReceiver };
});

import {
  verifyQStashSignature,
  verifyCronAuth,
  isValidCronRequest,
  verifyCronSecretSync,
  resetReceiver,
} from '../scheduler/verify-qstash';

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
  resetReceiver();
});

afterEach(() => {
  process.env = originalEnv;
});

/**
 * Create a mock Request object
 */
function createMockRequest(options: {
  url?: string;
  headers?: Record<string, string>;
  body?: string;
}): Request {
  const headers = new Headers(options.headers || {});
  return {
    url: options.url || 'https://example.com/api/cron/test',
    headers,
    clone: () => ({
      text: () => Promise.resolve(options.body || ''),
      headers,
      url: options.url || 'https://example.com/api/cron/test',
    }),
  } as unknown as Request;
}

// =============================================================================
// QStash Signature Verification
// =============================================================================

describe('verifyQStashSignature', () => {
  describe('with QStash signature', () => {
    it('should verify valid QStash signature', async () => {
      const request = createMockRequest({
        headers: { 'upstash-signature': 'valid-sig' },
        body: '{"test": true}',
      });

      const result = await verifyQStashSignature(request, {
        currentSigningKey: 'key1',
        nextSigningKey: 'key2',
      });

      expect(result.valid).toBe(true);
      expect(result.source).toBe('qstash');
    });

    it('should return error when signing keys are not configured', async () => {
      delete process.env.QSTASH_CURRENT_SIGNING_KEY;
      delete process.env.QSTASH_NEXT_SIGNING_KEY;

      const request = createMockRequest({
        headers: { 'upstash-signature': 'some-sig' },
      });

      const result = await verifyQStashSignature(request);

      expect(result.valid).toBe(false);
      expect(result.source).toBe('qstash');
      expect(result.error).toContain('not configured');
    });

    it('should return invalid when verification fails', async () => {
      // Override the mock to return false
      const { Receiver } = await import('@upstash/qstash');
      vi.mocked(Receiver).mockImplementationOnce(
        () =>
          ({
            verify: vi.fn().mockResolvedValue(false),
          }) as never
      );
      resetReceiver();

      const request = createMockRequest({
        headers: { 'upstash-signature': 'invalid-sig' },
      });

      const result = await verifyQStashSignature(request, {
        currentSigningKey: 'key1',
        nextSigningKey: 'key2',
      });

      expect(result.valid).toBe(false);
    });

    it('should handle verification exception', async () => {
      const { Receiver } = await import('@upstash/qstash');
      vi.mocked(Receiver).mockImplementationOnce(
        () =>
          ({
            verify: vi.fn().mockRejectedValue(new Error('Signature expired')),
          }) as never
      );
      resetReceiver();

      const request = createMockRequest({
        headers: { 'upstash-signature': 'expired-sig' },
      });

      const result = await verifyQStashSignature(request, {
        currentSigningKey: 'key1',
        nextSigningKey: 'key2',
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Signature expired');
    });
  });

  describe('with CRON_SECRET fallback', () => {
    it('should validate Bearer token in Authorization header', async () => {
      process.env.NODE_ENV = 'production';

      const request = createMockRequest({
        headers: { authorization: 'Bearer my-secret-123' },
      });

      const result = await verifyQStashSignature(request, {
        cronSecret: 'my-secret-123',
      });

      expect(result.valid).toBe(true);
      expect(result.source).toBe('cron_secret');
    });

    it('should reject invalid Bearer token', async () => {
      process.env.NODE_ENV = 'production';

      const request = createMockRequest({
        headers: { authorization: 'Bearer wrong-secret' },
      });

      const result = await verifyQStashSignature(request, {
        cronSecret: 'my-secret-123',
      });

      expect(result.valid).toBe(false);
    });

    it('should validate secret in query parameter', async () => {
      process.env.NODE_ENV = 'production';

      const request = createMockRequest({
        url: 'https://example.com/api/cron/test?secret=my-secret-123',
      });

      const result = await verifyQStashSignature(request, {
        cronSecret: 'my-secret-123',
      });

      expect(result.valid).toBe(true);
      expect(result.source).toBe('cron_secret');
    });

    it('should use CRON_SECRET from env when not provided in config', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CRON_SECRET = 'env-secret';

      const request = createMockRequest({
        headers: { authorization: 'Bearer env-secret' },
      });

      const result = await verifyQStashSignature(request);

      expect(result.valid).toBe(true);
      expect(result.source).toBe('cron_secret');
    });
  });

  describe('development mode', () => {
    it('should allow unauthenticated requests in development', async () => {
      process.env.NODE_ENV = 'development';

      const request = createMockRequest({});

      const result = await verifyQStashSignature(request);

      expect(result.valid).toBe(true);
      expect(result.source).toBe('development');
    });

    it('should reject unauthenticated requests in production', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.CRON_SECRET;

      const request = createMockRequest({});

      const result = await verifyQStashSignature(request);

      expect(result.valid).toBe(false);
    });
  });
});

// =============================================================================
// verifyCronAuth (alias)
// =============================================================================

describe('verifyCronAuth', () => {
  it('should delegate to verifyQStashSignature', async () => {
    process.env.NODE_ENV = 'development';

    const request = createMockRequest({});
    const result = await verifyCronAuth(request);

    expect(result.valid).toBe(true);
  });
});

// =============================================================================
// isValidCronRequest
// =============================================================================

describe('isValidCronRequest', () => {
  it('should return true for valid requests', async () => {
    process.env.NODE_ENV = 'development';

    const request = createMockRequest({});
    const valid = await isValidCronRequest(request);

    expect(valid).toBe(true);
  });

  it('should return false for invalid requests in production', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CRON_SECRET;

    const request = createMockRequest({});
    const valid = await isValidCronRequest(request);

    expect(valid).toBe(false);
  });
});

// =============================================================================
// verifyCronSecretSync
// =============================================================================

describe('verifyCronSecretSync', () => {
  it('should verify Authorization header', () => {
    process.env.CRON_SECRET = 'sync-secret';
    process.env.NODE_ENV = 'production';

    const request = createMockRequest({
      headers: { authorization: 'Bearer sync-secret' },
    });

    expect(verifyCronSecretSync(request)).toBe(true);
  });

  it('should verify query parameter', () => {
    process.env.CRON_SECRET = 'sync-secret';
    process.env.NODE_ENV = 'production';

    const request = createMockRequest({
      url: 'https://example.com/api/cron/test?secret=sync-secret',
    });

    expect(verifyCronSecretSync(request)).toBe(true);
  });

  it('should reject invalid credentials in production', () => {
    process.env.CRON_SECRET = 'sync-secret';
    process.env.NODE_ENV = 'production';

    const request = createMockRequest({
      headers: { authorization: 'Bearer wrong' },
    });

    expect(verifyCronSecretSync(request)).toBe(false);
  });

  it('should allow in development without secret', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.CRON_SECRET;

    const request = createMockRequest({});

    expect(verifyCronSecretSync(request)).toBe(true);
  });
});
