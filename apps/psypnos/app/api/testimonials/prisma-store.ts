// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * Testimonials Store - PostgreSQL via Prisma
 * Replaces the JSON file-based store for robust data management
 */

import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/db/prisma";

// ============================================
// Validation Schemas (unchanged from original)
// ============================================

const optionalRoleSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  },
  z
    .string()
    .max(120, "La fonction doit contenir au maximum 120 caractères")
    .optional()
);

export const testimonialPayloadSchema = z.object({
  quote: z
    .string()
    .trim()
    .min(1, "Le témoignage est obligatoire")
    .max(800, "Le témoignage est trop long"),
  author: z
    .string()
    .trim()
    .min(1, "Le nom est obligatoire")
    .max(120, "Le nom est trop long"),
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
// Database Operations
// ============================================

/**
 * Get all testimonials from database
 */
export async function getAllTestimonials(
  limit?: number
): Promise<TestimonialOutput[]> {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return testimonials.map(formatTestimonialOutput);
}

/**
 * Get testimonial by ID
 */
export async function getTestimonialById(
  id: string
): Promise<TestimonialOutput | null> {
  const testimonial = await prisma.testimonial.findUnique({
    where: { id },
  });

  return testimonial ? formatTestimonialOutput(testimonial) : null;
}

/**
 * Create a new testimonial
 */
export async function createTestimonial(
  data: TestimonialPayload
): Promise<TestimonialOutput> {
  const normalized = normalizeTestimonialInput(data);

  const testimonial = await prisma.testimonial.create({
    data: {
      quote: normalized.quote,
      author: normalized.author,
      role: normalized.role || null,
    },
  });

  return formatTestimonialOutput(testimonial);
}

/**
 * Update an existing testimonial
 */
export async function updateTestimonial(
  id: string,
  data: TestimonialPayload
): Promise<TestimonialOutput | null> {
  const normalized = normalizeTestimonialInput(data);

  try {
    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: {
        quote: normalized.quote,
        author: normalized.author,
        role: normalized.role || null,
      },
    });

    return formatTestimonialOutput(testimonial);
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return null; // Record not found
    }
    throw error;
  }
}

/**
 * Delete a testimonial
 */
export async function deleteTestimonial(id: string): Promise<boolean> {
  try {
    await prisma.testimonial.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return false; // Record not found
    }
    throw error;
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Normalize input data
 */
export function normalizeTestimonialInput(
  data: TestimonialPayload
): TestimonialAttributes {
  const role = typeof data.role === "string" ? data.role : undefined;
  return {
    quote: data.quote.trim(),
    author: data.author.trim(),
    ...(role ? { role: role.trim() } : {}),
  };
}

/**
 * Format database record to API output
 */
function formatTestimonialOutput(testimonial: {
  id: string;
  quote: string;
  author: string;
  role: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TestimonialOutput {
  return {
    id: testimonial.id,
    quote: testimonial.quote,
    author: testimonial.author,
    ...(testimonial.role && { role: testimonial.role }),
    createdAt: testimonial.createdAt.toISOString(),
    updatedAt: testimonial.updatedAt.toISOString(),
  };
}
