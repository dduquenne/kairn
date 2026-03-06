'use client';

import { useEffect, useState } from 'react';

/**
 * Hook pour persister l'état du formulaire dans sessionStorage avec debounce
 *
 * @param key - Clé de stockage dans sessionStorage
 * @param initialValue - Valeur initiale
 * @param debounceMs - Délai de debounce en ms (défaut: 500)
 * @returns [value, setValue]
 */
export function useFormSessionStorage<T extends Record<string, unknown>>(
  key: string,
  initialValue: T,
  debounceMs: number = 500
): [T, (value: T) => void] {
  const [isHydrated, setIsHydrated] = useState(false);
  const [value, setValue] = useState<T>(initialValue);

  // Charger depuis sessionStorage au montage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = window.sessionStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as T;
        setValue(parsed);
      }
    } catch {
      // Ignorer les erreurs de parsing
    }

    setIsHydrated(true);
  }, [key]);

  // Persister avec debounce
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      try {
        window.sessionStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn('Failed to save form to sessionStorage:', error);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, key, isHydrated, debounceMs]);

  return [value, setValue];
}
