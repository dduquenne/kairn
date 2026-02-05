/**
 * Theme context for Psypnos
 *
 * Re-exports the shared theme context from @kairn/ui with Psypnos-specific defaults.
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

// Psypnos-specific storage key
const PSYPNOS_STORAGE_KEY = 'psypnos-theme';

/**
 * Psypnos-specific ThemeProvider wrapper
 *
 * Uses the shared ThemeProvider from @kairn/ui with Psypnos-specific defaults.
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
      storageKey={PSYPNOS_STORAGE_KEY}
      applyToRoot
      attribute="class"
    >
      {children}
    </BaseThemeProvider>
  );
}
