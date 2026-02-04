/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { useCallback, useState } from "react";

export interface FormSubmissionError {
  code: string;
  message: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

/**
 * Hook pour gérer la soumission de formulaires avec retry logic
 */
export function useFormSubmission(
  endpoint: string,
  options?: {
    onSuccess?: () => void;
    onError?: (error: FormSubmissionError) => void;
    maxRetries?: number;
  }
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<FormSubmissionError | null>(null);

  const submit = useCallback(
    async <T extends Record<string, unknown>>(data: T): Promise<FormSubmissionError | null> => {
      setIsSubmitting(true);
      setError(null);

      let lastError: FormSubmissionError | null = null;
      const maxRetries = options?.maxRetries ?? 2;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            const apiError: FormSubmissionError = {
              code: body.code ?? "UNKNOWN_ERROR",
              message: body.message ?? "Une erreur s'est produite",
              statusCode: response.status,
              details: body.details,
            };

            // Retry sur les erreurs 5xx
            if (response.status >= 500 && attempt < maxRetries) {
              lastError = apiError;
              await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
              continue;
            }

            setError(apiError);
            options?.onError?.(apiError);
            setIsSubmitting(false);
            return apiError;
          }

          // Succès
          setIsSubmitting(false);
          options?.onSuccess?.();
          return null;
        } catch (err) {
          const networkError: FormSubmissionError = {
            code: "NETWORK_ERROR",
            message: "Erreur réseau. Veuillez vérifier votre connexion.",
          };

          if (attempt < maxRetries) {
            lastError = networkError;
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            continue;
          }

          setError(networkError);
          options?.onError?.(networkError);
          setIsSubmitting(false);
          return networkError;
        }
      }

      // Tous les tentatives ont échoué
      if (lastError) {
        setError(lastError);
        options?.onError?.(lastError);
        setIsSubmitting(false);
        return lastError;
      }

      return null;
    },
    [endpoint, options]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSubmitting,
    error,
    submit,
    clearError,
  };
}
