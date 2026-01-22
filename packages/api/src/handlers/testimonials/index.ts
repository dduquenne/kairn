/**
 * Testimonials Handler
 *
 * CRUD operations for testimonials.
 */

import { z } from 'zod';

import type { ApiRequest, AuthContext } from '../../middleware/types';
import { withBodyValidation, withQueryValidation } from '../../middleware/with-validation';
import { error, paginated, success } from '../../utils/response';

/**
 * Testimonial schema
 */
export const testimonialSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  content: z.string().min(10, 'Le témoignage doit contenir au moins 10 caractères').max(2000),
  rating: z.number().int().min(1).max(5).optional(),
  image: z.string().url().optional().nullable(),
  role: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  featured: z.boolean().default(false),
  approved: z.boolean().default(false),
  siteId: z.string().optional(),
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;

/**
 * Testimonial update schema
 */
export const testimonialUpdateSchema = testimonialSchema.partial();

export type TestimonialUpdateInput = z.infer<typeof testimonialUpdateSchema>;

/**
 * Testimonial list query params
 */
export const testimonialsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  approved: z
    .enum(['true', 'false', 'all'])
    .optional()
    .transform(v => (v === 'true' ? true : v === 'false' ? false : undefined)),
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform(v => (v === 'true' ? true : v === 'false' ? false : undefined)),
  siteId: z.string().optional(),
});

export type TestimonialsQueryParams = z.infer<typeof testimonialsQuerySchema>;

/**
 * Testimonial returned from API
 */
export interface Testimonial {
  id: string;
  name: string;
  content: string;
  rating?: number | null;
  image?: string | null;
  role?: string | null;
  company?: string | null;
  featured: boolean;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Testimonials handler configuration
 */
export interface TestimonialsHandlerConfig {
  /** Site ID for multi-tenant filtering */
  siteId?: string;
  /** Function to get all testimonials */
  getAllTestimonials: (options: {
    page?: number;
    limit?: number;
    approved?: boolean;
    featured?: boolean;
    siteId?: string;
  }) => Promise<{ testimonials: Testimonial[]; total: number }>;
  /** Function to get testimonial by ID */
  getTestimonialById: (id: string) => Promise<Testimonial | null>;
  /** Function to create a testimonial */
  createTestimonial: (data: TestimonialInput) => Promise<Testimonial>;
  /** Function to update a testimonial */
  updateTestimonial: (id: string, data: TestimonialUpdateInput) => Promise<Testimonial>;
  /** Function to delete a testimonial */
  deleteTestimonial: (id: string) => Promise<void>;
  /** Cache revalidation callback */
  onCacheRevalidate?: (paths: string[]) => Promise<void>;
}

/**
 * Handler result type
 */
export interface TestimonialHandlerResult<T = unknown> {
  response:
    | { success: true; data: T; pagination?: unknown }
    | { success: false; error: { code: string; message: string; details?: unknown } };
  statusCode: number;
  headers: Record<string, string>;
}

/**
 * Get all testimonials with filtering and pagination
 */
export async function handleGetTestimonials(
  request: ApiRequest,
  config: TestimonialsHandlerConfig
): Promise<TestimonialHandlerResult<Testimonial[]>> {
  const { getAllTestimonials, siteId: configSiteId } = config;

  const queryResult = withQueryValidation(request, testimonialsQuerySchema);

  if (!queryResult.success) {
    return {
      response: error('VALIDATION_ERROR', 'Paramètres de requête invalides'),
      statusCode: 400,
      headers: {},
    };
  }

  const { page, limit, approved, featured, siteId: querySiteId } = queryResult.query;

  try {
    const { testimonials, total } = await getAllTestimonials({
      page,
      limit,
      approved,
      featured,
      siteId: querySiteId || configSiteId,
    });

    // Public testimonials (approved only) can be cached
    const isPublic = approved === true;
    const cacheControl = isPublic
      ? 'public, s-maxage=3600, max-age=3600, stale-while-revalidate=86400'
      : 'private, no-cache';

    return {
      response: paginated(testimonials, { page, limit, total }),
      statusCode: 200,
      headers: {
        'Cache-Control': cacheControl,
      },
    };
  } catch (e) {
    console.error('Error fetching testimonials:', e);
    return {
      response: error('INTERNAL_ERROR', 'Erreur lors de la récupération des témoignages'),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Get a single testimonial by ID
 */
export async function handleGetTestimonialById(
  id: string,
  config: TestimonialsHandlerConfig
): Promise<TestimonialHandlerResult<Testimonial>> {
  const { getTestimonialById } = config;

  try {
    const testimonial = await getTestimonialById(id);

    if (!testimonial) {
      return {
        response: error('NOT_FOUND', 'Témoignage non trouvé'),
        statusCode: 404,
        headers: {},
      };
    }

    return {
      response: success(testimonial),
      statusCode: 200,
      headers: {
        'Cache-Control': testimonial.approved ? 'public, max-age=3600' : 'private, no-cache',
      },
    };
  } catch (e) {
    console.error('Error fetching testimonial:', e);
    return {
      response: error('INTERNAL_ERROR', 'Erreur lors de la récupération du témoignage'),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Create a new testimonial (requires admin)
 */
export async function handleCreateTestimonial(
  request: ApiRequest,
  config: TestimonialsHandlerConfig,
  _authContext?: AuthContext
): Promise<TestimonialHandlerResult<Testimonial>> {
  const { createTestimonial, siteId, onCacheRevalidate } = config;

  const bodyResult = await withBodyValidation(request, testimonialSchema);

  if (!bodyResult.success) {
    return {
      response: error('VALIDATION_ERROR', 'Données invalides', {
        details: bodyResult.error.details,
      }),
      statusCode: 400,
      headers: {},
    };
  }

  const data = bodyResult.body;

  try {
    const testimonialData = siteId ? { ...data, siteId } : data;
    const testimonial = await createTestimonial(testimonialData);

    if (onCacheRevalidate) {
      await onCacheRevalidate(['/api/testimonials']);
    }

    return {
      response: success(testimonial),
      statusCode: 201,
      headers: {},
    };
  } catch (e) {
    console.error('Error creating testimonial:', e);
    return {
      response: error('INTERNAL_ERROR', 'Erreur lors de la création du témoignage'),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Update a testimonial (requires admin)
 */
export async function handleUpdateTestimonial(
  id: string,
  request: ApiRequest,
  config: TestimonialsHandlerConfig,
  _authContext?: AuthContext
): Promise<TestimonialHandlerResult<Testimonial>> {
  const { getTestimonialById, updateTestimonial, onCacheRevalidate } = config;

  const bodyResult = await withBodyValidation(request, testimonialUpdateSchema);

  if (!bodyResult.success) {
    return {
      response: error('VALIDATION_ERROR', 'Données invalides', {
        details: bodyResult.error.details,
      }),
      statusCode: 400,
      headers: {},
    };
  }

  const data = bodyResult.body;

  const existing = await getTestimonialById(id);
  if (!existing) {
    return {
      response: error('NOT_FOUND', 'Témoignage non trouvé'),
      statusCode: 404,
      headers: {},
    };
  }

  try {
    const testimonial = await updateTestimonial(id, data);

    if (onCacheRevalidate) {
      await onCacheRevalidate(['/api/testimonials']);
    }

    return {
      response: success(testimonial),
      statusCode: 200,
      headers: {},
    };
  } catch (e) {
    console.error('Error updating testimonial:', e);
    return {
      response: error('INTERNAL_ERROR', 'Erreur lors de la mise à jour du témoignage'),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Delete a testimonial (requires admin)
 */
export async function handleDeleteTestimonial(
  id: string,
  config: TestimonialsHandlerConfig,
  _authContext?: AuthContext
): Promise<TestimonialHandlerResult<{ deleted: boolean }>> {
  const { getTestimonialById, deleteTestimonial, onCacheRevalidate } = config;

  const existing = await getTestimonialById(id);
  if (!existing) {
    return {
      response: error('NOT_FOUND', 'Témoignage non trouvé'),
      statusCode: 404,
      headers: {},
    };
  }

  try {
    await deleteTestimonial(id);

    if (onCacheRevalidate) {
      await onCacheRevalidate(['/api/testimonials']);
    }

    return {
      response: success({ deleted: true }),
      statusCode: 200,
      headers: {},
    };
  } catch (e) {
    console.error('Error deleting testimonial:', e);
    return {
      response: error('INTERNAL_ERROR', 'Erreur lors de la suppression du témoignage'),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Create testimonials handlers with preset configuration
 */
export function createTestimonialsHandlers(config: TestimonialsHandlerConfig) {
  return {
    getAll: (request: ApiRequest) => handleGetTestimonials(request, config),
    getById: (id: string) => handleGetTestimonialById(id, config),
    create: (request: ApiRequest, authContext?: AuthContext) =>
      handleCreateTestimonial(request, config, authContext),
    update: (id: string, request: ApiRequest, authContext?: AuthContext) =>
      handleUpdateTestimonial(id, request, config, authContext),
    delete: (id: string, authContext?: AuthContext) =>
      handleDeleteTestimonial(id, config, authContext),
  };
}
