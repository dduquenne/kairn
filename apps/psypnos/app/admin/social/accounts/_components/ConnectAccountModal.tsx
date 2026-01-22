"use client";

import { X, ExternalLink, AlertCircle } from "lucide-react";
import { SocialPlatformIcon } from "./SocialPlatformIcon";

interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PlatformOption {
  id: string;
  name: string;
  description: string;
  authUrl: string;
  requirements: string[];
  icon: string;
}

const PLATFORMS: PlatformOption[] = [
  {
    id: "facebook",
    name: "Facebook",
    description: "Publiez sur vos Pages Facebook",
    authUrl: "/api/social/auth/facebook",
    requirements: [
      "Être administrateur d'une Page Facebook",
      "App Facebook configurée avec les permissions pages_manage_posts",
    ],
    icon: "FACEBOOK",
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Publiez sur Instagram Business/Creator",
    authUrl: "/api/social/auth/instagram",
    requirements: [
      "Compte Instagram Business ou Creator",
      "Compte lié à une Page Facebook",
      "Être administrateur de la Page Facebook liée",
    ],
    icon: "INSTAGRAM",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Publiez sur votre profil LinkedIn",
    authUrl: "/api/social/auth/linkedin",
    requirements: [
      "Compte LinkedIn actif",
      "App LinkedIn configurée avec les permissions w_member_social",
    ],
    icon: "LINKEDIN",
  },
  {
    id: "threads",
    name: "Threads",
    description: "Publiez sur votre profil Threads",
    authUrl: "/api/social/auth/threads",
    requirements: [
      "Compte Threads actif",
      "App Meta configurée avec le produit Threads API",
      "Permissions threads_basic et threads_content_publish",
    ],
    icon: "THREADS",
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    description: "Publiez des tweets sur votre compte X",
    authUrl: "/api/social/auth/twitter",
    requirements: [
      "Compte X (Twitter) actif",
      "App Twitter Developer avec OAuth 2.0",
      "Plan Free (1,500 tweets/mois) ou Basic ($100/mois)",
    ],
    icon: "TWITTER",
  },
];

export function ConnectAccountModal({
  isOpen,
  onClose,
}: ConnectAccountModalProps) {
  const handleConnect = (platform: PlatformOption) => {
    window.location.href = platform.authUrl;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-gold/20 bg-gradient-to-br from-night to-night/95 shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gold/10 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-ivory">
              Connecter un compte
            </h3>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-ivory/70 transition hover:bg-gold/10 hover:text-ivory"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-sm text-ivory/60">
            Sélectionnez une plateforme pour connecter votre compte et
            commencer à automatiser vos publications.
          </p>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Platform Options */}
          <div className="space-y-4">
            {PLATFORMS.map((platform) => (
              <div
                key={platform.id}
                className="rounded-lg border border-gold/10 bg-night/50 p-4 transition hover:border-gold/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <SocialPlatformIcon
                      platform={platform.icon}
                      className="h-10 w-10 flex-shrink-0"
                    />
                    <div>
                      <h4 className="font-medium text-ivory">
                        {platform.name}
                      </h4>
                      <p className="mt-1 text-sm text-ivory/60">
                        {platform.description}
                      </p>

                      {/* Requirements */}
                      <div className="mt-3">
                        <p className="flex items-center gap-1 text-xs font-medium text-amber-400">
                          <AlertCircle className="h-3 w-3" />
                          Prérequis
                        </p>
                        <ul className="mt-1 space-y-1">
                          {platform.requirements.map((req, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-ivory/50"
                            >
                              • {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleConnect(platform)}
                    className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-gold/20 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/30"
                  >
                    Connecter
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="mt-6 rounded-lg bg-blue-500/10 p-4">
            <h5 className="flex items-center gap-2 text-sm font-medium text-blue-400">
              <AlertCircle className="h-4 w-4" />
              Sécurité
            </h5>
            <p className="mt-1 text-xs text-blue-400/80">
              Vos tokens d'accès sont chiffrés avec AES-256-GCM avant
              d'être stockés. Nous ne stockons jamais vos mots de passe.
              Vous pouvez révoquer l'accès à tout moment depuis les
              paramètres de sécurité de chaque plateforme.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gold/10 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ivory/70 transition hover:text-ivory"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
