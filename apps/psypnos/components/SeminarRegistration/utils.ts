// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Seminar Registration Utilities
 */

import type { FormField, FormErrors, SeminarRegistrationFormState } from "./types";
import { seminarRegistrationSchema } from "./schema";
import type { Seminar } from "./types";

export const joinClassNames = (
  ...classes: Array<string | null | false | undefined>
) => classes.filter(Boolean).join(" ");

export const validateRegistration = (values: SeminarRegistrationFormState) => {
  const parsed = seminarRegistrationSchema.safeParse(values);

  if (parsed.success) {
    return { data: parsed.data, errors: {} as FormErrors };
  }

  const fieldErrors: FormErrors = {};
  for (const issue of parsed.error.issues) {
    const pathKey = issue.path[0];
    if (typeof pathKey === "string") {
      fieldErrors[pathKey as FormField] = issue.message;
    }
  }
  return { data: null, errors: fieldErrors };
};

export const daysBetween = (startISO: string, endISO: string) => {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const startUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const diffMs = endUTC - startUTC;
  const diffDays = Math.max(0, Math.round(diffMs / (24 * 60 * 60 * 1000)));
  return diffDays + 1;
};

export const formatSeminarOption = (s: Seminar) => {
  const start = new Date(s.startAt);
  const end = new Date(s.endAt);
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const dateLabel =
    daysBetween(s.startAt, s.endAt) === 1
      ? formatter.format(start)
      : `${formatter.format(start)} → ${formatter.format(end)}`;
  return `${s.title} — ${dateLabel}`;
};

export const getPriceMessage = (selectedSeminar: Seminar | undefined): string | null => {
  if (!selectedSeminar) return null;

  const price = selectedSeminar.price;
  const deposit = selectedSeminar.deposit;

  if (price !== undefined && deposit !== undefined) {
    return `Le tarif pour ce séminaire est de ${price}€. Votre inscription est validée à réception d'un chèque d'acompte de ${deposit}€.`;
  }

  const d = daysBetween(selectedSeminar.startAt, selectedSeminar.endAt);
  if (d === 1) {
    return "Le tarif pour le séminaire d'une journée est de 120€. Votre inscription est validée à réception d'un chèque d'acompte de 60€.";
  }
  if (d === 2) {
    return "Le tarif pour le séminaire d'un week-end est de 250€ (hébergement compris). Votre inscription est validée à réception d'un chèque d'acompte de 125€.";
  }
  return null;
};

export const logStorageError = (message: string, error: unknown) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(message, error);
  }
};
