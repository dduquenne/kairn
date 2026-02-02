"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Settings,
  ChevronRight,
  ChevronLeft,
  Shield,
  Zap,
  Link2,
  X,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/lib/toast-context";

interface SocialAccount {
  id: string;
  platform: string;
  accountId?: string;
  accountName: string;
  tokenExpiry?: string | null;
  scope?: string[];
  isActive: boolean;
  lastUsed?: string | null;
  createdAt?: string;
  updatedAt?: string;
  metadata?: {
    pageId?: string;
    pageName?: string;
    igUsername?: string;
    personId?: string;
    avatarUrl?: string;
  };
}

interface SocialNetworksTabProps {
  accounts: SocialAccount[];
  onRefresh: () => void;
}

interface PlatformConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  authUrl: string;
  icon: string;
  requirements: string[];
  setupSteps: {
    title: string;
    description: string;
    tip?: string;
  }[];
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "facebook",
    name: "Facebook",
    description: "Publiez sur vos Pages Facebook",
    color: "text-[#1877F2]",
    bgColor: "bg-[#1877F2]/10",
    borderColor: "border-[#1877F2]/30",
    authUrl: "/api/social/auth/facebook",
    icon: "FACEBOOK",
    requirements: [
      "Être administrateur d'une Page Facebook",
      "Application Facebook configurée",
    ],
    setupSteps: [
      {
        title: "Créer une application Facebook",
        description: "Rendez-vous sur developers.facebook.com et créez une nouvelle application de type 'Business'.",
        tip: "Choisissez 'Business' comme type d'application pour accéder aux API de publication.",
      },
      {
        title: "Configurer les permissions",
        description: "Ajoutez les permissions 'pages_manage_posts' et 'pages_read_engagement' à votre application.",
        tip: "Ces permissions permettent de publier du contenu et de lire les statistiques.",
      },
      {
        title: "Configurer l'URI de redirection",
        description: "Ajoutez l'URI de callback dans les paramètres OAuth de votre application Facebook.",
        tip: "L'URI doit correspondre exactement à celle configurée dans Kairn.",
      },
      {
        title: "Connecter votre compte",
        description: "Cliquez sur 'Connecter' pour autoriser Kairn à publier sur vos pages Facebook.",
      },
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Publiez sur Instagram Business/Creator",
    color: "text-[#E4405F]",
    bgColor: "bg-[#E4405F]/10",
    borderColor: "border-[#E4405F]/30",
    authUrl: "/api/social/auth/instagram",
    icon: "INSTAGRAM",
    requirements: [
      "Compte Instagram Business ou Creator",
      "Compte lié à une Page Facebook",
      "Être administrateur de la Page liée",
    ],
    setupSteps: [
      {
        title: "Convertir en compte professionnel",
        description: "Transformez votre compte Instagram personnel en compte Business ou Creator dans les paramètres.",
        tip: "Allez dans Paramètres > Compte > Passer à un compte professionnel.",
      },
      {
        title: "Lier à une Page Facebook",
        description: "Connectez votre compte Instagram à une Page Facebook dont vous êtes administrateur.",
        tip: "Cette liaison est obligatoire pour utiliser l'API Instagram.",
      },
      {
        title: "Vérifier les permissions Facebook",
        description: "Assurez-vous que l'application Facebook a les permissions Instagram nécessaires.",
        tip: "Ajoutez 'instagram_basic' et 'instagram_content_publish' à votre app.",
      },
      {
        title: "Connecter votre compte",
        description: "Cliquez sur 'Connecter' pour autoriser Kairn à publier sur Instagram.",
      },
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Publiez sur votre profil LinkedIn",
    color: "text-[#0A66C2]",
    bgColor: "bg-[#0A66C2]/10",
    borderColor: "border-[#0A66C2]/30",
    authUrl: "/api/social/auth/linkedin",
    icon: "LINKEDIN",
    requirements: [
      "Compte LinkedIn actif",
      "Application LinkedIn Developer",
    ],
    setupSteps: [
      {
        title: "Créer une application LinkedIn",
        description: "Rendez-vous sur linkedin.com/developers et créez une nouvelle application.",
        tip: "Vous aurez besoin d'une Page LinkedIn pour créer l'application.",
      },
      {
        title: "Demander l'accès aux produits",
        description: "Demandez l'accès au produit 'Share on LinkedIn' dans l'onglet Products.",
        tip: "L'approbation peut prendre quelques jours.",
      },
      {
        title: "Configurer OAuth 2.0",
        description: "Ajoutez les scopes 'w_member_social' et 'r_liteprofile' puis configurez l'URI de redirection.",
        tip: "Copiez l'URI exacte depuis les paramètres de Kairn.",
      },
      {
        title: "Connecter votre compte",
        description: "Cliquez sur 'Connecter' pour autoriser Kairn à publier sur LinkedIn.",
      },
    ],
  },
  {
    id: "threads",
    name: "Threads",
    description: "Publiez sur votre profil Threads",
    color: "text-ivory",
    bgColor: "bg-ivory/10",
    borderColor: "border-ivory/30",
    authUrl: "/api/social/auth/threads",
    icon: "THREADS",
    requirements: [
      "Compte Threads actif",
      "Application Meta avec Threads API",
    ],
    setupSteps: [
      {
        title: "Configurer l'application Meta",
        description: "Dans votre application Meta, ajoutez le produit 'Threads API' depuis le tableau de bord.",
        tip: "Threads API est un produit séparé de l'API Instagram.",
      },
      {
        title: "Demander les permissions",
        description: "Ajoutez les permissions 'threads_basic' et 'threads_content_publish'.",
        tip: "Ces permissions permettent de lire et publier du contenu.",
      },
      {
        title: "Configurer l'URI de redirection",
        description: "Ajoutez l'URI de callback Threads dans les paramètres OAuth.",
        tip: "Utilisez une URI différente de celle de Facebook/Instagram.",
      },
      {
        title: "Connecter votre compte",
        description: "Cliquez sur 'Connecter' pour autoriser Kairn à publier sur Threads.",
      },
    ],
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    description: "Publiez des tweets sur votre compte X",
    color: "text-ivory",
    bgColor: "bg-ivory/10",
    borderColor: "border-ivory/30",
    authUrl: "/api/social/auth/twitter",
    icon: "TWITTER",
    requirements: [
      "Compte X (Twitter) actif",
      "Application Twitter Developer",
      "Plan Free ou Basic",
    ],
    setupSteps: [
      {
        title: "Créer un projet Developer",
        description: "Rendez-vous sur developer.twitter.com et créez un nouveau projet.",
        tip: "Le plan gratuit permet 1500 tweets/mois.",
      },
      {
        title: "Configurer OAuth 2.0",
        description: "Activez OAuth 2.0 dans les paramètres d'authentification de votre application.",
        tip: "Choisissez 'Web App' comme type d'application.",
      },
      {
        title: "Ajouter les permissions",
        description: "Configurez les scopes 'tweet.read', 'tweet.write' et 'users.read'.",
        tip: "Ces permissions sont nécessaires pour publier et lire les tweets.",
      },
      {
        title: "Connecter votre compte",
        description: "Cliquez sur 'Connecter' pour autoriser Kairn à publier sur X.",
      },
    ],
  },
];

export function SocialNetworksTab({ accounts, onRefresh }: SocialNetworksTabProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [refreshingAccount, setRefreshingAccount] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<SocialAccount | null>(null);
  const { addToast } = useToast();

  const activeAccounts = accounts.filter((a) => a.isActive).length;

  const handleStartWizard = (platform: PlatformConfig) => {
    setSelectedPlatform(platform);
    setCurrentStep(0);
    setShowWizard(true);
  };

  const handleConnect = () => {
    if (selectedPlatform) {
      window.location.href = selectedPlatform.authUrl;
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletingAccount) return;

    try {
      const response = await fetch(`/api/social/accounts/${deletingAccount.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        addToast({
          title: "Compte déconnecté",
          description: `${deletingAccount.accountName} a été supprimé`,
          variant: "success",
        });
        setDeletingAccount(null);
        onRefresh();
      } else {
        throw new Error("Échec de la suppression");
      }
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Impossible de supprimer le compte",
        variant: "error",
      });
    }
  };

  const handleRefreshToken = async (account: SocialAccount) => {
    setRefreshingAccount(account.id);
    try {
      const response = await fetch(`/api/social/accounts/${account.id}/refresh`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        addToast({
          title: "Token rafraîchi",
          description: data.message,
          variant: "success",
        });
        onRefresh();
      } else {
        addToast({
          title: "Échec du rafraîchissement",
          description: data.message,
          variant: "error",
        });
      }
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Impossible de rafraîchir le token",
        variant: "error",
      });
    } finally {
      setRefreshingAccount(null);
    }
  };

  const handleToggleActive = async (account: SocialAccount) => {
    try {
      const response = await fetch(`/api/social/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !account.isActive }),
      });

      if (response.ok) {
        addToast({
          title: account.isActive ? "Compte désactivé" : "Compte activé",
          variant: "success",
        });
        onRefresh();
      }
    } catch (error) {
      addToast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "error",
      });
    }
  };

  const isTokenExpiringSoon = (tokenExpiry: string | null | undefined): boolean => {
    if (!tokenExpiry) return false;
    const expiryDate = new Date(tokenExpiry);
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return expiryDate < sevenDaysFromNow;
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "Jamais";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getConnectedPlatforms = () => {
    return accounts.map((a) => a.platform.toLowerCase());
  };

  const connectedPlatforms = getConnectedPlatforms();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ivory">Connexion aux réseaux sociaux</h2>
          <p className="text-sm text-ivory/60">
            {accounts.length} compte{accounts.length !== 1 ? "s" : ""} connecté{accounts.length !== 1 ? "s" : ""}, {activeAccounts} actif{activeAccounts !== 1 ? "s" : ""}
          </p>
        </div>

        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-600"
        >
          <Plus className="h-4 w-4" />
          <span>Connecter un compte</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <Link2 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ivory">{accounts.length}</p>
              <p className="text-xs text-ivory/50">Connectés</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ivory">{activeAccounts}</p>
              <p className="text-xs text-ivory/50">Actifs</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
              <AlertCircle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ivory">
                {accounts.filter((a) => isTokenExpiringSoon(a.tokenExpiry)).length}
              </p>
              <p className="text-xs text-ivory/50">Expirent bientôt</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
              <Zap className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ivory">{PLATFORMS.length - connectedPlatforms.length}</p>
              <p className="text-xs text-ivory/50">Disponibles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      {accounts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ivory/20 bg-night/40 py-16"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10">
            <Link2 className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-ivory">Aucun compte connecté</h3>
          <p className="mt-2 text-center text-sm text-ivory/60 max-w-md">
            Connectez vos comptes de réseaux sociaux pour automatiser la publication de vos contenus
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="mt-6 flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            Connecter un compte
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between rounded-2xl border border-gold/10 bg-night/40 p-4 transition hover:border-gold/20"
            >
              <div className="flex items-center gap-4">
                <SocialPlatformIcon
                  platform={account.platform}
                  className="h-12 w-12"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ivory">{account.accountName}</span>
                    {account.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                        <AlertCircle className="h-3 w-3" />
                        Inactif
                      </span>
                    )}
                    {isTokenExpiringSoon(account.tokenExpiry) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        Expire bientôt
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-ivory/50">
                    <span className="capitalize">{account.platform.toLowerCase()}</span>
                    <span>•</span>
                    <span>Dernière utilisation: {formatDate(account.lastUsed)}</span>
                    {account.tokenExpiry && (
                      <>
                        <span>•</span>
                        <span>Expire: {formatDate(account.tokenExpiry)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(account)}
                  className="rounded-lg p-2 text-ivory/70 transition hover:bg-gold/10 hover:text-ivory"
                  title={account.isActive ? "Désactiver" : "Activer"}
                >
                  <Settings className="h-4 w-4" />
                </button>

                {account.platform === "LINKEDIN" && (
                  <button
                    onClick={() => handleRefreshToken(account)}
                    disabled={refreshingAccount === account.id}
                    className="rounded-lg p-2 text-ivory/70 transition hover:bg-gold/10 hover:text-ivory disabled:opacity-50"
                    title="Rafraîchir le token"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshingAccount === account.id ? "animate-spin" : ""}`}
                    />
                  </button>
                )}

                <button
                  onClick={() => setDeletingAccount(account)}
                  className="rounded-lg p-2 text-ivory/70 transition hover:bg-red-500/10 hover:text-red-400"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Available Platforms */}
      <div className="rounded-2xl border border-ivory/10 bg-night/40 p-6">
        <h3 className="mb-4 text-sm font-semibold text-ivory/70">
          Plateformes disponibles
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((platform) => {
            const isConnected = connectedPlatforms.includes(platform.id);
            return (
              <motion.button
                key={platform.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStartWizard(platform)}
                disabled={isConnected}
                className={`group flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                  isConnected
                    ? "border-green-500/30 bg-green-500/5 cursor-default"
                    : `${platform.borderColor} ${platform.bgColor} hover:bg-opacity-20`
                }`}
              >
                <SocialPlatformIcon
                  platform={platform.icon}
                  className="h-10 w-10 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${isConnected ? "text-green-400" : "text-ivory"}`}>
                      {platform.name}
                    </p>
                    {isConnected && (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ivory/50 truncate">
                    {platform.description}
                  </p>
                </div>
                {!isConnected && (
                  <ChevronRight className="h-5 w-5 text-ivory/30 transition-transform group-hover:translate-x-1" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Security Info */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-400">Sécurité des connexions</h3>
            <ul className="mt-2 space-y-1 text-sm text-blue-400/80">
              <li>• Vos tokens d'accès sont chiffrés avec AES-256-GCM</li>
              <li>• Nous ne stockons jamais vos mots de passe</li>
              <li>• Vous pouvez révoquer l'accès à tout moment depuis les paramètres de chaque plateforme</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Connection Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <ConnectionWizard
            platforms={PLATFORMS}
            selectedPlatform={selectedPlatform}
            currentStep={currentStep}
            connectedPlatforms={connectedPlatforms}
            onSelectPlatform={setSelectedPlatform}
            onSetStep={setCurrentStep}
            onConnect={handleConnect}
            onClose={() => {
              setShowWizard(false);
              setSelectedPlatform(null);
              setCurrentStep(0);
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deletingAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-gold/20 bg-night p-6"
            >
              <h3 className="text-lg font-semibold text-ivory">Déconnecter le compte</h3>
              <p className="mt-2 text-sm text-ivory/60">
                Êtes-vous sûr de vouloir déconnecter <span className="font-medium text-ivory">{deletingAccount.accountName}</span> ?
                Les posts programmés ne seront plus publiés sur cette plateforme.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeletingAccount(null)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-ivory/70 transition hover:text-ivory"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
                >
                  Déconnecter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ConnectionWizardProps {
  platforms: PlatformConfig[];
  selectedPlatform: PlatformConfig | null;
  currentStep: number;
  connectedPlatforms: string[];
  onSelectPlatform: (platform: PlatformConfig | null) => void;
  onSetStep: (step: number) => void;
  onConnect: () => void;
  onClose: () => void;
}

function ConnectionWizard({
  platforms,
  selectedPlatform,
  currentStep,
  connectedPlatforms,
  onSelectPlatform,
  onSetStep,
  onConnect,
  onClose,
}: ConnectionWizardProps) {
  const totalSteps = selectedPlatform ? selectedPlatform.setupSteps.length : 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-gold/20 bg-gradient-to-br from-night to-night/95 shadow-xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gold/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedPlatform && (
                <button
                  onClick={() => {
                    onSelectPlatform(null);
                    onSetStep(0);
                  }}
                  className="rounded-lg p-2 text-ivory/70 transition hover:bg-gold/10 hover:text-ivory"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <div>
                <h3 className="text-xl font-semibold text-ivory">
                  {selectedPlatform ? `Connecter ${selectedPlatform.name}` : "Connecter un compte"}
                </h3>
                {selectedPlatform && (
                  <p className="mt-1 text-sm text-ivory/60">
                    Étape {currentStep + 1} sur {totalSteps}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-ivory/70 transition hover:bg-gold/10 hover:text-ivory"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Bar */}
          {selectedPlatform && (
            <div className="mt-4 h-1.5 rounded-full bg-ivory/10 overflow-hidden">
              <motion.div
                className="h-full bg-gold rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedPlatform ? (
            // Platform Selection
            <div className="space-y-4">
              <p className="text-sm text-ivory/60">
                Sélectionnez une plateforme pour commencer la configuration guidée.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {platforms.map((platform) => {
                  const isConnected = connectedPlatforms.includes(platform.id);
                  return (
                    <motion.button
                      key={platform.id}
                      whileHover={{ scale: isConnected ? 1 : 1.02 }}
                      whileTap={{ scale: isConnected ? 1 : 0.98 }}
                      onClick={() => !isConnected && onSelectPlatform(platform)}
                      disabled={isConnected}
                      className={`relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                        isConnected
                          ? "border-green-500/30 bg-green-500/5 cursor-default"
                          : `${platform.borderColor} ${platform.bgColor} hover:bg-opacity-20`
                      }`}
                    >
                      <SocialPlatformIcon
                        platform={platform.icon}
                        className="h-12 w-12 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold ${isConnected ? "text-green-400" : "text-ivory"}`}>
                            {platform.name}
                          </p>
                          {isConnected && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                              <CheckCircle className="h-3 w-3" />
                              Connecté
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-ivory/60">{platform.description}</p>
                        <div className="mt-3">
                          <p className="text-xs font-medium text-amber-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Prérequis
                          </p>
                          <ul className="mt-1 space-y-0.5">
                            {platform.requirements.map((req, idx) => (
                              <li key={idx} className="text-xs text-ivory/50">
                                • {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {!isConnected && (
                        <ChevronRight className="h-5 w-5 text-ivory/30 flex-shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ) : (
            // Step-by-step Guide
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {(() => {
                  const currentStepData = selectedPlatform.setupSteps[currentStep];
                  if (!currentStepData) return null;
                  return (
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${selectedPlatform.bgColor}`}>
                        <span className={`text-xl font-bold ${selectedPlatform.color}`}>
                          {currentStep + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-ivory">
                          {currentStepData.title}
                        </h4>
                        <p className="mt-2 text-sm text-ivory/70">
                          {currentStepData.description}
                        </p>
                        {currentStepData.tip && (
                          <div className="mt-4 flex items-start gap-3 rounded-xl bg-gold/10 p-4">
                            <Sparkles className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gold">
                              {currentStepData.tip}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Step Indicators */}
                <div className="flex justify-center gap-2">
                  {selectedPlatform.setupSteps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSetStep(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentStep
                          ? "w-8 bg-gold"
                          : idx < currentStep
                          ? "w-2 bg-gold/50"
                          : "w-2 bg-ivory/20"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gold/10 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-ivory/70 transition hover:text-ivory"
            >
              Annuler
            </button>
            {selectedPlatform && (
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={() => onSetStep(currentStep - 1)}
                    className="flex items-center gap-2 rounded-lg border border-ivory/20 px-4 py-2 text-sm font-medium text-ivory transition hover:bg-ivory/5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </button>
                )}
                {isLastStep ? (
                  <button
                    onClick={onConnect}
                    className={`flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium text-white transition ${
                      selectedPlatform.id === "facebook" ? "bg-[#1877F2] hover:bg-[#1877F2]/90" :
                      selectedPlatform.id === "instagram" ? "bg-[#E4405F] hover:bg-[#E4405F]/90" :
                      selectedPlatform.id === "linkedin" ? "bg-[#0A66C2] hover:bg-[#0A66C2]/90" :
                      "bg-gold hover:bg-gold/90 text-night"
                    }`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Connecter {selectedPlatform.name}
                  </button>
                ) : (
                  <button
                    onClick={() => onSetStep(currentStep + 1)}
                    className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-night transition hover:bg-gold/90"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Social Platform Icon Component
function SocialPlatformIcon({
  platform,
  className = "h-6 w-6",
}: {
  platform: string;
  className?: string;
}) {
  const iconProps = {
    className,
    fill: "currentColor",
    viewBox: "0 0 24 24",
  };

  switch (platform.toUpperCase()) {
    case "FACEBOOK":
      return (
        <svg {...iconProps} className={`${className} text-[#1877F2]`}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );

    case "LINKEDIN":
      return (
        <svg {...iconProps} className={`${className} text-[#0A66C2]`}>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );

    case "INSTAGRAM":
      return (
        <svg {...iconProps} className={`${className} text-[#E4405F]`}>
          <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
        </svg>
      );

    case "TWITTER":
      return (
        <svg {...iconProps} className={`${className} text-ivory`}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );

    case "THREADS":
      return (
        <svg {...iconProps} className={`${className} text-ivory`}>
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.88-.732 2.07-1.128 3.446-1.145 1.053-.013 2.053.125 2.851.287v3.19l-.015-.004c-1.285.052-2.092.138-2.766.295-1.417.33-1.866.838-1.89 1.925.012.482.205.878.575 1.178.444.36 1.075.547 1.823.54 1.27-.012 2.281-.487 3.002-1.406.573-.733.89-1.753.944-3.039l.02-.442v-5.57l.758.122c.122.02.308.054.555.101.36.068.758.157 1.142.267.424.121.755.243 1.015.374a6.8 6.8 0 011.386.848c1.388 1.09 2.191 2.481 2.386 4.136.188 1.587-.272 3.2-1.331 4.67-1.2 1.669-2.926 2.797-5.133 3.354-1.178.297-2.46.445-3.813.439z" />
        </svg>
      );

    default:
      return (
        <div
          className={`${className} flex items-center justify-center rounded-full bg-gold/20 text-gold`}
        >
          ?
        </div>
      );
  }
}
