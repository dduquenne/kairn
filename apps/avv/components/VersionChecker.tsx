'use client';

/**
 * VersionChecker wrapper spécifique au site Appréciez Votre Vie.
 *
 * Utilise le composant VersionChecker centralisé de @kairn/ui
 * avec la configuration Appréciez Votre Vie.
 *
 * @module components/VersionChecker
 */

import { VersionChecker as SharedVersionChecker } from '@kairn/ui';

/**
 * VersionChecker pré-configuré pour Appréciez Votre Vie.
 *
 * Vérifie les nouvelles versions toutes les 60 secondes
 * et force un refresh après 5 minutes de détection.
 */
export function VersionChecker() {
  return (
    <SharedVersionChecker
      versionEndpoint="/api/version"
      appName="Appréciez Votre Vie"
      notificationIcon="/favicon.svg"
    />
  );
}
