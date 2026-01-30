'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

/**
 * Theme modes disponibles
 */
export type ThemeMode = 'dark' | 'light' | 'system';

/**
 * Context pour le thème
 */
interface ThemeContextValue {
  /** Mode actuel du thème */
  theme: ThemeMode;
  /** Thème résolu (dark ou light) basé sur system preference si theme === 'system' */
  resolvedTheme: 'dark' | 'light';
  /** Change le thème */
  setTheme: (theme: ThemeMode) => void;
  /** Toggle entre dark et light */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'psypnos-theme';

/**
 * Provider pour le thème clair/sombre
 * Persiste la préférence dans localStorage
 * Note: Les couleurs sont maintenant gérées par CustomizationProvider
 */
export function ThemeProvider({
  children,
  defaultTheme = 'dark',
}: {
  children: ReactNode;
  defaultTheme?: ThemeMode;
}) {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  // Détermine le thème résolu basé sur les préférences système
  const getResolvedTheme = useCallback((themeMode: ThemeMode): 'dark' | 'light' => {
    if (themeMode === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark';
    }
    return themeMode;
  }, []);

  // Initialisation depuis localStorage
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored && ['dark', 'light', 'system'].includes(stored)) {
      setThemeState(stored);
      setResolvedTheme(getResolvedTheme(stored));
    } else {
      setResolvedTheme(getResolvedTheme(defaultTheme));
    }
  }, [defaultTheme, getResolvedTheme]);

  // Écoute les changements de préférence système
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Applique le thème au document (classe uniquement, les couleurs sont gérées par CustomizationProvider)
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Supprime les classes existantes
    root.classList.remove('dark', 'light');

    // Ajoute la classe du thème résolu
    root.classList.add(resolvedTheme);

    // Met à jour le color-scheme pour les éléments natifs du navigateur
    root.style.setProperty('color-scheme', resolvedTheme);
  }, [resolvedTheme, mounted]);

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme);
      setResolvedTheme(getResolvedTheme(newTheme));
      localStorage.setItem(STORAGE_KEY, newTheme);
    },
    [getResolvedTheme]
  );

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  const contextValue: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

/**
 * Hook pour accéder au contexte du thème
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
