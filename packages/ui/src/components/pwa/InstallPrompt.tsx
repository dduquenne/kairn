'use client';

/**
 * InstallPrompt Component
 *
 * Invite l'utilisateur à installer la PWA sur son appareil.
 * Gère le cycle de vie complet : détection, proposition, installation.
 *
 * @module components/pwa/InstallPrompt
 */

import { useState, useEffect, type ReactNode } from 'react';

/** Événement beforeinstallprompt du navigateur */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Props du composant InstallPrompt
 */
export interface InstallPromptProps {
  /** Délai avant affichage en ms (défaut: 30000 = 30s) */
  showDelay?: number;
  /** Durée en jours avant de re-proposer après un refus (défaut: 7) */
  dismissCooldownDays?: number;
  /** Clé localStorage pour stocker le refus */
  storageKey?: string;
  /** Fonction de rendu personnalisée */
  children: (props: {
    /** Déclenche l'installation */
    onInstall: () => Promise<void>;
    /** Ferme le prompt */
    onDismiss: () => void;
    /** Indique si l'app est déjà installée */
    isInstalled: boolean;
  }) => ReactNode;
}

/**
 * Composant d'invitation à l'installation PWA.
 *
 * Utilise le pattern render prop pour permettre une UI entièrement
 * personnalisable. Gère le refus avec un cooldown configurable.
 *
 * @example
 * ```tsx
 * <InstallPrompt showDelay={30000}>
 *   {({ onInstall, onDismiss }) => (
 *     <div>
 *       <button onClick={onInstall}>Installer</button>
 *       <button onClick={onDismiss}>Plus tard</button>
 *     </div>
 *   )}
 * </InstallPrompt>
 * ```
 */
export function InstallPrompt({
  showDelay = 30000,
  dismissCooldownDays = 7,
  storageKey = 'pwa_install_dismissed',
  children,
}: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Vérifier le cooldown de refus
    const dismissed = localStorage.getItem(storageKey);
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysSince = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince < dismissCooldownDays) {
        return;
      }
    }

    // Capturer l'événement beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      setTimeout(() => {
        setShowPrompt(true);
      }, showDelay);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const handleInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
    };
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [showDelay, dismissCooldownDays, storageKey]);

  /** Déclenche l'installation via l'API navigateur */
  const handleInstall = async (): Promise<void> => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'dismissed') {
        localStorage.setItem(storageKey, new Date().toISOString());
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error("Erreur lors de l'installation:", error);
    }
  };

  /** Ferme le prompt et enregistre le refus */
  const handleDismiss = (): void => {
    setShowPrompt(false);
    localStorage.setItem(storageKey, new Date().toISOString());
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <>
      {children({
        onInstall: handleInstall,
        onDismiss: handleDismiss,
        isInstalled,
      })}
    </>
  );
}
