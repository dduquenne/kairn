/**
 * Theme context for Appréciez Votre Vie
 *
 * Re-exports the shared theme context from @kairn/ui with Appréciez Votre Vie-specific defaults.
 * This file maintains backwards compatibility with existing imports.
 */
'use client';

import {
  ThemeProvider as BaseThemeProvider,
  useTheme,
  ThemeAware,
  type ThemeMode,
  type ThemeContextValue,
  type ThemeProviderProps,
} from '@kairn/ui';
import type { ReactNode } from 'react';

// Re-export all types and hooks
export { useTheme, ThemeAware, type ThemeMode, type ThemeContextValue, type ThemeProviderProps };

// Appréciez Votre Vie-specific storage key
const AVV_STORAGE_KEY = 'avv-theme';

/**
 * Appréciez Votre Vie-specific ThemeProvider wrapper
 *
 * Uses the shared ThemeProvider from @kairn/ui with Appréciez Votre Vie-specific defaults.
 */
export function ThemeProvider({
  children,
  defaultTheme = 'dark',
}: {
  children: ReactNode;
  defaultTheme?: ThemeMode;
}) {
  return (
    <BaseThemeProvider
      defaultTheme={defaultTheme}
      storageKey={AVV_STORAGE_KEY}
      applyToRoot
      attribute="class"
    >
      {children}
    </BaseThemeProvider>
  );
}
