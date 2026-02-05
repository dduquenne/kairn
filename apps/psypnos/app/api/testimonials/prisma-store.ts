/* eslint-disable no-console */
/**
 * Testimonials Store - PostgreSQL via Raw SQL
 *
 * IMPORTANT: The psypnos database uses a single-tenant schema with simple table names:
 * - testimonials (not Testimonial with siteId)
 *
 * The psypnos testimonials table has: id, quote, author, role, created_at, updated_at
 * (NOT clientName, clientInitials, content, isApproved, order, rating)
 *
 * We use raw SQL queries to match the actual database structure.
 */

import { z } from 'zod';

import prisma from '@/lib/db/prisma';

// ============================================
// Raw Database Types (matching actual psypnos schema)
// ============================================

interface RawTestimonial {
  id: string;
  quote: string;
  author: string;
  role: string | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// Validation Schemas
// ============================================

const optionalRoleSchema = z.preprocess(value => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().max(120, 'La fonction doit contenir au maximum 120 caractères').optional());

export const testimonialPayloadSchema = z.object({
  quote: z
    .string()
    .trim()
    .min(1, 'Le témoignage est obligatoire')
    .max(800, 'Le témoignage est trop long'),
  author: z.string().trim().min(1, 'Le nom est obligatoire').max(120, 'Le nom est trop long'),
  role: optionalRoleSchema,
});

export type TestimonialAttributes = z.infer<typeof testimonialPayloadSchema>;
export type TestimonialPayload = z.input<typeof testimonialPayloadSchema>;

// ============================================
// Output Type (API response format)
// ============================================

export interface TestimonialOutput {
  id: string;
  quote: string;
  author: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Database Operations (using raw SQL for single-tenant psypnos schema)
// ============================================

/**
 * Get all testimonials from database
 * Note: psypnos testimonials table doesn't have isApproved or order columns
 */
export async function getAllTestimonials(limit?: number): Promise<TestimonialOutput[]> {
  try {
    let testimonials: RawTestimonial[];
    if (limit) {
      testimonials = await prisma.$queryRaw<RawTestimonial[]>`
        SELECT id, quote, author, role, created_at, updated_at
        FROM testimonials
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } else {
      testimonials = await prisma.$queryRaw<RawTestimonial[]>`
        SELECT id, quote, author, role, created_at, updated_at
        FROM testimonials
        ORDER BY created_at DESC
      `;
    }

    return testimonials.map(formatTestimonialOutput);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}

/**
 * Get all testimonials for admin (same as getAllTestimonials since psypnos has no isApproved)
 */
export async function getAllTestimonialsAdmin(limit?: number): Promise<TestimonialOutput[]> {
  return getAllTestimonials(limit);
}

/**
 * Get testimonial by ID
 */
export async function getTestimonialById(id: string): Promise<TestimonialOutput | null> {
  try {
    const testimonials = await prisma.$queryRaw<RawTestimonial[]>`
      SELECT id, quote, author, role, created_at, updated_at
      FROM testimonials
      WHERE id = ${id}
    `;

    return testimonials.length > 0 ? formatTestimonialOutput(testimonials[0]!) : null;
  } catch (error) {
    console.error('Error fetching testimonial by ID:', error);
    return null;
  }
}

/**
 * Create a new testimonial
 */
export async function createTestimonial(data: TestimonialPayload): Promise<TestimonialOutput> {
  const normalized = normalizeTestimonialInput(data);
  const now = new Date();

  try {
    const result = await prisma.$queryRaw<RawTestimonial[]>`
      INSERT INTO testimonials (quote, author, role, created_at, updated_at)
      VALUES (
        ${normalized.quote},
        ${normalized.author},
        ${normalized.role ?? null},
        ${now},
        ${now}
      )
      RETURNING id, quote, author, role, created_at, updated_at
    `;

    return formatTestimonialOutput(result[0]!);
  } catch (error) {
    console.error('Error creating testimonial:', error);
    throw error;
  }
}

/**
 * Update an existing testimonial
 */
export async function updateTestimonial(
  id: string,
  data: TestimonialPayload
): Promise<TestimonialOutput | null> {
  const normalized = normalizeTestimonialInput(data);
  const now = new Date();

  try {
    // First check if testimonial exists
    const existing = await getTestimonialById(id);
    if (!existing) {
      return null;
    }

    const result = await prisma.$queryRaw<RawTestimonial[]>`
      UPDATE testimonials
      SET
        quote = ${normalized.quote},
        author = ${normalized.author},
        role = ${normalized.role ?? null},
        updated_at = ${now}
      WHERE id = ${id}
      RETURNING id, quote, author, role, created_at, updated_at
    `;

    return formatTestimonialOutput(result[0]!);
  } catch (error) {
    console.error('Error updating testimonial:', error);
    throw error;
  }
}

/**
 * Delete a testimonial
 */
export async function deleteTestimonial(id: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<Array<{ id: string }>>`
      DELETE FROM testimonials WHERE id = ${id} RETURNING id
    `;
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return false;
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Normalize input data
 */
export function normalizeTestimonialInput(data: TestimonialPayload): TestimonialAttributes {
  const role = typeof data.role === 'string' ? data.role : undefined;
  return {
    quote: data.quote.trim(),
    author: data.author.trim(),
    ...(role ? { role: role.trim() } : {}),
  };
}

/**
 * Format database record to API output
 */
function formatTestimonialOutput(testimonial: RawTestimonial): TestimonialOutput {
  return {
    id: testimonial.id,
    quote: testimonial.quote,
    author: testimonial.author,
    ...(testimonial.role && { role: testimonial.role }),
    createdAt: testimonial.created_at.toISOString(),
    updatedAt: testimonial.updated_at.toISOString(),
  };
}
