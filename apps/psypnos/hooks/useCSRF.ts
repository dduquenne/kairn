// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { useCallback, useEffect, useState } from "react";

/**
 * Hook personnalisé pour gérer les tokens CSRF
 * Récupère automatiquement un token CSRF au montage du composant
 * et fournit une fonction pour le rafraîchir
 */
export function useCSRF() {
  const [csrfToken, setCSRFToken] = useState<string | null>(null);
  // Initialize to false to avoid hydration mismatch - will be set to true when fetch starts
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Récupère un nouveau token CSRF depuis l'API
   */
  const fetchCSRFToken = useCallback(async () => {
    try {
      setIsFetching(true);
      setError(null);

      const response = await fetch("/api/csrf-token", {
        method: "GET",
        credentials: "same-origin", // Important pour inclure les cookies
      });

      if (!response.ok) {
        throw new Error("Échec de la récupération du token CSRF");
      }

      const data = await response.json();

      if (data.token) {
        setCSRFToken(data.token);
      } else {
        throw new Error("Token CSRF manquant dans la réponse");
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération du token CSRF";
      setError(message);
      console.error("Erreur CSRF:", err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  /**
   * Récupère le token au montage du composant
   */
  useEffect(() => {
    fetchCSRFToken();
  }, [fetchCSRFToken]);

  /**
   * Rafraîchit le token CSRF (utile après une soumission réussie)
   */
  const refreshToken = useCallback(() => {
    return fetchCSRFToken();
  }, [fetchCSRFToken]);

  return {
    csrfToken,
    isLoading: isFetching,
    error,
    refreshToken,
  };
}
