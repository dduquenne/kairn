// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { useCallback, useState } from "react";
import { ZodSchema, ZodError } from "zod";

export interface FormErrors {
  [key: string]: string | undefined;
}

/**
 * Hook pour gérer la validation de formulaire avec Zod
 */
export function useFormValidation<T extends Record<string, unknown>>(schema: ZodSchema) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback(
    (fieldName: keyof T, value: unknown): string | undefined => {
      if (!touchedFields[fieldName]) {
        return undefined;
      }

      try {
        // Valider le champ spécifique
        const fieldSchema = schema instanceof ZodSchema ? schema : undefined;
        if (!fieldSchema) return undefined;

        fieldSchema.parse({ [fieldName]: value });
        return undefined;
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldError = error.errors.find((e) => e.path[0] === fieldName);
          return fieldError?.message;
        }
        return undefined;
      }
    },
    [touchedFields, schema]
  );

  const validateForm = useCallback(
    (data: T): boolean => {
      try {
        schema.parse(data);
        setErrors({});
        return true;
      } catch (error) {
        if (error instanceof ZodError) {
          const newErrors: FormErrors = {};
          error.errors.forEach((err) => {
            const path = err.path.join(".");
            newErrors[path] = err.message;
          });
          setErrors(newErrors);
        }
        return false;
      }
    },
    [schema]
  );

  const markFieldTouched = useCallback((fieldName: keyof T) => {
    setTouchedFields((prev) => ({
      ...prev,
      [fieldName]: true,
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  return {
    errors,
    touchedFields,
    validateForm,
    validateField,
    markFieldTouched,
    clearErrors,
    clearFieldError,
  };
}
