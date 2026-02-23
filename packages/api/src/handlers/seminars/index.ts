/**
 * Seminars Handler
 *
 * CRUD operations for seminars/events.
 */

import { z } from 'zod';

import type { ApiRequest, AuthContext } from '../../middleware/types';
import { withBodyValidation, withQueryValidation } from '../../middleware/with-validation';
import { error, paginated, success } from '../../utils/response';

/**
 * Seminar status
 */
export type SeminarStatus = 'draft' | 'published' | 'cancelled' | 'completed';

/**
 * Seminar schema
 */
export const seminarSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Le slug doit être en minuscules avec des tirets'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères').max(5000),
  shortDescription: z.string().max(500).optional(),
  coverImage: z.string().url().optional().nullable(),
  date: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  location: z.string().max(200).optional(),
  locationAddress: z.string().max(500).optional(),
  isOnline: z.boolean().default(false),
  onlineUrl: z.string().url().optional().nullable(),
  maxParticipants: z.number().int().min(1).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).default('EUR'),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).default('draft'),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  siteId: z.string().optional(),
});

export type SeminarInput = z.infer<typeof seminarSchema>;

/**
 * Seminar update schema
 */
export const seminarUpdateSchema = seminarSchema.partial().omit({ slug: true });

export type SeminarUpdateInput = z.infer<typeof seminarUpdateSchema>;

/**
 * Registration schema
 */
export const registrationSchema = z.object({
  seminarId: z.string(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z
    .string()
    .optional()
    .transform(value => value?.trim() ?? '')
    .refine(value => !value || /^(?:\+\d{7,15}|\d{10,15})$/.test(value.replace(/[^+\d]/g, '')), {
      message: 'Format de téléphone invalide',
    }),
  company: z.string().max(100).optional(),
  message: z.string().max(1000).optional(),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

/**
 * Seminar list query params
 */
export const seminarsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['draft', 'published', 'cancelled', 'completed', 'all']).optional(),
  upcoming: z
    .enum(['true', 'false'])
    .optional()
    .transform(v => v === 'true'),
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform(v => (v === 'true' ? true : v === 'false' ? false : undefined)),
  tag: z.string().optional(),
  siteId: z.string().optional(),
});

export type SeminarsQueryParams = z.infer<typeof seminarsQuerySchema>;

/**
 * Seminar returned from API
 */
export interface Seminar {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  coverImage?: string | null;
  date: string;
  endDate?: string | null;
  location?: string | null;
  locationAddress?: string | null;
  isOnline: boolean;
  onlineUrl?: string | null;
  maxParticipants?: number | null;
  currentParticipants?: number;
  price?: number | null;
  currency: string;
  status: SeminarStatus;
  featured: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Registration returned from API
 */
export interface Registration {
  id: string;
  seminarId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

/**
 * Seminars handler configuration
 */
export interface SeminarsHandlerConfig {
  /** Site ID for multi-tenant filtering */
  siteId?: string;
  /** Function to get all seminars */
  getAllSeminars: (options: {
    page?: number;
    limit?: number;
    status?: string;
    upcoming?: boolean;
    featured?: boolean;
    tag?: string;
    siteId?: string;
  }) => Promise<{ seminars: Seminar[]; total: number }>;
  /** Function to get seminar by slug */
  getSeminarBySlug: (slug: string, siteId?: string) => Promise<Seminar | null>;
  /** Function to get seminar by ID */
  getSeminarById: (id: string) => Promise<Seminar | null>;
  /** Function to create a seminar */
  createSeminar: (data: SeminarInput) => Promise<Seminar>;
  /** Function to update a seminar */
  updateSeminar: (id: string, data: SeminarUpdateInput) => Promise<Seminar>;
  /** Function to delete a seminar */
  deleteSeminar: (id: string) => Promise<void>;
  /** Function to check if slug exists */
  slugExists: (slug: string, excludeId?: string, siteId?: string) => Promise<boolean>;
  /** Function to create a registration */
  createRegistration?: (data: RegistrationInput) => Promise<Registration>;
  /** Function to get registrations for a seminar */
  getRegistrations?: (seminarId: string) => Promise<Registration[]>;
  /** Send confirmation email for registration */
  sendRegistrationConfirmation?: (registration: Registration, seminar: Seminar) => Promise<void>;
  /** Cache revalidation callback */
  onCacheRevalidate?: (paths: string[]) => Promise<void>;
}

/**
 * Handler result type
 */
export interface SeminarHandlerResult<T = unknown> {
  response:
    | { success: true; data: T; pagination?: unknown }
    | { success: false; error: { code: string; message: string; details?: unknown } };
  statusCode: number;
  headers: Record<string, string>;
}

/**
 * Get all seminars with filtering and pagination
 */
export async function handleGetSeminars(
  request: ApiRequest,
  config: SeminarsHandlerConfig
): Promise<SeminarHandlerResult<Seminar[]>> {
  const { getAllSeminars, siteId: configSiteId } = config;

  const queryResult = withQueryValidation(request, seminarsQuerySchema);

  if (!queryResult.success) {
    return {
      response: error('VALIDATION_ERROR', 'Paramètres de requête invalides'),
      statusCode: 400,
      headers: {},
    };
  }

  const { page, limit, status, upcoming, featured, tag, siteId: querySiteId } = queryResult.query;

  try {
    const { seminars, total } = await getAllSeminars({
      page,
      limit,
      status,
      upcoming,
      featured,
      tag,
      siteId: querySiteId || configSiteId,
    });

    // Public seminars (published) can be cached
    const isPublic = status === 'published' || upcoming;
    const cacheControl = isPublic
      ? 'public, max-age=300, stale-while-revalidate=3600'
      : 'private, no-cache';

    return {
      response: paginated(seminars, { page, limit, total }),
      statusCode: 200,
      headers: {
        'Cache-Control': cacheControl,
      },
    };
  } catch (e) {
    console.error('Error fetching seminars:', e);
    return {
      response: error('INTERNAL_ERROR', 'Erreur lors de la récupération des séminaires'),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Get a single seminar by slug
 */
export async function handleGetSeminarBySlug(
  slug: string,
  config: SeminarsHandlerConfig
): Promise<SeminarHandlerResult<Seminar>> {
  const { getSeminarBySlug, siteId } = config;

  try {
    const seminar = await getSeminarBySlug(slug, siteId);

    if (!seminar) {
      return {
        response: error('NOT_FOUND', 'Séminaire non trouvé'),
        statusCode: 404,
        headers: {},
      };
    }

    const cacheControl =
      seminar.status === 'published'
        ? 'public, max-age=300, stale-while-revalidate=3600'
        : 'private, no-cache';

    return {
      response: success(seminar),
      statusCode: 200,
      headers: {
        'Cache-Control': cacheControl,
      },
    };
  } catch (e) {
    console.error('Error fetching seminar:', e);
    return {
      response: error('INTERNAL_ERROR', 'Erreur lors de la récupération du séminaire'),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Create a new seminar (requires admin)
 */
export async function handleCreateSeminar(
  request: ApiRequest,
  config: SeminarsHandlerConfig,
  _authContext?: AuthContext
): Promise<SeminarHandlerResult<Seminar>> {
  const { createSeminar, slugExists, siteId, onCacheRevalidate } = config;

  const bodyResult = await withBodyValidation(request, seminarSchema);

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

  // Check if slug already exists
  const exists = await slugExists(data.slug, undefined, siteId);
  if (exists) {
    return {
      response: error('CONFLICT', 'Un séminaire avec ce slug existe déjà'),
      statusCode: 409,
      headers: {},
    };
  }

  try {
    const seminarData = siteId ? { ...data, siteId } : data;
    const seminar = await createSeminar(seminarData);

    if (onCacheRevalidate) {
      await onCacheRevalidate(['/api/seminars', `/seminars/${seminar.slug}`]);
    }

    return {
      response: success(seminar),
      statusCode: 201,
      headers: {},
    };
  } catch (e) {
    console.error('Error creating seminar:', e);
    return {
      response: error('INTERNAL_ERROR', 'Erreur lors de la création du séminaire'),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Update a seminar (requires admin)
 */
export async function handleUpdateSeminar(
  id: string,
  request: ApiRequest,
  config: SeminarsHandlerConfig,
  _authContext?: AuthContext
): Promise<SeminarHandlerResult<Seminar>> {
  const { getSeminarById, updateSeminar, onCacheRevalidate } = config;

  const bodyResult = await withBodyValidation(request, seminarUpdateSchema);

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

  const existing = await getSeminarById(id);
  if (!existing) {
    return {
      response: error('NOT_FOUND', 'Séminaire non trouvé'),
      statusCode: 404,
      headers: {},
    };
  }

  try {
    const seminar = await updateSeminar(id, data);

    if (onCacheRevalidate) {
      await onCacheRevalidate([
        '/api/seminars',
        `/seminars/${existing.slug}`,
        `/seminars/${seminar.slug}`,
      ]);
    }

    return {
      response: success(seminar),
      statusCode: 200,
      headers: {},
    };
  } catch (e) {
    console.error('Error updating seminar:', e);
    return {
      response: error('INTERNAL_ERROR', 'Erreur lors de la mise à jour du séminaire'),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Delete a seminar (requires admin)
 */
export async function handleDeleteSeminar(
  id: string,
  config: SeminarsHandlerConfig,
  _authContext?: AuthContext
): Promise<SeminarHandlerResult<{ deleted: boolean }>> {
  const { getSeminarById, deleteSeminar, onCacheRevalidate } = config;

  const existing = await getSeminarById(id);
  if (!existing) {
    return {
      response: error('NOT_FOUND', 'Séminaire non trouvé'),
      statusCode: 404,
      headers: {},
    };
  }

  try {
    await deleteSeminar(id);

    if (onCacheRevalidate) {
      await onCacheRevalidate(['/api/seminars', `/seminars/${existing.slug}`]);
    }

    return {
      response: success({ deleted: true }),
      statusCode: 200,
      headers: {},
    };
  } catch (e) {
    console.error('Error deleting seminar:', e);
    return {
      response: error('INTERNAL_ERROR', 'Erreur lors de la suppression du séminaire'),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Register for a seminar
 */
export async function handleRegister(
  request: ApiRequest,
  config: SeminarsHandlerConfig
): Promise<SeminarHandlerResult<Registration>> {
  const { getSeminarById, createRegistration, sendRegistrationConfirmation } = config;

  if (!createRegistration) {
    return {
      response: error('NOT_IMPLEMENTED', 'Inscriptions non disponibles'),
      statusCode: 501,
      headers: {},
    };
  }

  const bodyResult = await withBodyValidation(request, registrationSchema);

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

  // Check seminar exists and is open
  const seminar = await getSeminarById(data.seminarId);
  if (!seminar) {
    return {
      response: error('NOT_FOUND', 'Séminaire non trouvé'),
      statusCode: 404,
      headers: {},
    };
  }

  if (seminar.status !== 'published') {
    return {
      response: error('VALIDATION_ERROR', "Ce séminaire n'accepte plus d'inscriptions"),
      statusCode: 400,
      headers: {},
    };
  }

  // Check capacity
  if (seminar.maxParticipants && seminar.currentParticipants !== undefined) {
    if (seminar.currentParticipants >= seminar.maxParticipants) {
      return {
        response: error('CONFLICT', 'Ce séminaire est complet'),
        statusCode: 409,
        headers: {},
      };
    }
  }

  try {
    const registration = await createRegistration(data);

    // Send confirmation email
    if (sendRegistrationConfirmation) {
      try {
        await sendRegistrationConfirmation(registration, seminar);
      } catch (e) {
        console.error('Failed to send registration confirmation:', e);
      }
    }

    return {
      response: success(registration),
      statusCode: 201,
      headers: {},
    };
  } catch (e) {
    console.error('Error creating registration:', e);
    return {
      response: error('INTERNAL_ERROR', "Erreur lors de l'inscription"),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Create seminars handlers with preset configuration
 */
export function createSeminarsHandlers(config: SeminarsHandlerConfig) {
  return {
    getAll: (request: ApiRequest) => handleGetSeminars(request, config),
    getBySlug: (slug: string) => handleGetSeminarBySlug(slug, config),
    create: (request: ApiRequest, authContext?: AuthContext) =>
      handleCreateSeminar(request, config, authContext),
    update: (id: string, request: ApiRequest, authContext?: AuthContext) =>
      handleUpdateSeminar(id, request, config, authContext),
    delete: (id: string, authContext?: AuthContext) => handleDeleteSeminar(id, config, authContext),
    register: (request: ApiRequest) => handleRegister(request, config),
  };
}
