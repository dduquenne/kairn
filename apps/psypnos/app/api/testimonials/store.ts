// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { promises as fs } from "fs";
import { dirname, join } from "path";
import { z } from "zod";

const dataFilePath = join(process.cwd(), "data", "testimonials.json");

const optionalRoleSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  },
  z.string().max(120, "La fonction doit contenir au maximum 120 caractères").optional(),
);

export const testimonialPayloadSchema = z.object({
  quote: z.string().trim().min(1, "Le témoignage est obligatoire").max(800, "Le témoignage est trop long"),
  author: z.string().trim().min(1, "Le nom est obligatoire").max(120, "Le nom est trop long"),
  role: optionalRoleSchema,
});

export type TestimonialAttributes = z.infer<typeof testimonialPayloadSchema>;
export type TestimonialPayload = z.input<typeof testimonialPayloadSchema>;

const testimonialStoreSchema = z.object({
  testimonials: z.array(
    z.object({
      id: z.string(),
      quote: z.string(),
      author: z.string(),
      role: z.string().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  ),
});

export type TestimonialStore = z.infer<typeof testimonialStoreSchema>["testimonials"][number];

export async function getStore(): Promise<TestimonialStore[]> {
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

  const result = testimonialStoreSchema.safeParse(parsed);
  if (!result.success) {
    await writeStore([]);
    return [];
  }

  return result.data.testimonials.map((testimonial) => normalizeTestimonialRecord(testimonial));
}

export async function writeStore(testimonials: TestimonialStore[]): Promise<void> {
  await ensureFile();
  const normalized = testimonials.map((testimonial) => normalizeTestimonialRecord(testimonial));
  await fs.writeFile(
    dataFilePath,
    `${JSON.stringify({ testimonials: normalized }, null, 2)}\n`,
    "utf8",
  );
}

export function normalizeTestimonialInput(data: TestimonialPayload): TestimonialAttributes {
  const role = typeof data.role === "string" ? data.role : undefined;
  return {
    quote: data.quote.trim(),
    author: data.author.trim(),
    ...(role ? { role: role.trim() } : {}),
  };
}

function normalizeTestimonialRecord(testimonial: TestimonialStore): TestimonialStore {
  return {
    ...testimonial,
    quote: testimonial.quote.trim(),
    author: testimonial.author.trim(),
    role: testimonial.role?.trim() || undefined,
    createdAt: toIsoString(testimonial.createdAt),
    updatedAt: toIsoString(testimonial.updatedAt),
  };
}

function toIsoString(value: string): string {
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
    await fs.writeFile(dataFilePath, JSON.stringify({ testimonials: [] }, null, 2), "utf8");
  }
}

function safeParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}
