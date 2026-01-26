/**
 * Testimonials Store - PostgreSQL via Prisma
 *
 * This store manages testimonials using the Kairn Prisma schema with multi-tenancy support.
 *
 * Note: The API uses `quote` and `author` fields for backwards compatibility,
 * but the database schema uses `content` and `clientName`.
 */

import { z } from "zod";
import prisma from "@/lib/db/prisma";

// Site slug for Psypnos (used for multi-tenancy)
const SITE_SLUG = "psypnos";

// ============================================
// Validation Schemas
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
// Site Helper
// ============================================

/**
 * Get or create the Psypnos site for multi-tenancy
 */
async function getSiteId(): Promise<string> {
  let site = await prisma.site.findUnique({
    where: { slug: SITE_SLUG },
    select: { id: true },
  });

  if (!site) {
    // Create the site if it doesn't exist
    site = await prisma.site.create({
      data: {
        slug: SITE_SLUG,
        name: "Psypnos",
        domain: "psypnos.fr",
        isActive: true,
      },
      select: { id: true },
    });
  }

  return site.id;
}

// ============================================
// Database Operations
// ============================================

/**
 * Get all testimonials from database (approved only for public)
 */
export async function getAllTestimonials(
  limit?: number
): Promise<TestimonialOutput[]> {
  const siteId = await getSiteId();

  const testimonials = await prisma.testimonial.findMany({
    where: {
      siteId,
      isApproved: true,
    },
    orderBy: [
      { order: "asc" },
      { createdAt: "desc" },
    ],
    take: limit,
  });

  return testimonials.map(formatTestimonialOutput);
}

/**
 * Get all testimonials (including unapproved) for admin
 */
export async function getAllTestimonialsAdmin(
  limit?: number
): Promise<TestimonialOutput[]> {
  const siteId = await getSiteId();

  const testimonials = await prisma.testimonial.findMany({
    where: { siteId },
    orderBy: [
      { order: "asc" },
      { createdAt: "desc" },
    ],
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
  const siteId = await getSiteId();

  const testimonial = await prisma.testimonial.findFirst({
    where: { id, siteId },
  });

  return testimonial ? formatTestimonialOutput(testimonial) : null;
}

/**
 * Create a new testimonial
 */
export async function createTestimonial(
  data: TestimonialPayload
): Promise<TestimonialOutput> {
  const siteId = await getSiteId();
  const normalized = normalizeTestimonialInput(data);

  const testimonial = await prisma.testimonial.create({
    data: {
      siteId,
      clientName: normalized.author,
      content: normalized.quote,
      // Store role in clientInitials field as a workaround
      clientInitials: normalized.role || null,
      isApproved: true,
      order: 0,
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
  const siteId = await getSiteId();
  const normalized = normalizeTestimonialInput(data);

  // First check if testimonial exists for this site
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
      content: normalized.quote,
      clientInitials: normalized.role || null,
    },
  });

  return formatTestimonialOutput(testimonial);
}

/**
 * Delete a testimonial
 */
export async function deleteTestimonial(id: string): Promise<boolean> {
  const siteId = await getSiteId();

  // First check if testimonial exists for this site
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
 * Maps database fields to API fields for backwards compatibility
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
    ...(testimonial.clientInitials && { role: testimonial.clientInitials }),
    createdAt: testimonial.createdAt.toISOString(),
    updatedAt: testimonial.updatedAt.toISOString(),
  };
}
