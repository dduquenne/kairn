'use client';

/**
 * WebVitalsReporter wrapper spécifique au site Appréciez Votre Vie.
 *
 * Utilise le composant WebVitalsReporter centralisé de @kairn/analytics
 * avec l'import dynamique de web-vitals.
 *
 * @module components/WebVitalsReporter
 */

import { WebVitalsReporter as SharedWebVitalsReporter } from '@kairn/analytics';

/**
 * WebVitalsReporter pré-configuré pour Appréciez Votre Vie.
 *
 * Charge web-vitals dynamiquement et envoie les métriques
 * au tracker analytics centralisé.
 */
export function WebVitalsReporter() {
  return (
    <SharedWebVitalsReporter
      webVitalsLoader={() => import('web-vitals')}
      debug={process.env.NODE_ENV === 'development'}
    />
  );
}

export default WebVitalsReporter;
