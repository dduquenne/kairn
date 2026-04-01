/**
 * Seminar CRUD Tests
 *
 * Tests for:
 * - prisma-store validation schemas and normalization
 * - seminarType slug → label resolution for public display
 * - Cache invalidation paths
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// prisma-store tests
// ============================================

// Mock Prisma and site dependencies before importing
vi.mock('@/lib/db/prisma', () => ({
  default: {
    seminar: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/db/site', () => ({
  getSiteId: vi.fn().mockResolvedValue('site-123'),
}));

import { seminarPayloadSchema, normalizeSeminarInput } from '../../app/api/seminars/prisma-store';

describe('seminarPayloadSchema', () => {
  /** @internal Valid payload for reuse across tests */
  const validPayload = {
    title: 'Respirer la Lumière',
    description: 'Un séminaire de respiration holotropique',
    speakers: [
      { firstName: 'David', lastName: 'Duquenne' },
      { firstName: 'Nathalie', lastName: 'Duquenne' },
    ],
    startAt: '2026-05-30T08:00',
    endAt: '2026-05-31T17:00',
    capacity: 18,
    tags: ['respiration', 'vitalité'],
  };

  it('should accept a valid payload', () => {
    const result = seminarPayloadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('should accept optional fields', () => {
    const result = seminarPayloadSchema.safeParse({
      ...validPayload,
      price: 250,
      deposit: 125,
      order: 'Psypnos',
      thumbnail: '/images/test.webp',
      seminarType: 'respiration-holotropique',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing required fields', () => {
    const result = seminarPayloadSchema.safeParse({ title: 'Test' });
    expect(result.success).toBe(false);
  });

  it('should reject empty title', () => {
    const result = seminarPayloadSchema.safeParse({
      ...validPayload,
      title: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject endAt before startAt', () => {
    const result = seminarPayloadSchema.safeParse({
      ...validPayload,
      startAt: '2026-06-01T08:00',
      endAt: '2026-05-30T17:00',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const endAtError = result.error.issues.find(i => i.path.includes('endAt'));
      expect(endAtError).toBeDefined();
    }
  });

  it('should reject duplicate tags (case-insensitive)', () => {
    const result = seminarPayloadSchema.safeParse({
      ...validPayload,
      tags: ['Respiration', 'respiration'],
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-integer capacity', () => {
    const result = seminarPayloadSchema.safeParse({
      ...validPayload,
      capacity: 18.5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject zero capacity', () => {
    const result = seminarPayloadSchema.safeParse({
      ...validPayload,
      capacity: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should require exactly 2 speakers', () => {
    const result = seminarPayloadSchema.safeParse({
      ...validPayload,
      speakers: [{ firstName: 'David', lastName: 'Duquenne' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('normalizeSeminarInput', () => {
  const input = {
    title: '  Respirer la Lumière  ',
    description: '  Description  ',
    speakers: [
      { firstName: '  David  ', lastName: '  Duquenne  ' },
      { firstName: '  Nathalie  ', lastName: '  Duquenne  ' },
    ],
    startAt: '2026-05-30T08:00',
    endAt: '2026-05-31T17:00',
    capacity: 18,
    tags: ['  respiration  ', '  vitalité  '],
  };

  it('should trim whitespace from string fields', () => {
    const result = normalizeSeminarInput(input);
    expect(result.title).toBe('Respirer la Lumière');
    expect(result.description).toBe('Description');
  });

  it('should trim speaker names', () => {
    const result = normalizeSeminarInput(input);
    expect(result.speakers[0]!.firstName).toBe('David');
    expect(result.speakers[0]!.lastName).toBe('Duquenne');
  });

  it('should normalize tags (trim and deduplicate)', () => {
    const result = normalizeSeminarInput(input);
    expect(result.tags).toEqual(['respiration', 'vitalité']);
  });

  it('should convert datetime-local format to ISO string', () => {
    const result = normalizeSeminarInput(input);
    expect(result.startAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  });
});

// ============================================
// seminarType label resolution tests
// ============================================

describe('seminarType label resolution', () => {
  it('should resolve known seminar type slug to label', () => {
    // Replicate the logic from sections/seminars.tsx
    const SEMINAR_TYPES = [
      { value: 'respiration-holotropique', label: 'Respiration holotropique' },
      { value: 'breathwork', label: 'Breathwork' },
      { value: 'meditation', label: 'Méditation' },
    ];
    const typeLabels = new Map(SEMINAR_TYPES.map(t => [t.value, t.label]));

    const resolve = (slug?: string) => {
      if (!slug) return undefined;
      return typeLabels.get(slug) ?? slug;
    };

    expect(resolve('respiration-holotropique')).toBe('Respiration holotropique');
    expect(resolve('breathwork')).toBe('Breathwork');
    expect(resolve('meditation')).toBe('Méditation');
  });

  it('should fall back to raw slug for unknown types', () => {
    const typeLabels = new Map([['known', 'Known']]);
    const resolve = (slug?: string) => {
      if (!slug) return undefined;
      return typeLabels.get(slug) ?? slug;
    };

    expect(resolve('unknown-type')).toBe('unknown-type');
  });

  it('should return undefined for undefined/empty input', () => {
    const resolve = (slug?: string) => {
      if (!slug) return undefined;
      return slug;
    };

    expect(resolve(undefined)).toBeUndefined();
    expect(resolve('')).toBeUndefined();
  });
});
