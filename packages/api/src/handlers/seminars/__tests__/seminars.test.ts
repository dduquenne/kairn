/**
 * Seminars Handler Tests
 *
 * Tests for seminar CRUD operations including:
 * - List seminars with pagination and filtering
 * - Get seminar by slug
 * - Create, update, delete seminars
 * - Registration with capacity checking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@kairn/core', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
    withScope: vi.fn(),
  }),
}));

vi.mock('@kairn/db', () => ({
  handlePrismaError: vi.fn().mockReturnValue(null),
}));

import {
  handleGetSeminars,
  handleGetSeminarBySlug,
  handleCreateSeminar,
  handleUpdateSeminar,
  handleDeleteSeminar,
  handleRegister,
  seminarSchema,
  registrationSchema,
  seminarsQuerySchema,
} from '../index';
import type { Seminar, SeminarsHandlerConfig, Registration } from '../index';

/**
 * Create a mock seminar
 */
function createMockSeminar(overrides: Partial<Seminar> = {}): Seminar {
  return {
    id: 'sem-123',
    title: 'Séminaire Test',
    slug: 'seminaire-test',
    description: 'Description du séminaire de test pour validation.',
    date: '2025-06-15T09:00:00Z',
    location: 'Paris',
    maxParticipants: 24,
    currentParticipants: 5,
    price: 250,
    currency: 'EUR',
    status: 'published',
    featured: false,
    tags: ['respiration', 'bien-être'],
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    ...overrides,
  };
}

/**
 * Create a mock registration
 */
function createMockRegistration(overrides: Partial<Registration> = {}): Registration {
  return {
    id: 'reg-123',
    seminarId: 'sem-123',
    firstName: 'Marie',
    lastName: 'Dupont',
    email: 'marie@example.com',
    status: 'pending',
    createdAt: '2025-02-01T10:00:00Z',
    ...overrides,
  };
}

/**
 * Create a mock request with URL and optional body
 */
function createMockRequest(url: string, body?: Record<string, unknown>): Request {
  return {
    url,
    method: body ? 'POST' : 'GET',
    json: body ? () => Promise.resolve(body) : undefined,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as unknown as Request;
}

/**
 * Create a mock handler config
 */
function createMockConfig(overrides: Partial<SeminarsHandlerConfig> = {}): SeminarsHandlerConfig {
  return {
    siteId: 'site-1',
    getAllSeminars: vi.fn().mockResolvedValue({ seminars: [], total: 0 }),
    getSeminarBySlug: vi.fn().mockResolvedValue(null),
    getSeminarById: vi.fn().mockResolvedValue(null),
    createSeminar: vi.fn().mockResolvedValue(createMockSeminar()),
    updateSeminar: vi.fn().mockResolvedValue(createMockSeminar()),
    deleteSeminar: vi.fn().mockResolvedValue(undefined),
    slugExists: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

describe('Seminars Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Zod Schemas', () => {
    describe('seminarSchema', () => {
      it('should validate a correct seminar input', () => {
        const input = {
          title: 'Mon séminaire',
          slug: 'mon-seminaire',
          description: 'Description détaillée du séminaire de test.',
          date: '2025-06-15T09:00:00Z',
          status: 'published',
        };
        const result = seminarSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('should reject empty title', () => {
        const input = {
          title: '',
          slug: 'mon-seminaire',
          description: 'Description détaillée du séminaire.',
          date: '2025-06-15T09:00:00Z',
        };
        const result = seminarSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('should reject invalid slug format', () => {
        const input = {
          title: 'Test',
          slug: 'INVALID SLUG!',
          description: 'Description du test avec au moins dix caractères.',
          date: '2025-06-15T09:00:00Z',
        };
        const result = seminarSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });

    describe('registrationSchema', () => {
      it('should validate a correct registration', () => {
        const input = {
          seminarId: 'sem-123',
          firstName: 'Marie',
          lastName: 'Dupont',
          email: 'marie@example.com',
        };
        const result = registrationSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('should reject missing email', () => {
        const input = {
          seminarId: 'sem-123',
          firstName: 'Marie',
          lastName: 'Dupont',
        };
        const result = registrationSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('should reject invalid email', () => {
        const input = {
          seminarId: 'sem-123',
          firstName: 'Marie',
          lastName: 'Dupont',
          email: 'not-an-email',
        };
        const result = registrationSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });

    describe('seminarsQuerySchema', () => {
      it('should parse default values', () => {
        const result = seminarsQuerySchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(20);
        }
      });

      it('should parse upcoming filter', () => {
        const result = seminarsQuerySchema.safeParse({ upcoming: 'true' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.upcoming).toBe(true);
        }
      });
    });
  });

  describe('handleGetSeminars', () => {
    it('should return paginated seminars', async () => {
      const seminars = [createMockSeminar(), createMockSeminar({ id: 'sem-456' })];
      const config = createMockConfig({
        getAllSeminars: vi.fn().mockResolvedValue({ seminars, total: 2 }),
      });
      const request = createMockRequest('http://localhost/api/seminars?page=1&limit=20');

      const result = await handleGetSeminars(request, config);

      expect(result.statusCode).toBe(200);
      expect(result.response).toHaveProperty('success', true);
    });

    it('should set public cache for published seminars', async () => {
      const config = createMockConfig({
        getAllSeminars: vi.fn().mockResolvedValue({ seminars: [], total: 0 }),
      });
      const request = createMockRequest('http://localhost/api/seminars?status=published');

      const result = await handleGetSeminars(request, config);

      expect(result.headers['Cache-Control']).toContain('public');
    });

    it('should handle fetch errors', async () => {
      const config = createMockConfig({
        getAllSeminars: vi.fn().mockRejectedValue(new Error('DB error')),
      });
      const request = createMockRequest('http://localhost/api/seminars');

      const result = await handleGetSeminars(request, config);

      expect(result.statusCode).toBe(500);
    });
  });

  describe('handleGetSeminarBySlug', () => {
    it('should return seminar when found', async () => {
      const seminar = createMockSeminar();
      const config = createMockConfig({
        getSeminarBySlug: vi.fn().mockResolvedValue(seminar),
      });

      const result = await handleGetSeminarBySlug('seminaire-test', config);

      expect(result.statusCode).toBe(200);
      expect(result.response).toHaveProperty('success', true);
    });

    it('should return 404 when not found', async () => {
      const config = createMockConfig({
        getSeminarBySlug: vi.fn().mockResolvedValue(null),
      });

      const result = await handleGetSeminarBySlug('nonexistent', config);

      expect(result.statusCode).toBe(404);
    });
  });

  describe('handleCreateSeminar', () => {
    it('should create a seminar with valid data', async () => {
      const seminar = createMockSeminar();
      const config = createMockConfig({
        createSeminar: vi.fn().mockResolvedValue(seminar),
      });
      const request = createMockRequest('http://localhost/api/seminars', {
        title: 'Nouveau séminaire',
        slug: 'nouveau-seminaire',
        description: 'Description complète du nouveau séminaire de test.',
        date: '2025-07-01T09:00:00Z',
        status: 'draft',
      });

      const result = await handleCreateSeminar(request, config);

      expect(result.statusCode).toBe(201);
    });

    it('should reject duplicate slug', async () => {
      const config = createMockConfig({
        slugExists: vi.fn().mockResolvedValue(true),
      });
      const request = createMockRequest('http://localhost/api/seminars', {
        title: 'Séminaire dupliqué',
        slug: 'seminaire-existant',
        description: 'Description du séminaire avec slug dupliqué pour test.',
        date: '2025-07-01T09:00:00Z',
      });

      const result = await handleCreateSeminar(request, config);

      expect(result.statusCode).toBe(409);
    });

    it('should reject invalid data', async () => {
      const config = createMockConfig();
      const request = createMockRequest('http://localhost/api/seminars', {
        title: '',
        description: '',
      });

      const result = await handleCreateSeminar(request, config);

      expect(result.statusCode).toBe(400);
    });
  });

  describe('handleDeleteSeminar', () => {
    it('should delete an existing seminar', async () => {
      const seminar = createMockSeminar();
      const config = createMockConfig({
        getSeminarById: vi.fn().mockResolvedValue(seminar),
      });

      const result = await handleDeleteSeminar('sem-123', config);

      expect(result.statusCode).toBe(200);
      expect(config.deleteSeminar).toHaveBeenCalledWith('sem-123');
    });

    it('should return 404 for non-existent seminar', async () => {
      const config = createMockConfig({
        getSeminarById: vi.fn().mockResolvedValue(null),
      });

      const result = await handleDeleteSeminar('nonexistent', config);

      expect(result.statusCode).toBe(404);
    });
  });

  describe('handleRegister', () => {
    it('should register when capacity is available', async () => {
      const seminar = createMockSeminar({
        maxParticipants: 24,
        currentParticipants: 5,
      });
      const registration = createMockRegistration();
      const config = createMockConfig({
        getSeminarById: vi.fn().mockResolvedValue(seminar),
        createRegistration: vi.fn().mockResolvedValue(registration),
      });
      const request = createMockRequest('http://localhost/api/registrations', {
        seminarId: 'sem-123',
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie@example.com',
      });

      const result = await handleRegister(request, config);

      expect(result.statusCode).toBe(201);
    });

    it('should reject when seminar is full', async () => {
      const seminar = createMockSeminar({
        maxParticipants: 24,
        currentParticipants: 24,
      });
      const config = createMockConfig({
        getSeminarById: vi.fn().mockResolvedValue(seminar),
        createRegistration: vi.fn(),
      });
      const request = createMockRequest('http://localhost/api/registrations', {
        seminarId: 'sem-123',
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie@example.com',
      });

      const result = await handleRegister(request, config);

      expect(result.statusCode).toBe(409);
    });

    it('should reject when seminar is not published', async () => {
      const seminar = createMockSeminar({ status: 'draft' });
      const config = createMockConfig({
        getSeminarById: vi.fn().mockResolvedValue(seminar),
        createRegistration: vi.fn(),
      });
      const request = createMockRequest('http://localhost/api/registrations', {
        seminarId: 'sem-123',
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie@example.com',
      });

      const result = await handleRegister(request, config);

      expect(result.statusCode).toBe(400);
    });

    it('should return 501 when registration not configured', async () => {
      const config = createMockConfig();
      const request = createMockRequest('http://localhost/api/registrations', {
        seminarId: 'sem-123',
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie@example.com',
      });

      const result = await handleRegister(request, config);

      expect(result.statusCode).toBe(501);
    });

    it('should return 404 when seminar not found', async () => {
      const config = createMockConfig({
        getSeminarById: vi.fn().mockResolvedValue(null),
        createRegistration: vi.fn(),
      });
      const request = createMockRequest('http://localhost/api/registrations', {
        seminarId: 'nonexistent',
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie@example.com',
      });

      const result = await handleRegister(request, config);

      expect(result.statusCode).toBe(404);
    });
  });
});
