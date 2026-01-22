// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Analytics Wrapper Components
 *
 * Ces composants facilitent l'intégration du système de tracking analytics
 * dans l'application. Ils gèrent le chargement dynamique sans SSR et
 * le tracking automatique des sections.
 */
"use client";

import dynamic from "next/dynamic";
import { ReactNode, useEffect, useRef } from "react";

// Chargement dynamique du composant Analytics (sans SSR pour éviter les erreurs)
const Analytics = dynamic(
  () => import("./Analytics").then((mod) => ({ default: mod.Analytics })),
  { ssr: false }
);

// Chargement dynamique du SectionTracker
const SectionTracker = dynamic(
  () => import("./Analytics").then((mod) => ({ default: mod.SectionTracker })),
  { ssr: false }
);

// ============================================
// Wrapper de page avec Analytics
// ============================================

interface AnalyticsWrapperProps {
  children: ReactNode;
}

/**
 * AnalyticsPageWrapper - Wrapper pour les pages avec tracking automatique
 *
 * Initialise le tracker et observe automatiquement les sections
 * avec l'attribut data-track-section.
 *
 * Usage:
 * ```tsx
 * export default function Page() {
 *   return (
 *     <AnalyticsPageWrapper>
 *       <section data-track-section="hero" data-track-section-name="Section Hero">
 *         ...
 *       </section>
 *     </AnalyticsPageWrapper>
 *   );
 * }
 * ```
 */
export function AnalyticsPageWrapper({ children }: AnalyticsWrapperProps) {
  return (
    <>
      <Analytics />
      <SectionTracker />
      {children}
    </>
  );
}

// ============================================
// Wrapper de section avec tracking
// ============================================

interface SectionAnalyticsProps {
  /** ID unique de la section (utilisé pour l'analytics) */
  sectionId: string;
  /** Nom lisible de la section (affiché dans le dashboard) */
  sectionName?: string;
  /** Contenu de la section */
  children: ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
  /** Tag HTML à utiliser (par défaut: section) */
  as?: keyof JSX.IntrinsicElements;
}

/**
 * SectionAnalytics - Wrapper pour tracker automatiquement une section
 *
 * Ajoute automatiquement les attributs data-track-section et
 * data-track-section-name pour le tracking.
 *
 * Usage:
 * ```tsx
 * <SectionAnalytics sectionId="hero" sectionName="Section Hero">
 *   <h1>Bienvenue</h1>
 * </SectionAnalytics>
 * ```
 */
export function SectionAnalytics({
  sectionId,
  sectionName,
  children,
  className,
  as: Component = "section",
}: SectionAnalyticsProps) {
  return (
    <Component
      data-track-section={sectionId}
      data-track-section-name={sectionName || sectionId}
      className={className}
    >
      {children}
    </Component>
  );
}

// ============================================
// Hook pour observer manuellement une section
// ============================================

/**
 * Hook pour obtenir une ref qui tracke automatiquement une section
 *
 * Usage:
 * ```tsx
 * function MySection() {
 *   const ref = useTrackedSection('my-section', 'Ma Section');
 *   return <section ref={ref}>...</section>;
 * }
 * ```
 */
export function useTrackedSection(sectionId: string, sectionName?: string) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Ajouter les attributs de tracking
    element.dataset.trackSection = sectionId;
    element.dataset.trackSectionName = sectionName || sectionId;

    // Le SectionTracker observera automatiquement cet élément
    // grâce aux attributs data-track-section
  }, [sectionId, sectionName]);

  return ref;
}

// ============================================
// Export par défaut
// ============================================

export default AnalyticsPageWrapper;
