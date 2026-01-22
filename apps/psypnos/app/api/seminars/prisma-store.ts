// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * Seminars Store - PostgreSQL via Prisma
 * Replaces the JSON file-based store for robust data management
 */

import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import prisma from "@/lib/db/prisma";

export { SEMINAR_TYPES, type SeminarType } from "./types";

// ============================================
// Validation Schemas (unchanged from original)
// ============================================

const speakerSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est obligatoire"),
  lastName: z.string().trim().min(1, "Le nom est obligatoire"),
});

export const seminarPayloadSchema = z
  .object({
    title: z.string().trim().min(1, "Le titre est obligatoire"),
    description: z.string().trim().min(1, "La description est obligatoire"),
    speakers: z
      .array(speakerSchema)
      .length(2, "Deux intervenants sont requis"),
    startAt: z.string().min(1, "La date de début est obligatoire"),
    endAt: z.string().min(1, "La date de fin est obligatoire"),
    capacity: z
      .number({ invalid_type_error: "La capacité doit être un nombre" })
      .int("La capacité doit être un nombre entier")
      .min(1, "Au moins 1 place"),
    price: z
      .number({ invalid_type_error: "Le prix doit être un nombre" })
      .positive("Le prix doit être positif")
      .optional(),
    deposit: z
      .number({ invalid_type_error: "L'acompte doit être un nombre" })
      .positive("L'acompte doit être positif")
      .optional(),
    order: z.string().trim().optional(),
    tags: z
      .array(z.string().trim().min(1, "Chaque mot-clé doit contenir au moins un caractère"))
      .min(1, "Au moins un mot-clé"),
    thumbnail: z.string().trim().optional(),
    seminarType: z.string().trim().optional(),
  })
  .refine(
    (data) => new Date(data.startAt).getTime() <= new Date(data.endAt).getTime(),
    {
      message: "La date de fin doit être postérieure à la date de début",
      path: ["endAt"],
    },
  )
  .refine(
    (data) => new Set(data.tags.map((tag) => tag.toLowerCase())).size === data.tags.length,
    {
      message: "Chaque mot-clé doit être unique",
      path: ["tags"],
    },
  );

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
// Database Operations
// ============================================

/**
 * Get all seminars from database
 */
export async function getAllSeminars(): Promise<SeminarOutput[]> {
  const seminars = await prisma.seminar.findMany({
    orderBy: { startAt: "asc" },
  });

  return seminars.map(formatSeminarOutput);
}

/**
 * Get upcoming seminars (startAt >= now)
 */
export async function getUpcomingSeminars(limit?: number): Promise<SeminarOutput[]> {
  const now = new Date();

  const seminars = await prisma.seminar.findMany({
    where: {
      startAt: { gte: now },
    },
    orderBy: { startAt: "asc" },
    take: limit,
  });

  return seminars.map(formatSeminarOutput);
}

/**
 * Get seminar by ID
 */
export async function getSeminarById(id: string): Promise<SeminarOutput | null> {
  const seminar = await prisma.seminar.findUnique({
    where: { id },
  });

  return seminar ? formatSeminarOutput(seminar) : null;
}

/**
 * Create a new seminar
 */
export async function createSeminar(data: SeminarPayload): Promise<SeminarOutput> {
  const normalized = normalizeSeminarInput(data);

  const seminar = await prisma.seminar.create({
    data: {
      title: normalized.title,
      description: normalized.description,
      speakers: normalized.speakers,
      startAt: new Date(normalized.startAt),
      endAt: new Date(normalized.endAt),
      capacity: normalized.capacity,
      price: normalized.price ? new Decimal(normalized.price) : null,
      deposit: normalized.deposit ? new Decimal(normalized.deposit) : null,
      displayOrder: normalized.order || null,
      tags: normalized.tags,
      thumbnail: normalized.thumbnail || null,
      seminarType: normalized.seminarType || null,
    },
  });

  return formatSeminarOutput(seminar);
}

/**
 * Update an existing seminar
 */
export async function updateSeminar(
  id: string,
  data: SeminarPayload
): Promise<SeminarOutput | null> {
  const normalized = normalizeSeminarInput(data);

  try {
    const seminar = await prisma.seminar.update({
      where: { id },
      data: {
        title: normalized.title,
        description: normalized.description,
        speakers: normalized.speakers,
        startAt: new Date(normalized.startAt),
        endAt: new Date(normalized.endAt),
        capacity: normalized.capacity,
        price: normalized.price ? new Decimal(normalized.price) : null,
        deposit: normalized.deposit ? new Decimal(normalized.deposit) : null,
        displayOrder: normalized.order || null,
        tags: normalized.tags,
        thumbnail: normalized.thumbnail || null,
        seminarType: normalized.seminarType || null,
      },
    });

    return formatSeminarOutput(seminar);
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return null; // Record not found
    }
    throw error;
  }
}

/**
 * Delete a seminar
 */
export async function deleteSeminar(id: string): Promise<boolean> {
  try {
    await prisma.seminar.delete({
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
export function normalizeSeminarInput(data: SeminarPayload): SeminarAttributes {
  return {
    title: data.title.trim(),
    description: data.description.trim(),
    speakers: data.speakers.map((speaker) => ({
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
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{3}))?$/.exec(
      value
    );

  if (datetimeLocalMatch) {
    const [, year, month, day, hours, minutes, seconds = "0", milliseconds = "0"] =
      datetimeLocalMatch;
    const date = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      parseInt(hours, 10),
      parseInt(minutes, 10),
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
 * Format database record to API output
 */
function formatSeminarOutput(seminar: {
  id: string;
  title: string;
  description: string;
  speakers: unknown;
  startAt: Date;
  endAt: Date;
  capacity: number;
  price: Decimal | null;
  deposit: Decimal | null;
  displayOrder: string | null;
  tags: string[];
  thumbnail: string | null;
  seminarType: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SeminarOutput {
  return {
    id: seminar.id,
    title: seminar.title,
    description: seminar.description,
    speakers: seminar.speakers as Array<{ firstName: string; lastName: string }>,
    startAt: seminar.startAt.toISOString(),
    endAt: seminar.endAt.toISOString(),
    capacity: seminar.capacity,
    ...(seminar.price && { price: seminar.price.toNumber() }),
    ...(seminar.deposit && { deposit: seminar.deposit.toNumber() }),
    ...(seminar.displayOrder && { order: seminar.displayOrder }),
    tags: seminar.tags,
    ...(seminar.thumbnail && { thumbnail: seminar.thumbnail }),
    ...(seminar.seminarType && { seminarType: seminar.seminarType }),
    createdAt: seminar.createdAt.toISOString(),
    updatedAt: seminar.updatedAt.toISOString(),
  };
}
