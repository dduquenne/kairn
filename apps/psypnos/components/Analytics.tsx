/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Analytics Component - Client-side only analytics tracking
 *
 * Ce composant initialise le système de tracking analytics.
 * Il est chargé dynamiquement avec ssr: false pour éviter les problèmes SSR.
 *
 * Le nouveau système de tracking utilise:
 * - Un tracker singleton avec batching des événements
 * - Une gestion de session robuste
 * - Le tracking automatique des pages, scroll, et temps passé
 * - L'observation des sections via IntersectionObserver
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
    // Éviter la double initialisation en mode strict
    if (initialized.current) return;
    initialized.current = true;

    // Initialiser le tracker
    const tracker = initTracker({
      // Configuration personnalisée si nécessaire
      debug: process.env.NODE_ENV === "development",
    });

    // Cleanup lors du démontage (rarement appelé car composant au niveau layout)
    return () => {
      // Note: On ne détruit pas le tracker car il doit persister
      // pendant toute la durée de vie de la session
    };
  }, []);

  // Ce composant ne rend rien
  return null;
}

/**
 * Composant pour tracker automatiquement les sections de la page d'accueil
 *
 * À placer dans le layout ou les pages principales pour observer
 * automatiquement les sections avec l'attribut data-track-section.
 */
export function SectionTracker() {
  useEffect(() => {
    // Attendre que le tracker soit initialisé
    const timer = setTimeout(() => {
      const tracker = getTracker();

      // Observer toutes les sections avec data-track-section
      const sections = document.querySelectorAll("[data-track-section]");

      sections.forEach((section) => {
        const element = section as HTMLElement;
        // Only track sections with a valid identifier (data-track-section or id)
        const sectionId = element.dataset.trackSection || element.id;
        if (!sectionId) {
          // Skip elements without proper identification - don't track as "unknown"
          return;
        }
        const sectionName = element.dataset.trackSectionName || sectionId;

        tracker.observeSection(element, sectionId, sectionName);
      });

      // Cleanup
      return () => {
        sections.forEach((section) => {
          tracker.unobserveSection(section as HTMLElement);
        });
      };
    }, 100); // Petit délai pour s'assurer que le tracker est prêt

    return () => clearTimeout(timer);
  }, []);

  return null;
}

/**
 * Export par défaut pour compatibilité
 */
export default Analytics;
