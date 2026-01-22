"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Analytics Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg border border-red-500/30 bg-red-500/10 p-8">
      <AlertCircle className="h-12 w-12 text-red-400" />
      <h2 className="text-xl font-semibold text-red-300">
        Erreur de chargement des analytiques
      </h2>
      <p className="max-w-md text-center text-ivory/70">
        Une erreur s'est produite lors du chargement du tableau de bord analytique.
        Veuillez réessayer.
      </p>
      {error.message && (
        <p className="rounded bg-night/60 px-3 py-1 text-sm text-ivory/50">
          {error.message}
        </p>
      )}
      <button
        onClick={reset}
        className="mt-4 flex items-center gap-2 rounded-md bg-gold/20 px-4 py-2 text-gold transition hover:bg-gold/30"
      >
        <RefreshCw className="h-4 w-4" />
        Réessayer
      </button>
    </div>
  );
}
