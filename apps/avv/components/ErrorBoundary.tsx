'use client';

/**
 * ErrorBoundary wrapper spécifique au site Appréciez Votre Vie.
 *
 * Utilise le composant ErrorBoundary centralisé de @kairn/ui
 * avec les couleurs et labels du thème Appréciez Votre Vie.
 *
 * @module components/ErrorBoundary
 */

import { ErrorBoundary as SharedErrorBoundary } from '@kairn/ui';
import type { ErrorInfo, ReactNode } from 'react';

/** Props du wrapper ErrorBoundary Appréciez Votre Vie */
interface AvvErrorBoundaryProps {
  /** Contenu enfant */
  children: ReactNode;
  /** Composant fallback personnalisé */
  fallback?: ReactNode;
}

/** Couleurs thème Appréciez Votre Vie pour le fallback d'erreur */
const AVV_COLORS = {
  background: 'min-h-screen bg-night flex items-center justify-center p-6',
  card: 'max-w-md w-full bg-gold/10 border border-gold/20 rounded-xl p-6 text-center',
  iconContainer: 'bg-red-500/20 p-4 rounded-full',
  title: 'text-2xl font-bold text-ivory mb-2',
  message: 'text-ivory/70 mb-6',
  retryButton:
    'flex items-center justify-center gap-2 flex-1 bg-gold hover:bg-gold/90 text-night font-semibold py-3 px-6 rounded-lg transition-colors',
  homeButton:
    'flex items-center justify-center gap-2 flex-1 bg-ivory/10 hover:bg-ivory/20 text-ivory font-medium py-3 px-6 rounded-lg transition-colors',
  devErrorBlock: 'bg-night/60 rounded-lg p-4 mb-6 text-left',
  devErrorText: 'text-xs text-red-400 font-mono break-all',
};

/**
 * Reporter d'erreur pour Appréciez Votre Vie
 */
function handleError(error: Error, errorInfo: ErrorInfo, context?: Record<string, unknown>): void {
  console.error('[ErrorBoundary] Caught error:', {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    ...context,
  });
}

/**
 * ErrorBoundary wrapper avec le thème Appréciez Votre Vie.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export function ErrorBoundary({ children, fallback }: AvvErrorBoundaryProps) {
  return (
    <SharedErrorBoundary fallback={fallback} onError={handleError} colors={AVV_COLORS} homeUrl="/">
      {children}
    </SharedErrorBoundary>
  );
}
