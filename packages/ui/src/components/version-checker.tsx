'use client';

/**
 * VersionChecker Component
 *
 * Vérifie périodiquement si une nouvelle version de l'application est disponible.
 * Quand une nouvelle version est détectée après un déploiement, notifie et
 * optionnellement force le rechargement de la page.
 *
 * Ce composant est headless (ne rend rien visuellement).
 *
 * @module components/version-checker
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Informations de version retournées par l'API
 */
export interface VersionInfo {
  /** Version sémantique de l'application */
  version: string;
  /** Identifiant unique du build */
  buildId: string;
  /** Horodatage du build */
  buildTime: string;
  /** Environnement d'exécution */
  environment: string;
}

/**
 * Props du composant VersionChecker
 */
export interface VersionCheckerProps {
  /** URL de l'endpoint de version (défaut: /api/version) */
  versionEndpoint?: string;
  /** Intervalle de vérification en ms (défaut: 60000 = 1 min) */
  checkInterval?: number;
  /** Délai avant refresh automatique en ms (défaut: 300000 = 5 min) */
  autoRefreshDelay?: number;
  /** Callback appelé quand une nouvelle version est détectée */
  onNewVersion?: (newVersion: VersionInfo, currentVersion: VersionInfo) => void;
  /** Désactiver le refresh automatique (défaut: false) */
  disableAutoRefresh?: boolean;
  /** Désactiver les notifications navigateur (défaut: false) */
  disableNotifications?: boolean;
  /** Icône pour les notifications navigateur */
  notificationIcon?: string;
  /** Nom de l'application pour les notifications */
  appName?: string;
}

/**
 * Composant headless de vérification de version.
 *
 * Vérifie périodiquement l'endpoint de version et détecte les mises à jour.
 * Supporte les notifications navigateur, le refresh automatique, et
 * l'intégration Service Worker.
 *
 * @example
 * ```tsx
 * <VersionChecker
 *   versionEndpoint="/api/version"
 *   onNewVersion={(v) => console.log('New version:', v.version)}
 * />
 * ```
 */
export function VersionChecker({
  versionEndpoint = '/api/version',
  checkInterval = 60 * 1000,
  autoRefreshDelay = 5 * 60 * 1000,
  onNewVersion,
  disableAutoRefresh = false,
  disableNotifications = false,
  notificationIcon = '/favicon.svg',
  appName = 'Application',
}: VersionCheckerProps) {
  const initialVersionRef = useRef<VersionInfo | null>(null);
  const newVersionDetectedRef = useRef(false);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Récupère les informations de version depuis l'API */
  const fetchVersion = useCallback(async (): Promise<VersionInfo | null> => {
    try {
      const cacheBuster = Date.now();
      const response = await fetch(`${versionEndpoint}?_=${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as VersionInfo;
    } catch {
      return null;
    }
  }, [versionEndpoint]);

  /** Gère la détection d'une nouvelle version */
  const handleNewVersionDetected = useCallback(
    (newVersion: VersionInfo) => {
      if (newVersionDetectedRef.current) return;
      newVersionDetectedRef.current = true;

      // Notifier via callback
      if (onNewVersion && initialVersionRef.current) {
        onNewVersion(newVersion, initialVersionRef.current);
      }

      // Planifier un refresh automatique
      if (!disableAutoRefresh) {
        autoRefreshTimeoutRef.current = setTimeout(() => {
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SKIP_WAITING',
            });
          }
          window.location.reload();
        }, autoRefreshDelay);
      }

      // Notifier via Service Worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'NEW_VERSION_AVAILABLE',
          version: newVersion,
        });
      }

      // Notification navigateur
      if (
        !disableNotifications &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification(`${appName} — Nouvelle version disponible`, {
          body: `La version ${newVersion.version} est disponible. La page va se rafraîchir automatiquement.`,
          icon: notificationIcon,
          tag: 'version-update',
        });
      }
    },
    [
      onNewVersion,
      disableAutoRefresh,
      autoRefreshDelay,
      disableNotifications,
      notificationIcon,
      appName,
    ]
  );

  /** Vérifie si une nouvelle version est disponible */
  const checkVersion = useCallback(async () => {
    const currentVersion = await fetchVersion();
    if (!currentVersion) return;

    if (!initialVersionRef.current) {
      initialVersionRef.current = currentVersion;
      return;
    }

    const versionChanged =
      currentVersion.buildId !== initialVersionRef.current.buildId ||
      currentVersion.version !== initialVersionRef.current.version;

    if (versionChanged) {
      handleNewVersionDetected(currentVersion);
    }
  }, [fetchVersion, handleNewVersionDetected]);

  useEffect(() => {
    checkVersion();

    checkIntervalRef.current = setInterval(checkVersion, checkInterval);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleOnline = () => {
      checkVersion();
    };
    window.addEventListener('online', handleOnline);

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'VERSION_UPDATED') {
        checkVersion();
      }
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (autoRefreshTimeoutRef.current) {
        clearTimeout(autoRefreshTimeoutRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [checkVersion, checkInterval]);

  return null;
}
