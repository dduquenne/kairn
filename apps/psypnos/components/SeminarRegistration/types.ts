// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Seminar Registration Types
 */

import type { z } from "zod";
import type { seminarRegistrationSchema } from "./schema";

export type Seminar = {
  id: string;
  title: string;
  description?: string;
  speakers?: { firstName: string; lastName: string }[];
  startAt: string;
  endAt: string;
  capacity?: number;
  price?: number;
  deposit?: number;
  order?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type SeminarRegistrationData = z.infer<typeof seminarRegistrationSchema>;

export type SeminarRegistrationFormState = Omit<
  SeminarRegistrationData,
  "birthYear" | "sex"
> & {
  birthYear: number | "";
  sex: "" | SeminarRegistrationData["sex"];
};

export type FormField = keyof SeminarRegistrationData;
export type FormErrors = Partial<Record<FormField, string>>;

export type MutationVariables = {
  formData: SeminarRegistrationData;
  token: string;
};
