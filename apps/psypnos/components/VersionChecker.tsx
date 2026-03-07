'use client';

/**
 * VersionChecker wrapper spécifique au site Psypnos.
 *
 * Utilise le composant VersionChecker centralisé de @kairn/ui
 * avec la configuration Psypnos.
 *
 * @module components/VersionChecker
 */

import { VersionChecker as SharedVersionChecker } from '@kairn/ui';

/**
 * VersionChecker pré-configuré pour Psypnos.
 *
 * Vérifie les nouvelles versions toutes les 60 secondes
 * et force un refresh après 5 minutes de détection.
 */
export function VersionChecker() {
  return (
    <SharedVersionChecker
      versionEndpoint="/api/version"
      appName="Psypnos"
      notificationIcon="/favicon.svg"
    />
  );
}
