/**
 * Analytics Component - Client-side only analytics tracking
 *
 * Ce composant initialise le système de tracking analytics.
 * Il est chargé dynamiquement avec ssr: false pour éviter les problèmes SSR.
 *
 * @see /lib/tracking pour l'implémentation complète
 */
"use client";

import { useEffect, useRef } from "react";

import { initTracker, getTracker } from "@/lib/tracking";

/**
 * Composant Analytics principal
 *
 * Initialise le tracker au montage et gère le nettoyage.
 * Ce composant ne rend rien visuellement.
 */
export function Analytics() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    initTracker({
      debug: process.env.NODE_ENV === "development",
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
    const timer = setTimeout(() => {
      const tracker = getTracker();
      const sections = document.querySelectorAll("[data-track-section]");
      const observed: HTMLElement[] = [];

      sections.forEach((section) => {
        const element = section as HTMLElement;
        const sectionId = element.dataset.trackSection || element.id;
        if (!sectionId) return;
        const sectionName = element.dataset.trackSectionName || sectionId;

        tracker.observeSection(element, sectionId, sectionName);
        observed.push(element);
      });

      observedElementsRef.current = observed;
    }, 100);

    return () => {
      clearTimeout(timer);
      // Cleanup: unobserve all tracked sections to prevent memory leaks
      const tracker = getTracker();
      observedElementsRef.current.forEach((element) => {
        tracker.unobserveSection(element);
      });
      observedElementsRef.current = [];
    };
  }, []);

  return null;
}

export default Analytics;
