/* eslint-disable no-console */
/**
 * Seminars Store - PostgreSQL via Raw SQL
 *
 * IMPORTANT: The psypnos database uses a single-tenant schema with simple table names:
 * - seminars (not Seminar with siteId)
 *
 * We use raw SQL queries to match the actual database structure.
 */

import { z } from 'zod';

import prisma from '@/lib/db/prisma';

export { SEMINAR_TYPES, type SeminarType } from './types';

// ============================================
// Raw Database Types (matching actual psypnos schema)
// ============================================

interface RawSeminar {
  id: string;
  title: string;
  description: string;
  speakers: unknown; // JSONB
  start_at: Date;
  end_at: Date;
  capacity: number;
  price: { toNumber?: () => number } | number | null;
  deposit: { toNumber?: () => number } | number | null;
  display_order: string | null;
  tags: string[] | null;
  thumbnail: string | null;
  seminar_type: string | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// Validation Schemas
// ============================================

const speakerSchema = z.object({
  firstName: z.string().trim().min(1, 'Le prénom est obligatoire'),
  lastName: z.string().trim().min(1, 'Le nom est obligatoire'),
});

export const seminarPayloadSchema = z
  .object({
    title: z.string().trim().min(1, 'Le titre est obligatoire'),
    description: z.string().trim().min(1, 'La description est obligatoire'),
    speakers: z.array(speakerSchema).length(2, 'Deux intervenants sont requis'),
    startAt: z.string().min(1, 'La date de début est obligatoire'),
    endAt: z.string().min(1, 'La date de fin est obligatoire'),
    capacity: z
      .number({ invalid_type_error: 'La capacité doit être un nombre' })
      .int('La capacité doit être un nombre entier')
      .min(1, 'Au moins 1 place'),
    price: z
      .number({ invalid_type_error: 'Le prix doit être un nombre' })
      .positive('Le prix doit être positif')
      .optional(),
    deposit: z
      .number({ invalid_type_error: "L'acompte doit être un nombre" })
      .positive("L'acompte doit être positif")
      .optional(),
    order: z.string().trim().optional(),
    tags: z
      .array(z.string().trim().min(1, 'Chaque mot-clé doit contenir au moins un caractère'))
      .min(1, 'Au moins un mot-clé'),
    thumbnail: z.string().trim().optional(),
    seminarType: z.string().trim().optional(),
  })
  .refine(data => new Date(data.startAt).getTime() <= new Date(data.endAt).getTime(), {
    message: 'La date de fin doit être postérieure à la date de début',
    path: ['endAt'],
  })
  .refine(data => new Set(data.tags.map(tag => tag.toLowerCase())).size === data.tags.length, {
    message: 'Chaque mot-clé doit être unique',
    path: ['tags'],
  });

export type SeminarAttributes = z.infer<typeof seminarPayloadSchema>;
export type SeminarPayload = SeminarAttributes;

// ============================================
// Output Type (API response format)
// ============================================

export interface SeminarOutput {
  id: string;
  title: string;
  description: string;
  speakers: Array<{ firstName: string; lastName: string }>;
  startAt: string;
  endAt: string;
  capacity: number;
  price?: number;
  deposit?: number;
  order?: string;
  tags: string[];
  thumbnail?: string;
  seminarType?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Database Operations (using raw SQL for single-tenant psypnos schema)
// ============================================

/**
 * Get all seminars from database
 */
export async function getAllSeminars(): Promise<SeminarOutput[]> {
  try {
    const seminars = await prisma.$queryRaw<RawSeminar[]>`
      SELECT id, title, description, speakers, start_at, end_at, capacity, price, deposit, display_order, tags, thumbnail, seminar_type, created_at, updated_at
      FROM seminars
      ORDER BY start_at ASC
    `;

    return seminars.map(formatSeminarOutput);
  } catch (error) {
    console.error('Error fetching seminars:', error);
    return [];
  }
}

/**
 * Get upcoming seminars (startAt >= now)
 */
export async function getUpcomingSeminars(limit?: number): Promise<SeminarOutput[]> {
  try {
    const now = new Date();

    let seminars: RawSeminar[];
    if (limit) {
      seminars = await prisma.$queryRaw<RawSeminar[]>`
        SELECT id, title, description, speakers, start_at, end_at, capacity, price, deposit, display_order, tags, thumbnail, seminar_type, created_at, updated_at
        FROM seminars
        WHERE start_at >= ${now}
        ORDER BY start_at ASC
        LIMIT ${limit}
      `;
    } else {
      seminars = await prisma.$queryRaw<RawSeminar[]>`
        SELECT id, title, description, speakers, start_at, end_at, capacity, price, deposit, display_order, tags, thumbnail, seminar_type, created_at, updated_at
        FROM seminars
        WHERE start_at >= ${now}
        ORDER BY start_at ASC
      `;
    }

    return seminars.map(formatSeminarOutput);
  } catch (error) {
    console.error('Error fetching upcoming seminars:', error);
    return [];
  }
}

/**
 * Get seminar by ID
 */
export async function getSeminarById(id: string): Promise<SeminarOutput | null> {
  try {
    const seminars = await prisma.$queryRaw<RawSeminar[]>`
      SELECT id, title, description, speakers, start_at, end_at, capacity, price, deposit, display_order, tags, thumbnail, seminar_type, created_at, updated_at
      FROM seminars
      WHERE id = ${id}
    `;

    return seminars.length > 0 ? formatSeminarOutput(seminars[0]!) : null;
  } catch (error) {
    console.error('Error fetching seminar by ID:', error);
    return null;
  }
}

/**
 * Create a new seminar
 */
export async function createSeminar(data: SeminarPayload): Promise<SeminarOutput> {
  const normalized = normalizeSeminarInput(data);
  const now = new Date();

  try {
    const result = await prisma.$queryRaw<RawSeminar[]>`
      INSERT INTO seminars (title, description, speakers, start_at, end_at, capacity, price, deposit, display_order, tags, thumbnail, seminar_type, created_at, updated_at)
      VALUES (
        ${normalized.title},
        ${normalized.description},
        ${JSON.stringify(normalized.speakers)}::jsonb,
        ${new Date(normalized.startAt)},
        ${new Date(normalized.endAt)},
        ${normalized.capacity},
        ${normalized.price ?? null},
        ${normalized.deposit ?? null},
        ${normalized.order ?? null},
        ${normalized.tags}::text[],
        ${normalized.thumbnail ?? null},
        ${normalized.seminarType ?? null},
        ${now},
        ${now}
      )
      RETURNING id, title, description, speakers, start_at, end_at, capacity, price, deposit, display_order, tags, thumbnail, seminar_type, created_at, updated_at
    `;

    return formatSeminarOutput(result[0]!);
  } catch (error) {
    console.error('Error creating seminar:', error);
    throw error;
  }
}

/**
 * Update an existing seminar
 */
export async function updateSeminar(
  id: string,
  data: SeminarPayload
): Promise<SeminarOutput | null> {
  const normalized = normalizeSeminarInput(data);
  const now = new Date();

  try {
    // First check if seminar exists
    const existing = await getSeminarById(id);
    if (!existing) {
      return null;
    }

    const result = await prisma.$queryRaw<RawSeminar[]>`
      UPDATE seminars
      SET
        title = ${normalized.title},
        description = ${normalized.description},
        speakers = ${JSON.stringify(normalized.speakers)}::jsonb,
        start_at = ${new Date(normalized.startAt)},
        end_at = ${new Date(normalized.endAt)},
        capacity = ${normalized.capacity},
        price = ${normalized.price ?? null},
        deposit = ${normalized.deposit ?? null},
        display_order = ${normalized.order ?? null},
        tags = ${normalized.tags}::text[],
        thumbnail = ${normalized.thumbnail ?? null},
        seminar_type = ${normalized.seminarType ?? null},
        updated_at = ${now}
      WHERE id = ${id}
      RETURNING id, title, description, speakers, start_at, end_at, capacity, price, deposit, display_order, tags, thumbnail, seminar_type, created_at, updated_at
    `;

    return formatSeminarOutput(result[0]!);
  } catch (error) {
    console.error('Error updating seminar:', error);
    throw error;
  }
}

/**
 * Delete a seminar
 */
export async function deleteSeminar(id: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<Array<{ id: string }>>`
      DELETE FROM seminars WHERE id = ${id} RETURNING id
    `;
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting seminar:', error);
    return false;
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Normalize input data
 */
export function normalizeSeminarInput(data: SeminarPayload): SeminarAttributes {
  return {
    title: data.title.trim(),
    description: data.description.trim(),
    speakers: data.speakers.map(speaker => ({
      firstName: speaker.firstName.trim(),
      lastName: speaker.lastName.trim(),
    })),
    startAt: toIsoString(data.startAt),
    endAt: toIsoString(data.endAt),
    capacity: data.capacity,
    ...(data.price !== undefined && { price: data.price }),
    ...(data.deposit !== undefined && { deposit: data.deposit }),
    ...(data.order !== undefined && { order: data.order.trim() }),
    tags: normalizeTags(data.tags),
    ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail.trim() }),
    ...(data.seminarType !== undefined && { seminarType: data.seminarType.trim() }),
  } as SeminarAttributes;
}

function normalizeTags(tags: string[]): string[] {
  const unique = new Map<string, string>();
  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!unique.has(key)) {
      unique.set(key, trimmed);
    }
  }
  return Array.from(unique.values());
}

function toIsoString(value: string): string {
  // Handle datetime-local format (YYYY-MM-DDTHH:mm) as local time, not UTC
  const datetimeLocalMatch =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{3}))?$/.exec(value);

  if (datetimeLocalMatch) {
    const [, year, month, day, hours, minutes, seconds = '0', milliseconds = '0'] =
      datetimeLocalMatch;
    const date = new Date(
      parseInt(year!, 10),
      parseInt(month!, 10) - 1,
      parseInt(day!, 10),
      parseInt(hours!, 10),
      parseInt(minutes!, 10),
      parseInt(seconds, 10),
      parseInt(milliseconds, 10)
    );
    return date.toISOString();
  }

  // Fallback for already-ISO formatted dates
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Valeur de date invalide : ${value}`);
  }
  return date.toISOString();
}

/**
 * Get numeric value from Decimal or number
 */
function getNumericValue(val: { toNumber?: () => number } | number | null): number | undefined {
  if (val === null) return undefined;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val.toNumber) return val.toNumber();
  return undefined;
}

/**
 * Format database record to API output
 */
function formatSeminarOutput(seminar: RawSeminar): SeminarOutput {
  return {
    id: seminar.id,
    title: seminar.title,
    description: seminar.description,
    speakers: seminar.speakers as Array<{ firstName: string; lastName: string }>,
    startAt: seminar.start_at.toISOString(),
    endAt: seminar.end_at.toISOString(),
    capacity: seminar.capacity,
    ...(seminar.price !== null && { price: getNumericValue(seminar.price) }),
    ...(seminar.deposit !== null && { deposit: getNumericValue(seminar.deposit) }),
    ...(seminar.display_order && { order: seminar.display_order }),
    tags: seminar.tags || [],
    ...(seminar.thumbnail && { thumbnail: seminar.thumbnail }),
    ...(seminar.seminar_type && { seminarType: seminar.seminar_type }),
    createdAt: seminar.created_at.toISOString(),
    updatedAt: seminar.updated_at.toISOString(),
  };
}
