// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Form State Management Hook
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import type { FormField, FormErrors, SeminarRegistrationFormState, SeminarRegistrationData } from "../types";
import { INITIAL_FORM_STATE, STORAGE_KEY } from "../constants";
import { validateRegistration, logStorageError } from "../utils";

const initialErrors = validateRegistration(INITIAL_FORM_STATE).errors;

export function useFormState() {
  const [formValues, setFormValues] = useState<SeminarRegistrationFormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<FormErrors>(initialErrors);
  const [touchedFields, setTouchedFields] = useState<Partial<Record<FormField, boolean>>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore from session storage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SeminarRegistrationFormState> | null;
        if (parsed) {
          // Exclude seminarId from restoration to avoid pre-selecting a seminar
          const { seminarId: _, ...restParsed } = parsed;
          const nextValues = { ...INITIAL_FORM_STATE, ...restParsed } as SeminarRegistrationFormState;
          setFormValues(nextValues);
          const validation = validateRegistration(nextValues);
          setErrors(validation.errors);
        }
      }
    } catch (error) {
      logStorageError("Unable to restore seminar registration form values", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persist to session storage
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formValues));
    } catch (error) {
      logStorageError("Unable to persist seminar registration form values", error);
    }
  }, [formValues, isHydrated]);

  const resetForm = useCallback(() => {
    setFormValues({ ...INITIAL_FORM_STATE });
    setErrors({ ...initialErrors });
    setTouchedFields({});
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const handleChange = useCallback(
    (field: FormField) =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        const value = (
          target instanceof HTMLInputElement && target.type === "checkbox"
            ? target.checked
            : target.value
        ) as SeminarRegistrationFormState[FormField];

        setFormValues((previous) => {
          const nextValues = { ...previous, [field]: value } as SeminarRegistrationFormState;
          const validation = validateRegistration(nextValues);
          setErrors(validation.errors);
          return nextValues;
        });

        setTouchedFields((previous) =>
          previous[field] ? previous : { ...previous, [field]: true }
        );
      },
    []
  );

  const setBooleanField = useCallback(
    (field: FormField, value: boolean) => {
      setFormValues((previous) => {
        const nextValues = {
          ...previous,
          [field]: value,
        } as SeminarRegistrationFormState;
        const validation = validateRegistration(nextValues);
        setErrors(validation.errors);
        return nextValues;
      });

      setTouchedFields((previous) =>
        previous[field] ? previous : { ...previous, [field]: true }
      );
    },
    []
  );

  const setAllFieldsTouched = useCallback((touched: Record<FormField, boolean>) => {
    setTouchedFields({ ...touched });
  }, []);

  const validate = useCallback((): { data: SeminarRegistrationData | null; errors: FormErrors } => {
    const validation = validateRegistration(formValues);
    setErrors(validation.errors);
    return validation;
  }, [formValues]);

  const isValid = Object.keys(errors).length === 0;

  return {
    formValues,
    errors,
    touchedFields,
    isHydrated,
    isValid,
    handleChange,
    setBooleanField,
    setAllFieldsTouched,
    resetForm,
    validate,
  };
}
