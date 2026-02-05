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
 * Available theme modes
 */
export type ThemeMode = 'dark' | 'light' | 'system';

/**
 * Theme context value
 */
export interface ThemeContextValue {
  /** Current theme mode */
  theme: ThemeMode;
  /** Resolved theme (dark or light) based on system preference if theme === 'system' */
  resolvedTheme: 'dark' | 'light';
  /** Change the theme */
  setTheme: (theme: ThemeMode) => void;
  /** Toggle between dark and light */
  toggleTheme: () => void;
  /** Whether the component is mounted (for SSR hydration) */
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const DEFAULT_STORAGE_KEY = 'kairn-theme';

export interface ThemeProviderProps {
  children: ReactNode;
  /** Default theme to use before localStorage is read */
  defaultTheme?: ThemeMode;
  /** Storage key for persisting theme preference */
  storageKey?: string;
  /** Whether to apply theme class to document root */
  applyToRoot?: boolean;
  /** Custom attribute to use for theme (default: 'class') */
  attribute?: 'class' | 'data-theme' | string;
}

/**
 * Theme Provider for dark/light mode
 *
 * Persists preference in localStorage and respects system preferences.
 * Supports SSR by deferring theme application until mounted.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 *
 * // With custom storage key
 * <ThemeProvider storageKey="my-app-theme" defaultTheme="system">
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = DEFAULT_STORAGE_KEY,
  applyToRoot = true,
  attribute = 'class',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  // Determines resolved theme based on system preferences
  const getResolvedTheme = useCallback((themeMode: ThemeMode): 'dark' | 'light' => {
    if (themeMode === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark';
    }
    return themeMode;
  }, []);

  // Initialize from localStorage
  useEffect(() => {
    setMounted(true);

    try {
      const stored = localStorage.getItem(storageKey) as ThemeMode | null;
      if (stored && ['dark', 'light', 'system'].includes(stored)) {
        setThemeState(stored);
        setResolvedTheme(getResolvedTheme(stored));
      } else {
        setResolvedTheme(getResolvedTheme(defaultTheme));
      }
    } catch {
      // localStorage might not be available
      setResolvedTheme(getResolvedTheme(defaultTheme));
    }
  }, [defaultTheme, getResolvedTheme, storageKey]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    if (!mounted || !applyToRoot) return;

    const root = document.documentElement;

    if (attribute === 'class') {
      // Remove existing theme classes
      root.classList.remove('dark', 'light');
      // Add resolved theme class
      root.classList.add(resolvedTheme);
    } else if (attribute === 'data-theme') {
      root.setAttribute('data-theme', resolvedTheme);
    } else {
      root.setAttribute(attribute, resolvedTheme);
    }

    // Update color-scheme for native browser elements
    root.style.setProperty('color-scheme', resolvedTheme);
  }, [resolvedTheme, mounted, applyToRoot, attribute]);

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme);
      setResolvedTheme(getResolvedTheme(newTheme));

      try {
        localStorage.setItem(storageKey, newTheme);
      } catch {
        // localStorage might not be available
      }
    },
    [getResolvedTheme, storageKey]
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
    mounted,
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access theme context
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { theme, toggleTheme, resolvedTheme } = useTheme();
 *
 *   return (
 *     <button onClick={toggleTheme}>
 *       Current: {resolvedTheme}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Component that renders only on the client after hydration
 * Useful for theme-dependent components that might cause hydration mismatch
 */
export function ThemeAware({ children }: { children: ReactNode }) {
  const { mounted } = useTheme();

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}
