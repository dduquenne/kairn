'use client';

/**
 * WebVitalsReporter wrapper spécifique au site Psypnos.
 *
 * Utilise le composant WebVitalsReporter centralisé de @kairn/analytics
 * avec l'import dynamique de web-vitals.
 *
 * @module components/WebVitalsReporter
 */

import { WebVitalsReporter as SharedWebVitalsReporter } from '@kairn/analytics';

/**
 * WebVitalsReporter pré-configuré pour Psypnos.
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
