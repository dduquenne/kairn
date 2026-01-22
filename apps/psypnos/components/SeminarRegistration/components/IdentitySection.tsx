// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Identity & Contact Section
 */

"use client";

import type { ChangeEvent } from "react";
import { FormField } from "./FormField";
import type { FormField as FormFieldType, FormErrors, SeminarRegistrationFormState } from "../types";
import { joinClassNames } from "../utils";

const CARD_SECTION_CLASS =
  "rounded-3xl border border-ivory/10 bg-night/80 p-5 shadow-inner shadow-night/60";

interface IdentitySectionProps {
  formValues: SeminarRegistrationFormState;
  errors: FormErrors;
  touchedFields: Partial<Record<FormFieldType, boolean>>;
  isProcessing: boolean;
  handleChange: (field: FormFieldType) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export function IdentitySection({
  formValues,
  errors,
  touchedFields,
  isProcessing,
  handleChange,
}: IdentitySectionProps) {
  return (
    <section
      className={joinClassNames(CARD_SECTION_CLASS, "space-y-6")}
      aria-label="Identité et coordonnées"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gold">
        Identité & coordonnées
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          id="lastName"
          label="Nom"
          type="text"
          autoComplete="family-name"
          value={formValues.lastName}
          onChange={handleChange("lastName")}
          disabled={isProcessing}
          touched={touchedFields.lastName}
          error={errors.lastName}
        />
        <FormField
          id="firstName"
          label="Prénom"
          type="text"
          autoComplete="given-name"
          value={formValues.firstName}
          onChange={handleChange("firstName")}
          disabled={isProcessing}
          touched={touchedFields.firstName}
          error={errors.firstName}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={formValues.email}
          onChange={handleChange("email")}
          disabled={isProcessing}
          touched={touchedFields.email}
          error={errors.email}
        />
        <FormField
          id="phone"
          label="Téléphone"
          type="tel"
          autoComplete="tel"
          value={formValues.phone}
          onChange={handleChange("phone")}
          disabled={isProcessing}
          touched={touchedFields.phone}
          error={errors.phone}
        />
      </div>
    </section>
  );
}
