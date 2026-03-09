"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OfflinePage() {
  const router = useRouter();

  const handleRetry = () => {
    if (navigator.onLine) {
      router.back();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-night via-night to-night/90 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-gold/10 p-6">
            <WifiOff className="h-16 w-16 text-gold" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-ivory mb-4">
          Mode Hors Ligne
        </h1>

        <p className="text-lg text-ivory/70 mb-8">
          Impossible de se connecter à Internet. Certaines fonctionnalités ne sont pas disponibles.
        </p>

        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gold text-night font-semibold hover:bg-gold/90 transition"
        >
          <RefreshCw className="h-5 w-5" />
          Réessayer
        </button>

        <div className="mt-8 p-4 rounded-lg bg-gold/5 border border-gold/20">
          <p className="text-sm text-ivory/60">
            Les données en cache restent consultables. La connexion sera rétablie automatiquement dès que vous serez en ligne.
          </p>
        </div>
      </div>
    </div>
  );
}
