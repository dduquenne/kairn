"use client";

import { useState, useCallback, useMemo } from "react";
import type { ZodType, ZodTypeDef } from "zod";

import type { UseFormValidationReturn } from "./types";

/**
 * Hook for form validation using Zod
 *
 * @example
 * ```tsx
 * const schema = z.object({
 *   name: z.string().min(2, "Name is required"),
 *   email: z.string().email("Invalid email"),
 * });
 *
 * const { values, errors, handleChange, handleBlur, validate } = useFormValidation({
 *   initialValues: { name: "", email: "" },
 *   schema,
 * });
 * ```
 */
export function useFormValidation<T extends Record<string, unknown>>({
  initialValues,
  schema,
  validateOnChange = true,
  validateOnBlur = true,
}: {
  initialValues: T;
  schema: ZodType<T, ZodTypeDef, unknown>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}): UseFormValidationReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});

  // Validate the entire form
  const validateForm = useCallback(
    (valuesToValidate: T): { data: T | null; errors: Partial<Record<keyof T, string>> } => {
      const result = schema.safeParse(valuesToValidate);

      if (result.success) {
        return { data: result.data, errors: {} };
      }

      const newErrors: Partial<Record<keyof T, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in newErrors)) {
          newErrors[key as keyof T] = issue.message;
        }
      }

      return { data: null, errors: newErrors };
    },
    [schema]
  );

  // Set a single field value
  const setValue = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setValuesState((prev) => {
        const next = { ...prev, [field]: value };
        if (validateOnChange) {
          const { errors: newErrors } = validateForm(next);
          setErrors(newErrors);
        }
        return next;
      });
    },
    [validateOnChange, validateForm]
  );

  // Set multiple field values
  const setValues = useCallback(
    (newValues: Partial<T>) => {
      setValuesState((prev) => {
        const next = { ...prev, ...newValues };
        if (validateOnChange) {
          const { errors: newErrors } = validateForm(next);
          setErrors(newErrors);
        }
        return next;
      });
    },
    [validateOnChange, validateForm]
  );

  // Reset form to initial values
  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
    setTouchedState({});
  }, [initialValues]);

  // Mark a field as touched
  const setTouched = useCallback((field: keyof T, isTouched = true) => {
    setTouchedState((prev) => ({ ...prev, [field]: isTouched }));
  }, []);

  // Mark all fields as touched
  const touchAll = useCallback(() => {
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    for (const key of Object.keys(values) as Array<keyof T>) {
      allTouched[key] = true;
    }
    setTouchedState(allTouched);
  }, [values]);

  // Handle field change event
  const handleChange = useCallback(
    (field: keyof T) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = event.target;
        let value: unknown;

        if (target instanceof HTMLInputElement && target.type === "checkbox") {
          value = target.checked;
        } else if (target instanceof HTMLInputElement && target.type === "number") {
          value = target.value === "" ? "" : Number(target.value);
        } else {
          value = target.value;
        }

        setValue(field, value as T[keyof T]);
        setTouched(field, true);
      },
    [setValue, setTouched]
  );

  // Handle field blur event
  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouched(field, true);
      if (validateOnBlur) {
        const { errors: newErrors } = validateForm(values);
        setErrors(newErrors);
      }
    },
    [setTouched, validateOnBlur, validateForm, values]
  );

  // Check if a field has an error and has been touched
  const hasError = useCallback(
    (field: keyof T) => Boolean(errors[field] && touched[field]),
    [errors, touched]
  );

  // Get error message for a field
  const getError = useCallback(
    (field: keyof T) => (touched[field] ? errors[field] : undefined),
    [errors, touched]
  );

  // Validate and return data or null
  const validate = useCallback(() => {
    touchAll();
    const { data, errors: newErrors } = validateForm(values);
    setErrors(newErrors);
    return data;
  }, [touchAll, validateForm, values]);

  // Check if the form is valid
  const isValid = useMemo(() => {
    const { data } = validateForm(values);
    return data !== null;
  }, [validateForm, values]);

  return {
    values,
    setValue,
    setValues,
    reset,
    errors,
    touched,
    setTouched,
    touchAll,
    isValid,
    validate,
    handleChange,
    handleBlur,
    hasError,
    getError,
  };
}

export type { UseFormValidationReturn };

