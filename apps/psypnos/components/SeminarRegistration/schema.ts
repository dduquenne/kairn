// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Seminar Registration Validation Schema
 */

import { z } from "zod";

// Use a fixed reference year for schema validation to avoid hydration mismatches
// The schema uses conservative bounds that will always be valid
const REFERENCE_YEAR = 2025;
const SCHEMA_MIN_BIRTH_YEAR = REFERENCE_YEAR - 100; // 1925
const SCHEMA_MAX_BIRTH_YEAR = REFERENCE_YEAR - 16;  // 2009

// Runtime function to get accurate birth year bounds (use in UI only)
export function getBirthYearBounds() {
  const currentYear = new Date().getFullYear();
  return {
    minBirthYear: currentYear - 100,
    maxBirthYear: currentYear - 16,
  };
}

const sexSchema = z
  .union([z.literal("homme"), z.literal("femme"), z.literal("autre"), z.literal("")])
  .refine((v) => v !== "", { message: "Merci de sélectionner votre sexe." });

export const seminarRegistrationSchema = z.object({
  firstName: z
    .string()
    .min(2, "Merci d'indiquer au moins deux lettres.")
    .max(50, "Votre prénom semble un peu long, vérifions ensemble."),
  lastName: z
    .string()
    .min(2, "Merci d'indiquer au moins deux lettres.")
    .max(60, "Votre nom semble un peu long, vérifions ensemble."),
  email: z
    .string()
    .email("Nous n'avons pas reconnu ce format d'email."),
  phone: z
    .string()
    .min(10, "Le numéro doit contenir au moins 10 chiffres.")
    .regex(
      /^[+0-9\s().-]{10,}$/u,
      "Utilisez uniquement des chiffres et symboles classiques."
    ),
  seminarId: z
    .string()
    .min(1, "Merci de sélectionner un séminaire."),
  firstTime: z
    .boolean()
    .optional()
    .default(false),
  precisions: z
    .string()
    .max(500, "Merci pour ces détails, 500 caractères suffisent amplement.")
    .optional()
    .transform((value) => value?.trim() || ""),
  newsletterOptIn: z.boolean().optional().default(false),
  consent: z
    .boolean()
    .refine((value) => value === true, {
      message: "Nous avons besoin de votre accord pour continuer."
    }),
  birthYear: z.coerce
    .number()
    .int("L'année doit être un nombre entier.")
    .gte(SCHEMA_MIN_BIRTH_YEAR, `Veuillez indiquer une année valide.`)
    .lte(SCHEMA_MAX_BIRTH_YEAR, `Veuillez indiquer une année valide (vous devez avoir au moins 16 ans).`),
  sex: sexSchema,
  sexOther: z
    .string()
    .max(50, "50 caractères suffisent pour la précision.")
    .optional()
    .transform((v) => v?.trim() || ""),
  addressStreet: z
    .string()
    .min(3, "Merci d'indiquer une rue valide.")
    .max(120, "La rue ne doit pas dépasser 120 caractères."),
  addressZip: z
    .string()
    .min(2, "Code postal trop court.")
    .max(12, "Code postal trop long.")
    .regex(/^[A-Za-z0-9 \-]+$/u, "Utilisez uniquement lettres, chiffres, espaces ou tirets."),
  addressCity: z
    .string()
    .min(2, "Merci d'indiquer une ville valide.")
    .max(80, "Le nom de la ville est trop long."),
  addressCountry: z
    .string()
    .min(2, "Merci d'indiquer un pays.")
    .max(56, "Nom de pays trop long."),
  emergencyLastName: z
    .string()
    .min(2, "Merci d'indiquer au moins deux lettres.")
    .max(60, "Le nom semble un peu long, vérifions ensemble."),
  emergencyFirstName: z
    .string()
    .min(2, "Merci d'indiquer au moins deux lettres.")
    .max(50, "Le prénom semble un peu long, vérifions ensemble."),
  emergencyPhone: z
    .string()
    .min(10, "Le numéro doit contenir au moins 10 chiffres.")
    .regex(/^[+0-9\s().-]{10,}$/u, "Utilisez uniquement des chiffres et symboles classiques."),
  hasPriorWork: z.boolean().optional().default(false),
  priorWorkDetails: z
    .string()
    .max(800, "800 caractères suffisent pour ces précisions.")
    .optional()
    .transform((v) => v?.trim() || ""),
  consent_RGPD: z
    .boolean()
    .refine((value) => value === true, {
      message: "Nous avons besoin de votre accord pour continuer."
    })
}).superRefine((val, ctx) => {
  if (val.sex === "autre" && !val.sexOther) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sexOther"],
      message: "Merci de préciser votre sexe."
    });
  }
  if (val.hasPriorWork && !val.priorWorkDetails) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["priorWorkDetails"],
      message: "Merci de préciser les stages suivis, organismes et/ou animateurs."
    });
  }
});

// Export for backwards compatibility if needed elsewhere
export const MIN_BIRTH_YEAR = SCHEMA_MIN_BIRTH_YEAR;
export const MAX_BIRTH_YEAR = SCHEMA_MAX_BIRTH_YEAR;
