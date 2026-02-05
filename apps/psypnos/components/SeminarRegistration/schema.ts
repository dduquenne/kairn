/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Seminar Registration Validation Schema
 */

import { z } from 'zod';

// Use a fixed reference year for schema validation to avoid hydration mismatches
// The schema uses conservative bounds that will always be valid
const REFERENCE_YEAR = 2025;
const SCHEMA_MIN_BIRTH_YEAR = REFERENCE_YEAR - 100; // 1925
const SCHEMA_MAX_BIRTH_YEAR = REFERENCE_YEAR - 16; // 2009

// Runtime function to get accurate birth year bounds (use in UI only)
export function getBirthYearBounds() {
  const currentYear = new Date().getFullYear();
  return {
    minBirthYear: currentYear - 100,
    maxBirthYear: currentYear - 16,
  };
}

const sexSchema = z
  .union([z.literal('homme'), z.literal('femme'), z.literal('autre'), z.literal('')])
  .refine(v => v !== '', { message: 'Merci de sélectionner votre sexe.' });

export const seminarRegistrationSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'Veuillez indiquer votre prénom (minimum 2 caractères). Exemple : Marie')
      .max(50, 'Le prénom ne doit pas dépasser 50 caractères.'),
    lastName: z
      .string()
      .min(2, 'Veuillez indiquer votre nom (minimum 2 caractères). Exemple : Dupont')
      .max(60, 'Le nom ne doit pas dépasser 60 caractères.'),
    email: z
      .string()
      .email('Veuillez entrer une adresse e-mail valide. Exemple : marie.dupont@exemple.fr'),
    phone: z
      .string()
      .min(10, 'Le numéro doit contenir au moins 10 chiffres.')
      .regex(
        /^[+0-9\s().-]{10,}$/u,
        'Format de téléphone invalide. Utilisez le format : 06 12 34 56 78 ou +33 6 12 34 56 78'
      ),
    seminarId: z.string().min(1, 'Veuillez sélectionner un séminaire dans la liste.'),
    firstTime: z.boolean().optional().default(false),
    precisions: z
      .string()
      .max(500, 'Ce champ est limité à 500 caractères.')
      .optional()
      .transform(value => value?.trim() || ''),
    newsletterOptIn: z.boolean().optional().default(false),
    consent: z.boolean().refine(value => value === true, {
      message: 'Vous devez accepter les conditions pour vous inscrire.',
    }),
    birthYear: z.coerce
      .number()
      .int("L'année de naissance doit être un nombre entier. Exemple : 1985")
      .gte(SCHEMA_MIN_BIRTH_YEAR, `Veuillez indiquer une année de naissance valide.`)
      .lte(SCHEMA_MAX_BIRTH_YEAR, `Vous devez avoir au moins 16 ans pour participer au séminaire.`),
    sex: sexSchema,
    sexOther: z
      .string()
      .max(50, 'Ce champ est limité à 50 caractères.')
      .optional()
      .transform(v => v?.trim() || ''),
    addressStreet: z
      .string()
      .min(3, 'Veuillez indiquer votre adresse (minimum 3 caractères). Exemple : 12 rue de la Paix')
      .max(120, "L'adresse ne doit pas dépasser 120 caractères."),
    addressZip: z
      .string()
      .min(2, 'Le code postal est trop court. Exemple : 75001')
      .max(12, 'Le code postal ne doit pas dépasser 12 caractères.')
      .regex(
        /^[A-Za-z0-9 \-]+$/u,
        'Le code postal ne peut contenir que des lettres, chiffres, espaces ou tirets.'
      ),
    addressCity: z
      .string()
      .min(2, 'Veuillez indiquer votre ville (minimum 2 caractères).')
      .max(80, 'Le nom de la ville ne doit pas dépasser 80 caractères.'),
    addressCountry: z
      .string()
      .min(2, 'Veuillez sélectionner ou indiquer un pays.')
      .max(56, 'Le nom du pays ne doit pas dépasser 56 caractères.'),
    emergencyLastName: z
      .string()
      .min(2, "Veuillez indiquer le nom du contact d'urgence (minimum 2 caractères).")
      .max(60, 'Le nom ne doit pas dépasser 60 caractères.'),
    emergencyFirstName: z
      .string()
      .min(2, "Veuillez indiquer le prénom du contact d'urgence (minimum 2 caractères).")
      .max(50, 'Le prénom ne doit pas dépasser 50 caractères.'),
    emergencyPhone: z
      .string()
      .min(10, "Le numéro d'urgence doit contenir au moins 10 chiffres.")
      .regex(
        /^[+0-9\s().-]{10,}$/u,
        'Format de téléphone invalide. Utilisez le format : 06 12 34 56 78 ou +33 6 12 34 56 78'
      ),
    hasPriorWork: z.boolean().optional().default(false),
    priorWorkDetails: z
      .string()
      .max(800, 'Ce champ est limité à 800 caractères.')
      .optional()
      .transform(v => v?.trim() || ''),
    consent_RGPD: z.boolean().refine(value => value === true, {
      message: 'Vous devez accepter la politique de confidentialité pour vous inscrire.',
    }),
  })
  .superRefine((val, ctx) => {
    if (val.sex === 'autre' && !val.sexOther) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sexOther'],
        message: 'Veuillez préciser votre genre dans le champ prévu à cet effet.',
      });
    }
    if (val.hasPriorWork && !val.priorWorkDetails) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['priorWorkDetails'],
        message:
          'Veuillez préciser les stages suivis, les organismes et/ou les animateurs concernés.',
      });
    }
  });

// Export for backwards compatibility if needed elsewhere
export const MIN_BIRTH_YEAR = SCHEMA_MIN_BIRTH_YEAR;
export const MAX_BIRTH_YEAR = SCHEMA_MAX_BIRTH_YEAR;
