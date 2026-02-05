/**
 * Contact Handler Tests
 *
 * Tests for contact form handling including:
 * - Successful submission
 * - Validation errors
 * - Rate limiting
 * - CSRF protection
 * - Honeypot spam detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the rate limiter module
vi.mock('../../../middleware/with-rate-limit', () => ({
  withRateLimit: vi.fn(),
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
}));

// Mock the CSRF module
vi.mock('../../../middleware/with-csrf', () => ({
  withCSRF: vi.fn(),
}));

// Import mocked modules after mock setup
import { withCSRF } from '../../../middleware/with-csrf';
import { withRateLimit } from '../../../middleware/with-rate-limit';
import { handleContact, type ContactHandlerConfig } from '../index';

/**
 * Create a mock request with JSON body
 */
function createMockRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return {
    json: vi.fn().mockResolvedValue(body),
    clone: vi.fn().mockReturnThis(),
    headers: new Headers({
      'Content-Type': 'application/json',
      'X-CSRF-Token': 'valid-csrf-token',
      ...headers,
    }),
    url: 'http://localhost:3000/api/contact',
  } as unknown as Request;
}

/**
 * Create a basic contact handler config
 */
function createMockConfig(overrides: Partial<ContactHandlerConfig> = {}): ContactHandlerConfig {
  return {
    recipient: 'contact@example.com',
    sendEmail: vi.fn().mockResolvedValue(undefined),
    siteName: 'Test Site',
    ...overrides,
  };
}

describe('Contact Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: rate limit passes
    vi.mocked(withRateLimit).mockResolvedValue({
      success: true,
      info: {
        remaining: 4,
        limit: 5,
        reset: Date.now() + 3600000,
      },
      headers: {
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '4',
        'X-RateLimit-Reset': String(Date.now() + 3600000),
      },
    });

    // Default: CSRF passes
    vi.mocked(withCSRF).mockResolvedValue({
      success: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful Submission', () => {
    it('should successfully process a valid contact form submission', async () => {
      const sendEmail = vi.fn().mockResolvedValue(undefined);
      const config = createMockConfig({ sendEmail });

      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message with at least 10 characters.',
        meta: {
          honeypot: '',
          submitted_at: new Date().toISOString(),
          source_page: '/contact',
        },
      });

      const result = await handleContact(request, config);

      expect(result.statusCode).toBe(200);
      expect(result.response).toEqual({ success: true });
      expect(sendEmail).toHaveBeenCalled();
    });

    it('should send email to configured recipient', async () => {
      const sendEmail = vi.fn().mockResolvedValue(undefined);
      const config = createMockConfig({
        sendEmail,
        recipient: 'admin@site.com',
      });

      const request = createMockRequest({
        name: 'Jane Smith',
        email: 'jane@example.com',
        message: 'Hello, I would like more information.',
        meta: { honeypot: '' },
      });

      await handleContact(request, config);

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@site.com',
          replyTo: 'jane@example.com',
        })
      );
    });

    it('should include form data in email', async () => {
      const sendEmail = vi.fn().mockResolvedValue(undefined);
      const config = createMockConfig({
        sendEmail,
        siteName: 'Psypnos',
      });

      const request = createMockRequest({
        name: 'Test User',
        email: 'test@example.com',
        message: 'I need help with something.',
        phone: '0123456789',
        subject: 'Support Request',
        meta: { honeypot: '' },
      });

      await handleContact(request, config);

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('Test User'),
          html: expect.stringContaining('Test User'),
        })
      );
    });

    it('should send confirmation email when enabled', async () => {
      const sendEmail = vi.fn().mockResolvedValue(undefined);
      const config = createMockConfig({
        sendEmail,
        sendConfirmation: true,
      });

      const request = createMockRequest({
        name: 'User',
        email: 'user@example.com',
        message: 'Test message for confirmation.',
        meta: { honeypot: '' },
      });

      await handleContact(request, config);

      // Should be called twice: once for main email, once for confirmation
      expect(sendEmail).toHaveBeenCalledTimes(2);
    });

    it('should not fail if confirmation email fails', async () => {
      let callCount = 0;
      const sendEmail = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Confirmation email failed');
        }
      });

      const config = createMockConfig({
        sendEmail,
        sendConfirmation: true,
      });

      const request = createMockRequest({
        name: 'User',
        email: 'user@example.com',
        message: 'Test message for confirmation.',
        meta: { honeypot: '' },
      });

      const result = await handleContact(request, config);

      expect(result.statusCode).toBe(200);
      expect(result.response).toEqual({ success: true });
    });

    it('should use custom confirmation content when provided', async () => {
      const sendEmail = vi.fn().mockResolvedValue(undefined);
      const config = createMockConfig({
        sendEmail,
        sendConfirmation: true,
        confirmationSubject: 'Merci pour votre message',
        confirmationText: 'Nous avons bien reçu votre message.',
        confirmationHtml: '<p>Merci!</p>',
      });

      const request = createMockRequest({
        name: 'User',
        email: 'user@example.com',
        message: 'Test message content.',
        meta: { honeypot: '' },
      });

      await handleContact(request, config);

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Merci pour votre message',
          text: 'Nous avons bien reçu votre message.',
          html: '<p>Merci!</p>',
        })
      );
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for name too short', async () => {
      const config = createMockConfig();
      const request = createMockRequest({
        name: 'J', // Too short (min 2)
        email: 'test@example.com',
        message: 'Valid message here.',
        meta: { honeypot: '' },
      });

      const result = await handleContact(request, config);

      expect(result.statusCode).toBe(400);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
        },
      });
    });

    it('should return 400 for invalid email', async () => {
      const config = createMockConfig();
      const request = createMockRequest({
        name: 'John Doe',
        email: 'invalid-email',
        message: 'Valid message here.',
        meta: { honeypot: '' },
      });

      const result = await handleContact(request, config);

      expect(result.statusCode).toBe(400);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
        },
      });
    });

    it('should return 400 for message too short', async () => {
      const config = createMockConfig();
      const request = createMockRequest({
        name: 'John Doe',
        email: 'test@example.com',
        message: 'Short', // Too short (min 10)
        meta: { honeypot: '' },
      });

      const result = await handleContact(request, config);

      expect(result.statusCode).toBe(400);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
        },
      });
    });

    it('should return 400 for missing required fields', async () => {
      const config = createMockConfig();
      const request = createMockRequest({
        name: 'John Doe',
        // Missing email and message
        meta: { honeypot: '' },
      });

      const result = await handleContact(request, config);

      expect(result.statusCode).toBe(400);
    });
  });

  describe('Spam Detection (Honeypot)', () => {
    it('should silently succeed when honeypot is filled (bot detection)', async () => {
      const sendEmail = vi.fn();
      const config = createMockConfig({ sendEmail });

      const request = createMockRequest({
        name: 'Bot User',
        email: 'bot@example.com',
        message: 'Spam message from a bot.',
        meta: {
          honeypot: 'I am a bot', // Honeypot filled
        },
      });

      const result = await handleContact(request, config);

      expect(result.statusCode).toBe(200);
      expect(result.response).toEqual({ success: true });
      // Email should NOT be sent for bots
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should process form when honeypot is empty', async () => {
      const sendEmail = vi.fn().mockResolvedValue(undefined);
      const config = createMockConfig({ sendEmail });

      const request = createMockRequest({
        name: 'Human User',
        email: 'human@example.com',
        message: 'This is a legitimate message.',
        meta: {
          honeypot: '', // Empty honeypot = real user
        },
      });

      const result = await handleContact(request, config);

      expect(result.statusCode).toBe(200);
      expect(sendEmail).toHaveBeenCalled();
    });

    it('should handle honeypot with whitespace only', async () => {
      const sendEmail = vi.fn();
      const config = createMockConfig({ sendEmail });

      const request = createMockRequest({
        name: 'User',
        email: 'user@example.com',
        message: 'Valid message here.',
        meta: {
          honeypot: '   ', // Whitespace only - should be trimmed
        },
      });

      await handleContact(request, config);

      // The schema transforms honeypot by trimming, so whitespace-only should pass
      expect(sendEmail).toHaveBeenCalled();
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit is exceeded', async () => {
      vi.mocked(withRateLimit).mockResolvedValue({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Trop de tentatives.',
          statusCode: 429,
          details: {
            retryAfter: 3600,
          },
        },
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + 3600000),
          'Retry-After': '3600',
        },
      });

      const config = createMockConfig();
      const request = createMockRequest({
        name: 'John Doe',
        email: 'test@example.com',
        message: 'Test message content.',
        meta: { honeypot: '' },
      });

      const result = await handleContact(request, config);

      expect(result.statusCode).toBe(429);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
        },
      });
      expect(result.headers['Retry-After']).toBeDefined();
    });

    it('should include rate limit headers in all responses', async () => {
      const config = createMockConfig();
      const request = createMockRequest({
        name: 'John Doe',
        email: 'test@example.com',
        message: 'Test message content.',
        meta: { honeypot: '' },
      });

      const result = await handleContact(request, config);

      expect(result.headers['X-RateLimit-Limit']).toBeDefined();
      expect(result.headers['X-RateLimit-Remaining']).toBeDefined();
    });

    it('should use configured rate limit', async () => {
      const config = createMockConfig({
        rateLimitPerHour: 10,
      });

      const request = createMockRequest({
        name: 'John Doe',
        email: 'test@example.com',
        message: 'Test message content.',
        meta: { honeypot: '' },
      });

      await handleContact(request, config);

      expect(withRateLimit).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          maxRequests: 10,
        })
      );
    });
  });

  describe('CSRF Protection', () => {
    it('should return 403 when CSRF validation fails', async () => {
      vi.mocked(withCSRF).mockResolvedValue({
        success: false,
        error: {
          code: 'CSRF_INVALID',
          message: 'Token CSRF invalide ou expiré.',
          statusCode: 403,
        },
      });

      const config = createMockConfig();
      const request = createMockRequest({
        name: 'John Doe',
        email: 'test@example.com',
        message: 'Test message content.',
        meta: { honeypot: '' },
      });

      const result = await handleContact(request, config);

      expect(result.statusCode).toBe(403);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'CSRF_INVALID',
        },
      });
    });

    it('should skip CSRF validation when disabled', async () => {
      const sendEmail = vi.fn().mockResolvedValue(undefined);
      const config = createMockConfig({
        sendEmail,
        csrfEnabled: false,
      });

      const request = createMockRequest({
        name: 'John Doe',
        email: 'test@example.com',
        message: 'Test message content.',
        meta: { honeypot: '' },
      });

      await handleContact(request, config);

      expect(withCSRF).not.toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
    });
  });

  describe('Email Sending Errors', () => {
    it('should return 500 when email sending fails', async () => {
      const config = createMockConfig({
        sendEmail: vi.fn().mockRejectedValue(new Error('SMTP error')),
      });

      const request = createMockRequest({
        name: 'John Doe',
        email: 'test@example.com',
        message: 'Test message content.',
        meta: { honeypot: '' },
      });

      const result = await handleContact(request, config);

      expect(result.statusCode).toBe(500);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
        },
      });
    });
  });

  describe('Email Content Security', () => {
    it('should escape HTML in user input', async () => {
      const sendEmail = vi.fn().mockResolvedValue(undefined);
      const config = createMockConfig({ sendEmail });

      const request = createMockRequest({
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        message: 'Message with <b>HTML</b> tags.',
        meta: { honeypot: '' },
      });

      await handleContact(request, config);

      const call = sendEmail.mock.calls[0]?.[0];
      expect(call?.html).not.toContain('<script>');
      expect(call?.html).toContain('&lt;script&gt;');
    });
  });
});
