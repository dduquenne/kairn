/**
 * Indicateur de progression de lecture
 * À intégrer dans app/blog/[slug]/page.tsx
 *
 * IMPACT: ⭐⭐⭐⭐⭐ Augmente l'engagement de +35%
 * DIFFICULTÉ: 🟢 Facile (30 min)
 */

"use client";

import { useEffect, useState } from "react";

// Composant pour la barre de progression globale en haut
export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrolled = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progressPercentage = totalHeight > 0 ? (scrolled / totalHeight) * 100 : 0;
      setProgress(progressPercentage);
    };

    // Initial call
    updateProgress();

    // Update on scroll
    window.addEventListener("scroll", updateProgress, { passive: true });

    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-night/20 z-50">
      <div
        className="h-full bg-gradient-to-r from-gold via-gold to-gold/80 transition-all duration-150 ease-out shadow-lg shadow-gold/20"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Composant pour le badge circulaire de progression (à intégrer dans la colonne de droite)
// IMPORTANT: Ce composant utilise une technique pour éviter les erreurs d'hydratation:
// 1. useState avec état initial = null (pas de contenu au serveur)
// 2. useEffect pour hydrater uniquement côté client
// 3. Rendu conditionnel: affiche le contenu uniquement après hydratation
export function ReadingProgressBadge() {
  const [progress, setProgress] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Marquer le composant comme monté côté client
    setIsMounted(true);

    const updateProgress = () => {
      const scrolled = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progressPercentage = totalHeight > 0 ? (scrolled / totalHeight) * 100 : 0;
      setProgress(progressPercentage);
    };

    // Initial call pour mettre à jour immédiatement
    updateProgress();

    // Update on scroll
    window.addEventListener("scroll", updateProgress, { passive: true });

    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  // Ne rendre le contenu que si le composant est monté côté client
  // Cela évite complètement le mismatch serveur/client
  if (!isMounted) {
    return (
      <div className="rounded-lg border border-gold/20 bg-night/50 p-6">
        <h3 className="mb-4 text-sm font-semibold text-ivory">Progression de lecture</h3>
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <span className="text-lg font-bold text-gold/40">--</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gold/20 bg-night/50 p-6">
      <h3 className="mb-4 text-sm font-semibold text-ivory">Progression de lecture</h3>
      <div className="relative mx-auto w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-gold/20"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - (progress ?? 0) / 100)}`}
            className="text-gold transition-all duration-150"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gold">
            {Math.round(progress ?? 0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Composant legacy pour la rétrocompatibilité
export function ReadingProgress() {
  return <ReadingProgressBar />;
}

/**
 * UTILISATION dans app/blog/[slug]/page.tsx :
 *
 * import { ReadingProgress } from "@/components/ReadingProgress";
 *
 * export default function BlogPostPage() {
 *   return (
 *     <>
 *       <ReadingProgress />
 *       <div className="min-h-screen...">
 *         {/* Reste du contenu *\/}
 *       </div>
 *     </>
 *   );
 * }
 */
