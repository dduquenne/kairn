/**
 * Testimonials Handler Tests
 *
 * Tests for testimonial CRUD operations including:
 * - List with pagination and filtering
 * - Get by ID
 * - Create, update, delete
 * - Validation schemas
 * - Error handling (Prisma errors, internal errors)
 * - Cache revalidation callbacks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@kairn/core', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@kairn/db', () => ({
  handlePrismaError: vi.fn().mockReturnValue(null),
}));

import { handlePrismaError } from '@kairn/db';

import {
  handleGetTestimonials,
  handleGetTestimonialById,
  handleCreateTestimonial,
  handleUpdateTestimonial,
  handleDeleteTestimonial,
  createTestimonialsHandlers,
  testimonialSchema,
  testimonialUpdateSchema,
  testimonialsQuerySchema,
} from '../index';
import type { Testimonial, TestimonialsHandlerConfig } from '../index';
import type { ApiRequest } from '../../../middleware/types';

// =============================================================================
// Helpers
// =============================================================================

/**
 * Create a mock testimonial
 */
function createMockTestimonial(overrides: Partial<Testimonial> = {}): Testimonial {
  return {
    id: 'test-123',
    name: 'Marie Dupont',
    content: 'Excellente expérience, je recommande vivement ce praticien.',
    rating: 5,
    image: null,
    role: 'Patiente',
    company: null,
    featured: false,
    approved: true,
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    ...overrides,
  };
}

/**
 * Create a mock request
 */
function createMockRequest(url: string, body?: Record<string, unknown>): ApiRequest {
  return {
    url,
    method: body ? 'POST' : 'GET',
    json: body ? () => Promise.resolve(body) : () => Promise.reject(new Error('No body')),
    headers: { get: () => null },
    clone: () => ({
      headers: { get: () => null },
      json: () => Promise.resolve(body),
      formData: () => Promise.reject(new Error('not implemented')),
    }),
  };
}

/**
 * Create a mock handler config
 */
function createMockConfig(
  overrides: Partial<TestimonialsHandlerConfig> = {}
): TestimonialsHandlerConfig {
  return {
    siteId: 'site-1',
    getAllTestimonials: vi.fn().mockResolvedValue({ testimonials: [], total: 0 }),
    getTestimonialById: vi.fn().mockResolvedValue(null),
    createTestimonial: vi.fn().mockResolvedValue(createMockTestimonial()),
    updateTestimonial: vi.fn().mockResolvedValue(createMockTestimonial()),
    deleteTestimonial: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// =============================================================================
// Zod Schemas
// =============================================================================

describe('Zod Schemas', () => {
  describe('testimonialSchema', () => {
    it('should validate correct input', () => {
      const result = testimonialSchema.safeParse({
        name: 'Marie',
        content: 'Un témoignage suffisamment long pour passer la validation.',
        rating: 5,
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = testimonialSchema.safeParse({
        name: '',
        content: 'Contenu valide de plus de dix caractères.',
      });
      expect(result.success).toBe(false);
    });

    it('should reject content shorter than 10 chars', () => {
      const result = testimonialSchema.safeParse({
        name: 'Marie',
        content: 'Court',
      });
      expect(result.success).toBe(false);
    });

    it('should reject rating outside 1-5 range', () => {
      const result = testimonialSchema.safeParse({
        name: 'Marie',
        content: 'Contenu valide de plus de dix caractères.',
        rating: 6,
      });
      expect(result.success).toBe(false);
    });

    it('should apply default values for featured and approved', () => {
      const result = testimonialSchema.safeParse({
        name: 'Marie',
        content: 'Contenu valide de plus de dix caractères.',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.featured).toBe(false);
        expect(result.data.approved).toBe(false);
      }
    });

    it('should accept nullable image URL', () => {
      const result = testimonialSchema.safeParse({
        name: 'Marie',
        content: 'Contenu valide de plus de dix caractères.',
        image: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('testimonialUpdateSchema', () => {
    it('should allow partial updates', () => {
      const result = testimonialUpdateSchema.safeParse({ name: 'Jean' });
      expect(result.success).toBe(true);
    });

    it('should allow empty object', () => {
      const result = testimonialUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('testimonialsQuerySchema', () => {
    it('should parse approved filter', () => {
      const result = testimonialsQuerySchema.safeParse({ approved: 'true' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.approved).toBe(true);
      }
    });

    it('should parse featured filter', () => {
      const result = testimonialsQuerySchema.safeParse({ featured: 'true' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.featured).toBe(true);
      }
    });

    it('should transform "all" to undefined for approved', () => {
      const result = testimonialsQuerySchema.safeParse({ approved: 'all' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.approved).toBeUndefined();
      }
    });

    it('should apply pagination defaults', () => {
      const result = testimonialsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });
  });
});

// =============================================================================
// handleGetTestimonials
// =============================================================================

describe('handleGetTestimonials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated testimonials', async () => {
    const testimonials = [createMockTestimonial(), createMockTestimonial({ id: 'test-456' })];
    const config = createMockConfig({
      getAllTestimonials: vi.fn().mockResolvedValue({ testimonials, total: 2 }),
    });

    const request = createMockRequest('https://example.com/api/testimonials?page=1&limit=20');
    const result = await handleGetTestimonials(request, config);

    expect(result.statusCode).toBe(200);
    expect(result.response.success).toBe(true);
    if (result.response.success) {
      expect(result.response.data).toHaveLength(2);
    }
  });

  it('should pass siteId to getAllTestimonials', async () => {
    const config = createMockConfig();
    const request = createMockRequest('https://example.com/api/testimonials');

    await handleGetTestimonials(request, config);

    expect(config.getAllTestimonials).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: 'site-1' })
    );
  });

  it('should set public cache header for approved testimonials', async () => {
    const config = createMockConfig({
      getAllTestimonials: vi.fn().mockResolvedValue({ testimonials: [], total: 0 }),
    });
    const request = createMockRequest('https://example.com/api/testimonials?approved=true');

    const result = await handleGetTestimonials(request, config);

    expect(result.headers['Cache-Control']).toContain('public');
  });

  it('should set private cache for non-approved testimonials', async () => {
    const config = createMockConfig({
      getAllTestimonials: vi.fn().mockResolvedValue({ testimonials: [], total: 0 }),
    });
    const request = createMockRequest('https://example.com/api/testimonials?approved=false');

    const result = await handleGetTestimonials(request, config);

    expect(result.headers['Cache-Control']).toContain('private');
  });

  it('should return 400 for invalid query params', async () => {
    const config = createMockConfig();
    const request = createMockRequest('https://example.com/api/testimonials?page=-1');

    const result = await handleGetTestimonials(request, config);

    expect(result.statusCode).toBe(400);
  });

  it('should handle Prisma errors gracefully', async () => {
    vi.mocked(handlePrismaError).mockReturnValueOnce({
      code: 'DATABASE_ERROR',
      message: 'Connection lost',
      statusCode: 503,
    });
    const config = createMockConfig({
      getAllTestimonials: vi.fn().mockRejectedValue(new Error('DB Error')),
    });
    const request = createMockRequest('https://example.com/api/testimonials');

    const result = await handleGetTestimonials(request, config);

    expect(result.statusCode).toBe(503);
  });

  it('should return 500 for unknown errors', async () => {
    const config = createMockConfig({
      getAllTestimonials: vi.fn().mockRejectedValue(new Error('Unknown')),
    });
    const request = createMockRequest('https://example.com/api/testimonials');

    const result = await handleGetTestimonials(request, config);

    expect(result.statusCode).toBe(500);
  });
});

// =============================================================================
// handleGetTestimonialById
// =============================================================================

describe('handleGetTestimonialById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a testimonial by ID', async () => {
    const testimonial = createMockTestimonial();
    const config = createMockConfig({
      getTestimonialById: vi.fn().mockResolvedValue(testimonial),
    });

    const result = await handleGetTestimonialById('test-123', config);

    expect(result.statusCode).toBe(200);
    expect(result.response.success).toBe(true);
    if (result.response.success) {
      expect(result.response.data.id).toBe('test-123');
    }
  });

  it('should return 404 when testimonial not found', async () => {
    const config = createMockConfig();

    const result = await handleGetTestimonialById('nonexistent', config);

    expect(result.statusCode).toBe(404);
    expect(result.response.success).toBe(false);
  });

  it('should set public cache for approved testimonials', async () => {
    const config = createMockConfig({
      getTestimonialById: vi.fn().mockResolvedValue(createMockTestimonial({ approved: true })),
    });

    const result = await handleGetTestimonialById('test-123', config);

    expect(result.headers['Cache-Control']).toContain('public');
  });

  it('should set private cache for unapproved testimonials', async () => {
    const config = createMockConfig({
      getTestimonialById: vi.fn().mockResolvedValue(createMockTestimonial({ approved: false })),
    });

    const result = await handleGetTestimonialById('test-123', config);

    expect(result.headers['Cache-Control']).toContain('private');
  });
});

// =============================================================================
// handleCreateTestimonial
// =============================================================================

describe('handleCreateTestimonial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a testimonial with valid data', async () => {
    const config = createMockConfig();
    const request = createMockRequest('https://example.com/api/testimonials', {
      name: 'Marie',
      content: 'Un témoignage suffisamment long pour passer.',
      rating: 5,
    });

    const result = await handleCreateTestimonial(request, config);

    expect(result.statusCode).toBe(201);
    expect(result.response.success).toBe(true);
  });

  it('should pass siteId to createTestimonial when configured', async () => {
    const config = createMockConfig();
    const request = createMockRequest('https://example.com/api/testimonials', {
      name: 'Marie',
      content: 'Un témoignage suffisamment long pour passer.',
    });

    await handleCreateTestimonial(request, config);

    expect(config.createTestimonial).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: 'site-1' })
    );
  });

  it('should return 400 for invalid body', async () => {
    const config = createMockConfig();
    const request = createMockRequest('https://example.com/api/testimonials', {
      name: '',
      content: 'short',
    });

    const result = await handleCreateTestimonial(request, config);

    expect(result.statusCode).toBe(400);
  });

  it('should call onCacheRevalidate after creation', async () => {
    const onCacheRevalidate = vi.fn().mockResolvedValue(undefined);
    const config = createMockConfig({ onCacheRevalidate });
    const request = createMockRequest('https://example.com/api/testimonials', {
      name: 'Marie',
      content: 'Un témoignage suffisamment long pour passer.',
    });

    await handleCreateTestimonial(request, config);

    expect(onCacheRevalidate).toHaveBeenCalledWith(['/api/testimonials']);
  });

  it('should handle Prisma errors on create', async () => {
    vi.mocked(handlePrismaError).mockReturnValueOnce({
      code: 'UNIQUE_CONSTRAINT',
      message: 'Duplicate entry',
      statusCode: 409,
    });
    const config = createMockConfig({
      createTestimonial: vi.fn().mockRejectedValue(new Error('DB Error')),
    });
    const request = createMockRequest('https://example.com/api/testimonials', {
      name: 'Marie',
      content: 'Un témoignage suffisamment long pour passer.',
    });

    const result = await handleCreateTestimonial(request, config);

    expect(result.statusCode).toBe(409);
  });
});

// =============================================================================
// handleUpdateTestimonial
// =============================================================================

describe('handleUpdateTestimonial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update an existing testimonial', async () => {
    const updated = createMockTestimonial({ name: 'Jean' });
    const config = createMockConfig({
      getTestimonialById: vi.fn().mockResolvedValue(createMockTestimonial()),
      updateTestimonial: vi.fn().mockResolvedValue(updated),
    });
    const request = createMockRequest('https://example.com/api/testimonials/test-123', {
      name: 'Jean',
    });

    const result = await handleUpdateTestimonial('test-123', request, config);

    expect(result.statusCode).toBe(200);
    expect(result.response.success).toBe(true);
  });

  it('should return 404 when testimonial to update does not exist', async () => {
    const config = createMockConfig();
    const request = createMockRequest('https://example.com/api/testimonials/nonexistent', {
      name: 'Jean',
    });

    const result = await handleUpdateTestimonial('nonexistent', request, config);

    expect(result.statusCode).toBe(404);
  });

  it('should return 400 for invalid update body', async () => {
    const config = createMockConfig({
      getTestimonialById: vi.fn().mockResolvedValue(createMockTestimonial()),
    });
    const request = createMockRequest('https://example.com/api/testimonials/test-123', {
      rating: 10, // out of range
    });

    const result = await handleUpdateTestimonial('test-123', request, config);

    expect(result.statusCode).toBe(400);
  });

  it('should call onCacheRevalidate after update', async () => {
    const onCacheRevalidate = vi.fn().mockResolvedValue(undefined);
    const config = createMockConfig({
      getTestimonialById: vi.fn().mockResolvedValue(createMockTestimonial()),
      onCacheRevalidate,
    });
    const request = createMockRequest('https://example.com/api/testimonials/test-123', {
      name: 'Jean',
    });

    await handleUpdateTestimonial('test-123', request, config);

    expect(onCacheRevalidate).toHaveBeenCalledWith(['/api/testimonials']);
  });
});

// =============================================================================
// handleDeleteTestimonial
// =============================================================================

describe('handleDeleteTestimonial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete an existing testimonial', async () => {
    const config = createMockConfig({
      getTestimonialById: vi.fn().mockResolvedValue(createMockTestimonial()),
    });

    const result = await handleDeleteTestimonial('test-123', config);

    expect(result.statusCode).toBe(200);
    expect(result.response.success).toBe(true);
    if (result.response.success) {
      expect(result.response.data).toEqual({ deleted: true });
    }
  });

  it('should return 404 when testimonial to delete does not exist', async () => {
    const config = createMockConfig();

    const result = await handleDeleteTestimonial('nonexistent', config);

    expect(result.statusCode).toBe(404);
  });

  it('should call onCacheRevalidate after deletion', async () => {
    const onCacheRevalidate = vi.fn().mockResolvedValue(undefined);
    const config = createMockConfig({
      getTestimonialById: vi.fn().mockResolvedValue(createMockTestimonial()),
      onCacheRevalidate,
    });

    await handleDeleteTestimonial('test-123', config);

    expect(onCacheRevalidate).toHaveBeenCalledWith(['/api/testimonials']);
  });

  it('should handle errors during deletion', async () => {
    const config = createMockConfig({
      getTestimonialById: vi.fn().mockResolvedValue(createMockTestimonial()),
      deleteTestimonial: vi.fn().mockRejectedValue(new Error('DB Error')),
    });

    const result = await handleDeleteTestimonial('test-123', config);

    expect(result.statusCode).toBe(500);
  });
});

// =============================================================================
// createTestimonialsHandlers (factory)
// =============================================================================

describe('createTestimonialsHandlers', () => {
  it('should return all handler functions', () => {
    const config = createMockConfig();
    const handlers = createTestimonialsHandlers(config);

    expect(typeof handlers.getAll).toBe('function');
    expect(typeof handlers.getById).toBe('function');
    expect(typeof handlers.create).toBe('function');
    expect(typeof handlers.update).toBe('function');
    expect(typeof handlers.delete).toBe('function');
  });

  it('should bind config to each handler', async () => {
    const config = createMockConfig({
      getAllTestimonials: vi.fn().mockResolvedValue({ testimonials: [], total: 0 }),
    });
    const handlers = createTestimonialsHandlers(config);

    const request = createMockRequest('https://example.com/api/testimonials');
    await handlers.getAll(request);

    expect(config.getAllTestimonials).toHaveBeenCalled();
  });
});
