/* eslint-disable no-console */
/**
 * Testimonials Store - Multi-tenant Prisma Models
 *
 * This module provides testimonial access using the Kairn multi-tenant database schema.
 * All queries filter by siteId to ensure tenant isolation.
 */

import { z } from 'zod';

import prisma from '@/lib/db/prisma';
import { getSiteId } from '@/lib/db/site';

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
// Database Operations (using multi-tenant Prisma models)
// ============================================

/**
 * Get all approved testimonials from database.
 * Throws on error so callers can handle failures explicitly.
 */
export async function getAllTestimonials(limit?: number): Promise<TestimonialOutput[]> {
  const siteId = await getSiteId();
  const testimonials = await prisma.testimonial.findMany({
    where: {
      siteId,
      isApproved: true,
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    ...(limit ? { take: limit } : {}),
  });

  return testimonials.map(formatTestimonialOutput);
}

/**
 * Get all testimonials for admin (including unapproved)
 */
export async function getAllTestimonialsAdmin(limit?: number): Promise<TestimonialOutput[]> {
  try {
    const siteId = await getSiteId();
    const testimonials = await prisma.testimonial.findMany({
      where: { siteId },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      ...(limit ? { take: limit } : {}),
    });

    return testimonials.map(formatTestimonialOutput);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}

/**
 * Get testimonial by ID
 */
export async function getTestimonialById(id: string): Promise<TestimonialOutput | null> {
  try {
    const siteId = await getSiteId();
    const testimonial = await prisma.testimonial.findFirst({
      where: { id, siteId },
    });

    return testimonial ? formatTestimonialOutput(testimonial) : null;
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
  const siteId = await getSiteId();

  try {
    const testimonial = await prisma.testimonial.create({
      data: {
        siteId,
        clientName: normalized.author,
        clientInitials: getInitials(normalized.author),
        content: normalized.quote,
        isApproved: false, // New testimonials need approval
        order: 0,
      },
    });

    return formatTestimonialOutput(testimonial);
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
  const siteId = await getSiteId();

  try {
    // First check if testimonial exists
    const existing = await prisma.testimonial.findFirst({
      where: { id, siteId },
    });
    if (!existing) {
      return null;
    }

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: {
        clientName: normalized.author,
        clientInitials: getInitials(normalized.author),
        content: normalized.quote,
      },
    });

    return formatTestimonialOutput(testimonial);
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
    const siteId = await getSiteId();

    // First check if testimonial exists
    const existing = await prisma.testimonial.findFirst({
      where: { id, siteId },
    });
    if (!existing) {
      return false;
    }

    await prisma.testimonial.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return false;
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get initials from a name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

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
 * Maps multi-tenant schema fields to the expected output format
 */
function formatTestimonialOutput(testimonial: {
  id: string;
  clientName: string;
  clientInitials: string | null;
  content: string;
  rating: number | null;
  isApproved: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}): TestimonialOutput {
  return {
    id: testimonial.id,
    quote: testimonial.content,
    author: testimonial.clientName,
    // Note: The multi-tenant schema doesn't have a 'role' field
    // We could add it as metadata if needed
    createdAt: testimonial.createdAt.toISOString(),
    updatedAt: testimonial.updatedAt.toISOString(),
  };
}
