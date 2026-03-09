/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { promises as fs } from "fs";
import { dirname, join } from "path";

import { z } from "zod";

export { SEMINAR_TYPES, type SeminarType } from "./types";

const dataFilePath = join(process.cwd(), "data", "seminars.json");

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

const seminarStoreSchema = z.object({
  seminars: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      speakers: z
        .array(
          z.object({
            firstName: z.string(),
            lastName: z.string(),
          }),
        )
        .length(2),
      startAt: z.string(),
      endAt: z.string(),
      capacity: z.number().int(),
      price: z.number().optional(),
      deposit: z.number().optional(),
      order: z.string().optional(),
      tags: z.array(z.string()),
      thumbnail: z.string().optional(),
      seminarType: z.string().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  ),
});

export type SeminarStore = z.infer<typeof seminarStoreSchema>["seminars"][number];

export async function getStore(): Promise<SeminarStore[]> {
  await ensureFile();
  const raw = await fs.readFile(dataFilePath, "utf8");

  if (!raw.trim()) {
    return [];
  }

  const parsed = safeParseJson(raw);
  if (!parsed) {
    await writeStore([]);
    return [];
  }

  const result = seminarStoreSchema.safeParse(parsed);
  if (!result.success) {
    await writeStore([]);
    return [];
  }

  return result.data.seminars.map((seminar) => normalizeSeminarRecord(seminar));
}

export async function writeStore(seminars: SeminarStore[]): Promise<void> {
  await ensureFile();
  const normalized = seminars.map((seminar) => normalizeSeminarRecord(seminar));
  await fs.writeFile(
    dataFilePath,
    `${JSON.stringify({ seminars: normalized }, null, 2)}\n`,
    "utf8",
  );
}

export function normalizeSeminarInput(data: SeminarPayload): SeminarAttributes {
  const normalized = {
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

  return normalized;
}

function normalizeTags(tags: string[]): string[] {
  const unique = new Map<string, string>();
  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed) {
      continue;
    }
    const key = trimmed.toLowerCase();
    if (!unique.has(key)) {
      unique.set(key, trimmed);
    }
  }
  return Array.from(unique.values());
}

function normalizeSeminarRecord(seminar: SeminarStore): SeminarStore {
  return {
    ...seminar,
    title: seminar.title.trim(),
    description: seminar.description.trim(),
    speakers: seminar.speakers.map((speaker) => ({
      firstName: speaker.firstName.trim(),
      lastName: speaker.lastName.trim(),
    })),
    startAt: toIsoString(seminar.startAt),
    endAt: toIsoString(seminar.endAt),
    capacity: seminar.capacity,
    price: seminar.price,
    deposit: seminar.deposit,
    order: seminar.order ? seminar.order.trim() : seminar.order,
    createdAt: toIsoString(seminar.createdAt),
    updatedAt: toIsoString(seminar.updatedAt),
    tags: normalizeTags(seminar.tags),
    thumbnail: seminar.thumbnail ? seminar.thumbnail.trim() : seminar.thumbnail,
    seminarType: seminar.seminarType ? seminar.seminarType.trim() : seminar.seminarType,
  };
}

function toIsoString(value: string): string {
  // Handle datetime-local format (YYYY-MM-DDTHH:mm) as local time, not UTC
  // Matches pattern: 2025-01-17T04:00 or with seconds/milliseconds
  const datetimeLocalMatch = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{3}))?$/.exec(value);

  if (datetimeLocalMatch) {
    // Parse as local datetime and convert to ISO string in UTC
    const [, year, month, day, hours, minutes, seconds = '0', milliseconds = '0'] = datetimeLocalMatch;
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

async function ensureFile(): Promise<void> {
  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.mkdir(dirname(dataFilePath), { recursive: true });
    await fs.writeFile(dataFilePath, JSON.stringify({ seminars: [] }, null, 2), "utf8");
  }
}

function safeParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}
