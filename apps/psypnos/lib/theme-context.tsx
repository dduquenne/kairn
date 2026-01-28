'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

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

  // Applique le thème au document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Supprime les classes existantes
    root.classList.remove('dark', 'light');

    // Ajoute la classe du thème résolu
    root.classList.add(resolvedTheme);

    // Met à jour les CSS variables pour le mode clair
    if (resolvedTheme === 'light') {
      root.style.setProperty('--color-background', '#FFFFFF');
      root.style.setProperty('--color-foreground', '#0e1f2f');
      root.style.setProperty('--color-primary', '#8b7a3f');
      root.style.setProperty('--color-gold-text', '#8b7a3f');
      root.style.setProperty('--color-gold-accent', '#b08f4a');
      root.style.setProperty('--color-gold-hover', '#6b5e32');
      root.style.setProperty('--color-ivory-text', '#0e1f2f');
      root.style.setProperty('--color-ivory-muted', '#728a9c');
    } else {
      root.style.setProperty('--color-background', '#0e1f2f');
      root.style.setProperty('--color-foreground', '#f5f1e6');
      root.style.setProperty('--color-primary', '#E5C78E');
      root.style.setProperty('--color-gold-text', '#E5C78E');
      root.style.setProperty('--color-gold-accent', '#c7a962');
      root.style.setProperty('--color-gold-hover', '#F0D9A3');
      root.style.setProperty('--color-ivory-text', '#f5f1e6');
      root.style.setProperty('--color-ivory-muted', '#d4c9b0');
    }
  }, [resolvedTheme, mounted]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    setResolvedTheme(getResolvedTheme(newTheme));
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, [getResolvedTheme]);

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Évite le flash de contenu mal thémé
  if (!mounted) {
    return (
      <div className="bg-night text-ivory" suppressHydrationWarning>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
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
