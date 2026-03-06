'use client';

import { useCallback, useEffect, useState } from 'react';

/** Retour du hook useCSRF */
export interface UseCSRFReturn {
  /** Token CSRF courant (null si non encore chargé) */
  csrfToken: string | null;
  /** True pendant le chargement du token */
  isLoading: boolean;
  /** Message d'erreur en cas d'échec */
  error: string | null;
  /** Rafraîchit le token CSRF */
  refreshToken: () => Promise<void>;
}

/**
 * Hook pour gérer les tokens CSRF
 *
 * Récupère automatiquement un token CSRF au montage du composant
 * et fournit une fonction pour le rafraîchir.
 *
 * @param endpoint - URL de l'endpoint CSRF (défaut: '/api/csrf-token')
 * @returns État et fonctions CSRF
 */
export function useCSRF(endpoint: string = '/api/csrf-token'): UseCSRFReturn {
  const [csrfToken, setCSRFToken] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCSRFToken = useCallback(async () => {
    try {
      setIsFetching(true);
      setError(null);

      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Échec de la récupération du token CSRF');
      }

      const data = (await response.json()) as { token?: string };

      if (data.token) {
        setCSRFToken(data.token);
      } else {
        throw new Error('Token CSRF manquant dans la réponse');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors de la récupération du token CSRF';
      setError(message);
      console.error('Erreur CSRF:', err);
    } finally {
      setIsFetching(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchCSRFToken();
  }, [fetchCSRFToken]);

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
