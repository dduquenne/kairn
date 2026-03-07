/**
 * Validation Middleware Tests
 *
 * Tests for body and query parameter validation using Zod schemas.
 * Covers: valid input, invalid input, malformed JSON, combined validation,
 * common schemas, and the factory function.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

import {
  withBodyValidation,
  withQueryValidation,
  withValidation,
  commonSchemas,
  createValidationMiddleware,
} from '../with-validation';

import type { ApiRequest } from '../types';

/**
 * Create a mock request with optional URL and body
 */
function createMockRequest(url?: string, body?: Record<string, unknown>): ApiRequest {
  return {
    url,
    method: body ? 'POST' : 'GET',
    headers: { get: () => null },
    clone: () => ({
      headers: { get: () => null },
      json: () => Promise.resolve(body),
      formData: () => Promise.reject(new Error('not implemented')),
    }),
    json: body ? () => Promise.resolve(body) : () => Promise.reject(new Error('No body')),
  };
}

// =============================================================================
// withBodyValidation
// =============================================================================

describe('withBodyValidation', () => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  it('should return validated body for valid input', async () => {
    const request = createMockRequest(undefined, {
      email: 'test@example.com',
      password: 'securepass123',
    });

    const result = await withBodyValidation(request, schema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.body.email).toBe('test@example.com');
      expect(result.body.password).toBe('securepass123');
    }
  });

  it('should return error for invalid body data', async () => {
    const request = createMockRequest(undefined, {
      email: 'not-an-email',
      password: 'short',
    });

    const result = await withBodyValidation(request, schema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.statusCode).toBe(400);
      expect(result.error.details).toHaveProperty('type', 'body');
    }
  });

  it('should return error for missing required fields', async () => {
    const request = createMockRequest(undefined, { email: 'test@example.com' });

    const result = await withBodyValidation(request, schema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should return INVALID_JSON error for malformed JSON', async () => {
    const request: ApiRequest = {
      headers: { get: () => null },
      clone: () => ({
        headers: { get: () => null },
        json: () => Promise.reject(new Error('Unexpected token')),
        formData: () => Promise.reject(new Error('not implemented')),
      }),
      json: () => Promise.reject(new Error('Unexpected token')),
    };

    const result = await withBodyValidation(request, schema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_JSON');
      expect(result.error.statusCode).toBe(400);
    }
  });

  it('should strip extra fields with strict schema', async () => {
    const strictSchema = z.object({ name: z.string() }).strict();
    const request = createMockRequest(undefined, {
      name: 'John',
      extra: 'field',
    });

    const result = await withBodyValidation(request, strictSchema);

    expect(result.success).toBe(false);
  });

  it('should apply default values from schema', async () => {
    const schemaWithDefaults = z.object({
      name: z.string(),
      role: z.string().default('user'),
    });
    const request = createMockRequest(undefined, { name: 'John' });

    const result = await withBodyValidation(request, schemaWithDefaults);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.body.role).toBe('user');
    }
  });
});

// =============================================================================
// withQueryValidation
// =============================================================================

describe('withQueryValidation', () => {
  const schema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
  });

  it('should return validated query params for valid URL', () => {
    const request = createMockRequest('https://example.com/api?page=2&limit=10&search=test');

    const result = withQueryValidation(request, schema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.query.page).toBe(2);
      expect(result.query.limit).toBe(10);
      expect(result.query.search).toBe('test');
    }
  });

  it('should apply defaults when params are missing', () => {
    const request = createMockRequest('https://example.com/api');

    const result = withQueryValidation(request, schema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.query.page).toBe(1);
      expect(result.query.limit).toBe(20);
    }
  });

  it('should return error for invalid query params', () => {
    const invalidSchema = z.object({
      page: z.coerce.number().int().min(1),
    });
    const request = createMockRequest('https://example.com/api?page=-1');

    const result = withQueryValidation(request, invalidSchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.statusCode).toBe(400);
      expect(result.error.details).toHaveProperty('type', 'query');
    }
  });

  it('should handle missing URL gracefully', () => {
    const request = createMockRequest(undefined);

    const result = withQueryValidation(request, schema);

    // Should use defaults
    expect(result.success).toBe(true);
  });

  it('should handle invalid URL gracefully', () => {
    const request = createMockRequest('not-a-valid-url');

    const result = withQueryValidation(request, schema);

    // parseQueryString returns {} for invalid URLs, defaults should apply
    expect(result.success).toBe(true);
  });

  it('should handle multiple values for the same query param', () => {
    const multiSchema = z.object({
      tags: z.union([z.string(), z.array(z.string())]).optional(),
    });
    const request = createMockRequest('https://example.com/api?tags=a&tags=b');

    const result = withQueryValidation(request, multiSchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.query.tags).toEqual(['a', 'b']);
    }
  });
});

// =============================================================================
// withValidation (combined)
// =============================================================================

describe('withValidation', () => {
  const bodySchema = z.object({
    title: z.string().min(1),
    content: z.string().min(10),
  });

  const querySchema = z.object({
    draft: z.enum(['true', 'false']).default('false'),
  });

  it('should validate both body and query successfully', async () => {
    const request = createMockRequest('https://example.com/api?draft=true', {
      title: 'Test',
      content: 'This is a long enough content',
    });

    const result = await withValidation(request, bodySchema, querySchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.body.title).toBe('Test');
      expect(result.query.draft).toBe('true');
    }
  });

  it('should return query error first when both are invalid', async () => {
    const strictQuerySchema = z.object({
      mode: z.enum(['edit', 'view']),
    });

    const request = createMockRequest('https://example.com/api?mode=invalid', { title: '' });

    const result = await withValidation(request, bodySchema, strictQuerySchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      // Query is validated first
      expect(result.error.details).toHaveProperty('type', 'query');
    }
  });

  it('should return body error when query is valid but body is invalid', async () => {
    const request = createMockRequest('https://example.com/api?draft=false', {
      title: '',
      content: 'short',
    });

    const result = await withValidation(request, bodySchema, querySchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.details).toHaveProperty('type', 'body');
    }
  });
});

// =============================================================================
// commonSchemas
// =============================================================================

describe('commonSchemas', () => {
  describe('pagination', () => {
    it('should validate valid pagination params', () => {
      const result = commonSchemas.pagination.safeParse({ page: '2', limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should apply defaults', () => {
      const result = commonSchemas.pagination.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should reject page < 1', () => {
      const result = commonSchemas.pagination.safeParse({ page: '0' });
      expect(result.success).toBe(false);
    });

    it('should reject limit > 100', () => {
      const result = commonSchemas.pagination.safeParse({ limit: '101' });
      expect(result.success).toBe(false);
    });
  });

  describe('id', () => {
    it('should validate non-empty id', () => {
      const result = commonSchemas.id.safeParse({ id: 'abc-123' });
      expect(result.success).toBe(true);
    });

    it('should reject empty id', () => {
      const result = commonSchemas.id.safeParse({ id: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('slug', () => {
    it('should validate valid slug', () => {
      const result = commonSchemas.slug.safeParse({ slug: 'my-article' });
      expect(result.success).toBe(true);
    });

    it('should reject slug exceeding 200 chars', () => {
      const result = commonSchemas.slug.safeParse({ slug: 'a'.repeat(201) });
      expect(result.success).toBe(false);
    });
  });

  describe('email', () => {
    it('should validate and lowercase email', () => {
      const result = commonSchemas.email.safeParse('Test@Example.COM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should reject invalid email', () => {
      const result = commonSchemas.email.safeParse('not-email');
      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// createValidationMiddleware
// =============================================================================

describe('createValidationMiddleware', () => {
  it('should return an object with body, query, both, and schemas', () => {
    const middleware = createValidationMiddleware();

    expect(middleware.body).toBe(withBodyValidation);
    expect(middleware.query).toBe(withQueryValidation);
    expect(middleware.both).toBe(withValidation);
    expect(middleware.schemas).toBe(commonSchemas);
  });
});
