/**
 * ErrorBoundary Component Tests
 *
 * Tests pour le composant ErrorBoundary :
 * - Rendu normal des enfants
 * - Capture d'erreur et affichage du fallback
 * - Callback onError
 * - Fallback personnalisé
 * - fallbackRender
 * - Fonction reset
 * - Labels et couleurs personnalisés
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ErrorBoundary } from '../error-boundary';

/** Composant qui déclenche une erreur de manière contrôlable */
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal content</div>;
}

/** Supprime les console.error dans les tests d'ErrorBoundary */
function suppressConsoleError(): () => void {
  const originalError = console.error;
  console.error = vi.fn();
  return () => {
    console.error = originalError;
  };
}

describe('ErrorBoundary', () => {
  let restoreConsole: () => void;

  beforeEach(() => {
    restoreConsole = suppressConsoleError();
  });

  afterEach(() => {
    restoreConsole();
  });

  it('rend les enfants normalement quand il n\u2019y a pas d\u2019erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal content')).toBeDefined();
  });

  it('affiche le fallback par défaut quand une erreur survient', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Une erreur est survenue')).toBeDefined();
    expect(screen.getByText('Réessayer')).toBeDefined();
    expect(screen.getByText("Retour à l'accueil")).toBeDefined();
  });

  it('appelle onError avec les détails de l\u2019erreur', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.objectContaining({ componentStack: expect.any(String) }),
      undefined
    );
  });

  it('transmet le contexte d\u2019erreur au callback', () => {
    const onError = vi.fn();
    const errorContext = { page: '/test', userId: '123' };

    render(
      <ErrorBoundary onError={onError} errorContext={errorContext}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.any(Object), errorContext);
  });

  it('affiche un fallback statique personnalisé', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom fallback')).toBeDefined();
  });

  it('utilise fallbackRender pour un rendu personnalisé', () => {
    render(
      <ErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => (
          <div>
            <p>Error: {error.message}</p>
            <button onClick={resetErrorBoundary}>Reset</button>
          </div>
        )}
      >
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error: Test error')).toBeDefined();
    expect(screen.getByText('Reset')).toBeDefined();
  });

  it('appelle onReset lors du clic sur Réessayer', () => {
    const onReset = vi.fn();

    render(
      <ErrorBoundary onReset={onReset}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Une erreur est survenue')).toBeDefined();

    fireEvent.click(screen.getByText('Réessayer'));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('affiche des labels personnalisés', () => {
    render(
      <ErrorBoundary
        labels={{
          title: 'Oops!',
          message: 'Something went wrong',
          retryButton: 'Try again',
          homeButton: 'Go home',
        }}
      >
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Oops!')).toBeDefined();
    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText('Try again')).toBeDefined();
    expect(screen.getByText('Go home')).toBeDefined();
  });

  it('affiche les détails d\u2019erreur en mode dev', () => {
    render(
      <ErrorBoundary showDevDetails={true}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Test error')).toBeDefined();
  });

  it('masque les détails d\u2019erreur quand showDevDetails est false', () => {
    render(
      <ErrorBoundary showDevDetails={false}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorMessages = screen.queryAllByText('Test error');
    expect(errorMessages).toHaveLength(0);
  });

  it('utilise le homeUrl personnalisé', () => {
    render(
      <ErrorBoundary homeUrl="/dashboard">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const homeLink = screen.getByText("Retour à l'accueil");
    expect(homeLink.getAttribute('href')).toBe('/dashboard');
  });
});
