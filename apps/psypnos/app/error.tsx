"use client";

import { useEffect } from "react";

export const dynamic = "force-dynamic";

/**
 * Global error boundary for the application
 * Catches errors in the React component tree and provides error recovery
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error details for debugging
    console.error("[ErrorBoundary] Application error:", {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });

    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-night via-night/95 to-night px-6 text-center">
      <h1 className="mb-4 text-6xl font-bold text-gold">Erreur</h1>
      <h2 className="mb-4 text-3xl font-semibold text-ivory">Une erreur est survenue</h2>
      <p className="mb-8 max-w-md text-lg text-ivory/80">
        Désolé, une erreur inattendue s'est produite. Veuillez réessayer.
      </p>

      {/* Show error digest in development for easier debugging */}
      {process.env.NODE_ENV === "development" && error.digest && (
        <p className="mb-4 text-sm text-ivory/50 font-mono">
          Error ID: {error.digest}
        </p>
      )}

      <div className="flex gap-4">
        <button
          onClick={reset}
          className="inline-block rounded-lg bg-gold/20 px-8 py-3 font-medium text-gold transition-all hover:bg-gold/30"
        >
          Réessayer
        </button>
        <a
          href="/"
          className="inline-block rounded-lg bg-ivory/10 px-8 py-3 font-medium text-ivory transition-all hover:bg-ivory/20"
        >
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}
