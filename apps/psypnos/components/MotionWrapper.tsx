"use client";

/**
 * MotionWrapper - Composant wrapper pour Framer Motion qui évite les erreurs d'hydratation
 *
 * Le problème: Framer Motion génère des attributs style dynamiques côté client
 * qui peuvent différer du rendu serveur, causant des erreurs d'hydratation.
 *
 * La solution: Ce wrapper désactive les animations pendant le premier rendu client
 * (qui doit matcher le rendu serveur), puis les active après l'hydratation.
 */

import { ReactNode, useEffect, useState } from "react";
import { LazyMotion, domAnimation, MotionConfig } from "framer-motion";

interface MotionWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper global pour Framer Motion qui:
 * 1. Utilise LazyMotion pour réduire la taille du bundle
 * 2. Désactive les animations pendant l'hydratation initiale
 * 3. Active les animations une fois l'hydratation terminée
 */
export function MotionWrapper({ children }: MotionWrapperProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Marquer comme hydraté après le premier rendu client
    setIsHydrated(true);
  }, []);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig
        // Désactiver les animations pendant l'hydratation pour éviter les mismatches
        reducedMotion={isHydrated ? "never" : "always"}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

/**
 * Hook pour savoir si le composant est hydraté
 * Utile pour les composants qui doivent rendre différemment pendant SSR
 */
export function useIsHydrated(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Composant qui ne rend son contenu qu'après l'hydratation
 * Utile pour les composants purement client-side comme les animations complexes
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const isHydrated = useIsHydrated();

  if (!isHydrated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
