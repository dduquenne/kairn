'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Debounce une valeur — retourne la version debounced
 *
 * @param value - Valeur à debouncer
 * @param delay - Délai en millisecondes (défaut: 300)
 * @returns Valeur debounced
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce une fonction callback
 *
 * @param callback - Fonction à debouncer
 * @param delay - Délai en millisecondes (défaut: 300)
 * @returns Fonction debounced
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * État debounced — combine useState avec debouncing
 *
 * @param initialValue - Valeur initiale
 * @param delay - Délai en millisecondes (défaut: 300)
 * @returns [debouncedValue, setValue, immediateValue]
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, (value: T) => void, T] {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce(value, delay);

  return [debouncedValue, setValue, value];
}
