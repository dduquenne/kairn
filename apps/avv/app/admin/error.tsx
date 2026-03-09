"use client";

import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-night/95 p-8 text-ivory">
      <AlertCircle className="h-16 w-16 text-red-400" />
      <h1 className="text-2xl font-semibold text-red-300">
        Erreur de chargement
      </h1>
      <p className="max-w-md text-center text-ivory/70">
        Une erreur s'est produite lors du chargement de cette page.
        Veuillez réessayer ou retourner à l'accueil.
      </p>
      {error.message && (
        <p className="rounded bg-night/60 px-3 py-1 text-sm text-ivory/50">
          {error.message}
        </p>
      )}
      <div className="mt-4 flex gap-4">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-md bg-gold/20 px-4 py-2 text-gold transition hover:bg-gold/30"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </button>
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-md border border-ivory/30 px-4 py-2 text-ivory/70 transition hover:border-ivory/50 hover:text-ivory"
        >
          <Home className="h-4 w-4" />
          Accueil admin
        </Link>
      </div>
    </div>
  );
}
