/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * VersionChecker Component
 *
 * Vérifie périodiquement si une nouvelle version de l'application est disponible.
 * Quand une nouvelle version est détectée après un déploiement, force le rechargement
 * de la page pour que l'utilisateur obtienne la dernière version.
 *
 * Stratégie:
 * 1. Au montage, récupère la version actuelle depuis /api/version
 * 2. Toutes les 60 secondes, vérifie si la version a changé
 * 3. Si changement détecté, affiche une notification et propose un refresh
 * 4. Après un certain délai, force le refresh si l'utilisateur ne l'a pas fait
 */

interface VersionInfo {
  version: string;
  buildId: string;
  buildTime: string;
  environment: string;
}

// Intervalle de vérification en millisecondes (60 secondes)
const CHECK_INTERVAL = 60 * 1000;

// Délai avant le refresh automatique (5 minutes après détection)
const AUTO_REFRESH_DELAY = 5 * 60 * 1000;

export function VersionChecker() {
  const initialVersionRef = useRef<VersionInfo | null>(null);
  const newVersionDetectedRef = useRef(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchVersion = useCallback(async (): Promise<VersionInfo | null> => {
    try {
      // Ajouter un cache-buster pour éviter tout cache
      const cacheBuster = Date.now();
      const response = await fetch(`/api/version?_=${cacheBuster}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch {
      // Silencieux en cas d'erreur (offline, etc.)
      return null;
    }
  }, []);

  const handleNewVersionDetected = useCallback((newVersion: VersionInfo) => {
    if (newVersionDetectedRef.current) return;
    newVersionDetectedRef.current = true;

    console.log(
      `[VersionChecker] Nouvelle version détectée: ${newVersion.version} (build: ${newVersion.buildId})`
    );

    // Planifier un refresh automatique
    autoRefreshTimeoutRef.current = setTimeout(() => {
      console.log("[VersionChecker] Refresh automatique pour mise à jour");
      // Purger le cache du Service Worker avant de recharger
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
      }
      // Forcer un hard reload
      window.location.reload();
    }, AUTO_REFRESH_DELAY);

    // Tenter de notifier via le Service Worker
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "NEW_VERSION_AVAILABLE",
        version: newVersion,
      });
    }

    // Optionnel: Afficher une notification si l'API est disponible et autorisée
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Nouvelle version disponible", {
        body: `La version ${newVersion.version} est disponible. La page va se rafraîchir automatiquement.`,
        icon: "/favicon.svg",
        tag: "version-update",
      });
    }
  }, []);

  const checkVersion = useCallback(async () => {
    const currentVersion = await fetchVersion();
    if (!currentVersion) return;

    // Première vérification : stocker la version initiale
    if (!initialVersionRef.current) {
      initialVersionRef.current = currentVersion;
      console.log(
        `[VersionChecker] Version initiale: ${currentVersion.version} (build: ${currentVersion.buildId})`
      );
      return;
    }

    // Comparer avec la version initiale
    const versionChanged =
      currentVersion.buildId !== initialVersionRef.current.buildId ||
      currentVersion.version !== initialVersionRef.current.version;

    if (versionChanged) {
      handleNewVersionDetected(currentVersion);
    }
  }, [fetchVersion, handleNewVersionDetected]);

  useEffect(() => {
    // Vérification initiale
    checkVersion();

    // Vérification périodique
    checkIntervalRef.current = setInterval(checkVersion, CHECK_INTERVAL);

    // Vérification quand l'onglet redevient visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkVersion();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Vérification quand l'utilisateur revient en ligne
    const handleOnline = () => {
      checkVersion();
    };
    window.addEventListener("online", handleOnline);

    // Écouter les messages du Service Worker
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === "VERSION_UPDATED") {
        checkVersion();
      }
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleSWMessage);
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (autoRefreshTimeoutRef.current) {
        clearTimeout(autoRefreshTimeoutRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleSWMessage);
      }
    };
  }, [checkVersion]);

  // Ce composant ne rend rien visuellement
  return null;
}
