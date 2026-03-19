'use client';

import { LazyMotion, domAnimation } from 'framer-motion';
import type { ReactNode } from 'react';

interface MotionWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper global pour Framer Motion.
 * Utilise LazyMotion pour réduire la taille du bundle (~50% de framer-motion).
 * Pas de MotionConfig/reducedMotion — chaque composant gère sa propre hydratation
 * via useScrollReveal ou initial={false}.
 */
export function MotionWrapper({ children }: MotionWrapperProps) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
