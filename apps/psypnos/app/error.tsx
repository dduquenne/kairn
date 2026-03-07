'use client';

import { useEffect } from 'react';

export const dynamic = 'force-dynamic';

/**
 * Page d'erreur globale Next.js App Router pour Psypnos.
 *
 * Affiche une page d'erreur avec les couleurs du thème Psypnos
 * et intègre le reporting d'erreur centralisé.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ErrorBoundary] Application error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="from-night via-night/95 to-night flex min-h-screen flex-col items-center justify-center bg-gradient-to-b px-6 text-center">
      <h1 className="font-display text-gold-accessible mb-4 text-6xl font-bold">Erreur</h1>
      <h2 className="font-display text-ivory mb-4 text-3xl font-semibold">
        Une erreur est survenue
      </h2>
      <p className="text-ivory/80 mb-8 max-w-md text-lg">
        Désolé, une erreur inattendue s&apos;est produite. Veuillez réessayer.
      </p>

      {process.env.NODE_ENV === 'development' && error.digest && (
        <p className="text-ivory/50 mb-4 font-mono text-sm">Error ID: {error.digest}</p>
      )}

      <div className="flex gap-4">
        <button
          onClick={reset}
          className="bg-gold/20 text-gold hover:bg-gold/30 inline-block rounded-lg px-8 py-3 font-medium transition-all"
        >
          Réessayer
        </button>
        <a
          href="/"
          className="bg-ivory/10 text-ivory hover:bg-ivory/20 inline-block rounded-lg px-8 py-3 font-medium transition-all"
        >
          Retour à l&apos;accueil
        </a>
      </div>
    </div>
  );
}
