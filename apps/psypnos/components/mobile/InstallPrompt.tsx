// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    // Guard pour éviter les erreurs SSR
    if (typeof window === 'undefined') return;

    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Vérifier si déjà refusé
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysSince = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

      // Ne pas montrer pendant 7 jours après refus
      if (daysSince < 7) {
        return;
      }
    }

    // Capturer l'événement beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Attendre 30 secondes avant de montrer le prompt
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Détecter l'installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      console.log('✅ PWA installée avec succès');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('✅ Installation acceptée');
      } else {
        console.log('❌ Installation refusée');
        localStorage.setItem('pwa_install_dismissed', new Date().toISOString());
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_install_dismissed', new Date().toISOString());
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-24 left-4 right-4 z-40"
      >
        <div className="bg-gold/95 backdrop-blur-lg border border-gold rounded-xl p-4 shadow-2xl">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-lg hover:bg-black/20 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4 text-night" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="shrink-0 bg-night/20 p-3 rounded-lg">
              <Download className="h-6 w-6 text-night" />
            </div>

            <div className="flex-1">
              <h3 className="text-night font-bold text-base mb-1">
                Installer Psypnos Analytics
              </h3>
              <p className="text-night/80 text-sm mb-3">
                Accédez rapidement à vos statistiques depuis votre écran d'accueil
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-night text-gold font-semibold py-2 px-4 rounded-lg hover:bg-night/90 transition-colors"
                >
                  Installer
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 bg-night/20 text-night font-medium py-2 px-4 rounded-lg hover:bg-night/30 transition-colors"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
