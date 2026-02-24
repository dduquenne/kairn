"use client";

import { useState, useEffect } from "react";

import {
  getConsentLevel,
  setConsentLevel,
  initTracker,
  type ConsentLevel,
} from "@/lib/tracking";

/**
 * Bannière de consentement cookies RGPD.
 *
 * S'affiche uniquement si aucun consentement n'a encore été donné
 * (cookie `kairn_consent` absent). Après le choix de l'utilisateur,
 * le tracker analytics est (ré)initialisé pour commencer le suivi.
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const level = getConsentLevel();
    if (!level) {
      setVisible(true);
    }
  }, []);

  const handleConsent = (level: ConsentLevel) => {
    setConsentLevel(level);
    setVisible(false);

    // (Re)initialize the tracker now that consent is given.
    // The first call in <Analytics /> bailed out because the cookie
    // didn't exist yet; the singleton's isInitialized is still false
    // so this second call will proceed normally.
    initTracker();
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies et du suivi"
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-gold/20 bg-night/95 backdrop-blur-xl px-4 py-4 shadow-[0_-4px_24px_rgba(0,0,0,0.4)] sm:px-6"
    >
      <div className="mx-auto max-w-4xl">
        <p className="mb-3 text-sm leading-relaxed text-ivory/80">
          Ce site utilise des cookies pour mesurer l&apos;audience et améliorer
          votre expérience. Vous pouvez choisir le niveau de suivi que vous
          acceptez.{" "}
          <a
            href="/politique-de-confidentialite"
            className="text-gold underline hover:text-gold/80 transition-colors"
          >
            Politique de confidentialité
          </a>
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleConsent("essential")}
            className="rounded-lg border border-ivory/20 bg-transparent px-4 py-2 text-sm text-ivory hover:bg-ivory/10 transition-colors"
          >
            Essentiel uniquement
          </button>
          <button
            onClick={() => handleConsent("analytics")}
            className="rounded-lg border border-gold bg-gold px-4 py-2 text-sm font-medium text-night hover:bg-gold/90 transition-colors"
          >
            Accepter les statistiques
          </button>
          <button
            onClick={() => handleConsent("marketing")}
            className="rounded-lg border border-ivory/20 bg-transparent px-4 py-2 text-sm text-ivory hover:bg-ivory/10 transition-colors"
          >
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
}
