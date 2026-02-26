/**
 * Analytics Component - Client-side only analytics tracking
 *
 * Ce composant initialise le système de tracking analytics.
 * Il est chargé dynamiquement avec ssr: false pour éviter les problèmes SSR.
 *
 * @see /lib/tracking pour l'implémentation complète
 */
'use client';

import { useEffect, useRef } from 'react';

import { initTracker, getTracker } from '@/lib/tracking';

/**
 * Composant Analytics principal
 *
 * Initialise le tracker au montage et gère le nettoyage.
 * Ce composant ne rend rien visuellement.
 *
 * Note: initTracker() is idempotent — the Tracker singleton guards against
 * double-initialization via its own `isInitialized` flag. We intentionally
 * call it on every mount so that:
 *   1. If consent is given between unmount/remount cycles, tracking starts.
 *   2. React StrictMode double-mounts don't break the flow.
 */
export function Analytics() {
  useEffect(() => {
    initTracker({
      debug: process.env.NODE_ENV === 'development',
    });
  }, []);

  return null;
}

/**
 * Composant pour tracker automatiquement les sections de la page d'accueil
 *
 * À placer dans le layout ou les pages principales pour observer
 * automatiquement les sections avec l'attribut data-track-section.
 */
export function SectionTracker() {
  const observedElementsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    /**
     * Finds all [data-track-section] elements in the DOM and registers
     * them with the analytics tracker for visibility / time tracking.
     */
    const observeAllSections = () => {
      const tracker = getTracker();
      const sections = document.querySelectorAll('[data-track-section]');
      const observed: HTMLElement[] = [];

      sections.forEach(section => {
        const element = section as HTMLElement;
        const sectionId = element.dataset.trackSection || element.id;
        if (!sectionId) return;
        const sectionName = element.dataset.trackSectionName || sectionId;

        tracker.observeSection(element, sectionId, sectionName);
        observed.push(element);
      });

      observedElementsRef.current = observed;
    };

    // Initial attempt — works for returning visitors who already have consent.
    const timer = setTimeout(observeAllSections, 100);

    // Listen for deferred consent: on first visit the tracker isn't
    // initialized until the user interacts with the cookie banner.
    // CookieConsentBanner dispatches this event after calling initTracker().
    const onTrackerReady = () => observeAllSections();
    window.addEventListener('kairn:tracker-ready', onTrackerReady);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('kairn:tracker-ready', onTrackerReady);
      // Cleanup: unobserve all tracked sections to prevent memory leaks
      const tracker = getTracker();
      observedElementsRef.current.forEach(element => {
        tracker.unobserveSection(element);
      });
      observedElementsRef.current = [];
    };
  }, []);

  return null;
}

export default Analytics;
