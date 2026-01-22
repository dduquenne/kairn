// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Hook React pour le tracking analytics
 *
 * Ce hook fournit une interface simple pour utiliser le tracker analytics
 * dans les composants React.
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { trackEvent, trackConversion, observeSection, sectionRef } = useTracker();
 *
 *   const handleClick = () => {
 *     trackEvent('CTA', 'click', 'book-appointment');
 *   };
 *
 *   return (
 *     <section ref={sectionRef('hero')}>
 *       <button onClick={handleClick}>Prendre RDV</button>
 *     </section>
 *   );
 * }
 * ```
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { initTracker, getTracker, type ConversionType } from '@/lib/tracking';

// ============================================
// Hook principal
// ============================================

/**
 * Hook principal pour le tracking analytics
 */
export function useTracker() {
  const initialized = useRef(false);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Initialiser le tracker au montage
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const tracker = initTracker();

    // Cleanup
    return () => {
      // Le tracker persiste pour la session, pas besoin de le détruire ici
    };
  }, []);

  /**
   * Track un événement personnalisé
   */
  const trackEvent = useCallback(
    (
      category: string,
      action: string,
      label?: string,
      value?: number,
      metadata?: Record<string, unknown>
    ) => {
      const tracker = getTracker();
      tracker.trackEvent(category, action, label, value, metadata);
    },
    []
  );

  /**
   * Track une conversion
   */
  const trackConversion = useCallback(
    (
      type: ConversionType,
      stepName: string,
      stepOrder: number,
      completed: boolean,
      value?: number,
      metadata?: Record<string, unknown>
    ) => {
      const tracker = getTracker();
      tracker.trackConversion(type, stepName, stepOrder, completed, value, metadata);
    },
    []
  );

  /**
   * Observe une section manuellement
   */
  const observeSection = useCallback(
    (element: HTMLElement | null, sectionId: string, sectionName?: string) => {
      if (!element) return;

      const tracker = getTracker();
      tracker.observeSection(element, sectionId, sectionName);

      // Stocker la référence pour le cleanup
      sectionRefs.current.set(sectionId, element);
    },
    []
  );

  /**
   * Crée une fonction ref pour une section
   * Usage: <section ref={sectionRef('hero', 'Section Hero')}>
   */
  const sectionRef = useCallback(
    (sectionId: string, sectionName?: string) => {
      return (element: HTMLElement | null) => {
        if (element) {
          observeSection(element, sectionId, sectionName);
        } else {
          // Cleanup si l'élément est démonté
          const prevElement = sectionRefs.current.get(sectionId);
          if (prevElement) {
            const tracker = getTracker();
            tracker.unobserveSection(prevElement);
            sectionRefs.current.delete(sectionId);
          }
        }
      };
    },
    [observeSection]
  );

  /**
   * Force l'envoi des événements en attente
   */
  const flush = useCallback(() => {
    const tracker = getTracker();
    return tracker.flush();
  }, []);

  /**
   * Track un clic sur un CTA
   */
  const trackCtaClick = useCallback(
    (ctaName: string, ctaLocation?: string) => {
      trackEvent('CTA', 'click', ctaName, undefined, { location: ctaLocation });
    },
    [trackEvent]
  );

  /**
   * Track un clic sur un lien externe
   */
  const trackExternalLink = useCallback(
    (url: string, linkText?: string) => {
      trackEvent('Outbound', 'click', url, undefined, { text: linkText });
    },
    [trackEvent]
  );

  /**
   * Track le début de remplissage d'un formulaire
   */
  const trackFormStart = useCallback(
    (formName: string) => {
      trackEvent('Form', 'start', formName);
    },
    [trackEvent]
  );

  /**
   * Track la soumission d'un formulaire
   */
  const trackFormSubmit = useCallback(
    (formName: string, success: boolean) => {
      trackEvent('Form', success ? 'submit_success' : 'submit_error', formName, success ? 1 : 0);
    },
    [trackEvent]
  );

  /**
   * Track une lecture de vidéo
   */
  const trackVideoPlay = useCallback(
    (videoId: string, videoTitle?: string) => {
      trackEvent('Video', 'play', videoTitle || videoId, undefined, { videoId });
    },
    [trackEvent]
  );

  /**
   * Track la fin d'une vidéo
   */
  const trackVideoComplete = useCallback(
    (videoId: string, duration: number) => {
      trackEvent('Video', 'complete', videoId, Math.round(duration), { duration });
    },
    [trackEvent]
  );

  /**
   * Track un téléchargement
   */
  const trackDownload = useCallback(
    (fileName: string, fileType?: string) => {
      trackEvent('Download', 'click', fileName, undefined, { type: fileType });
    },
    [trackEvent]
  );

  /**
   * Track un partage social
   */
  const trackShare = useCallback(
    (platform: string, contentType?: string) => {
      trackEvent('Share', platform, contentType);
    },
    [trackEvent]
  );

  /**
   * Track une recherche
   */
  const trackSearch = useCallback(
    (query: string, resultsCount?: number) => {
      trackEvent('Search', 'query', query, resultsCount);
    },
    [trackEvent]
  );

  return {
    // Fonctions de base
    trackEvent,
    trackConversion,
    observeSection,
    sectionRef,
    flush,

    // Raccourcis pratiques
    trackCtaClick,
    trackExternalLink,
    trackFormStart,
    trackFormSubmit,
    trackVideoPlay,
    trackVideoComplete,
    trackDownload,
    trackShare,
    trackSearch,
  };
}

// ============================================
// Hook pour le tracking de page
// ============================================

/**
 * Hook pour tracker automatiquement les pages
 * À utiliser dans le layout ou le composant de page
 */
export function usePageTracking() {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    // Le tracker gère automatiquement le tracking de page
    initTracker();
  }, []);
}

// ============================================
// Hook pour les sections
// ============================================

/**
 * Hook pour tracker une section spécifique
 */
export function useSectionTracking(sectionId: string, sectionName?: string) {
  const ref = useRef<HTMLElement>(null);
  const { observeSection } = useTracker();

  useEffect(() => {
    const element = ref.current;
    if (element) {
      observeSection(element, sectionId, sectionName);
    }

    return () => {
      if (element) {
        const tracker = getTracker();
        tracker.unobserveSection(element);
      }
    };
  }, [sectionId, sectionName, observeSection]);

  return ref;
}

// ============================================
// Hook pour les conversions
// ============================================

/**
 * Hook pour tracker un funnel de conversion
 */
export function useConversionFunnel(funnelType: ConversionType) {
  const { trackConversion } = useTracker();
  const currentStep = useRef(0);

  const trackStep = useCallback(
    (stepName: string, completed: boolean = false, value?: number, metadata?: Record<string, unknown>) => {
      currentStep.current++;
      trackConversion(funnelType, stepName, currentStep.current, completed, value, metadata);
    },
    [funnelType, trackConversion]
  );

  const reset = useCallback(() => {
    currentStep.current = 0;
  }, []);

  return { trackStep, reset };
}

// ============================================
// Export par défaut
// ============================================

export default useTracker;
