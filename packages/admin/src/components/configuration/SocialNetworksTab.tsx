'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { useState } from 'react';

import { SocialPlatformIcon } from './SocialPlatformIcon';
import type { ToastHandler, SocialAccount } from './types';

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
    id: 'facebook',
    name: 'Facebook',
    description: 'Publiez sur vos Pages Facebook',
    color: 'text-[#1877F2]',
    bgColor: 'bg-[#1877F2]/10',
    borderColor: 'border-[#1877F2]/30',
    authUrl: '/api/social/auth/facebook',
    icon: 'FACEBOOK',
    requirements: ["Être administrateur d'une Page Facebook", 'Application Facebook configurée'],
    setupSteps: [
      {
        title: 'Créer une application Facebook',
        description:
          "Rendez-vous sur developers.facebook.com et créez une nouvelle application de type 'Business'.",
        tip: "Choisissez 'Business' comme type d'application pour accéder aux API de publication.",
      },
      {
        title: 'Configurer les permissions',
        description:
          "Ajoutez les permissions 'pages_manage_posts' et 'pages_read_engagement' à votre application.",
        tip: 'Ces permissions permettent de publier du contenu et de lire les statistiques.',
      },
      {
        title: "Configurer l'URI de redirection",
        description:
          "Ajoutez l'URI de callback dans les paramètres OAuth de votre application Facebook.",
        tip: "L'URI doit correspondre exactement à celle configurée dans Kairn.",
      },
      {
        title: 'Connecter votre compte',
        description:
          "Cliquez sur 'Connecter' pour autoriser Kairn à publier sur vos pages Facebook.",
      },
    ],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Publiez sur Instagram Business/Creator',
    color: 'text-[#E4405F]',
    bgColor: 'bg-[#E4405F]/10',
    borderColor: 'border-[#E4405F]/30',
    authUrl: '/api/social/auth/instagram',
    icon: 'INSTAGRAM',
    requirements: [
      'Compte Instagram Business ou Creator',
      'Compte lié à une Page Facebook',
      'Être administrateur de la Page liée',
    ],
    setupSteps: [
      {
        title: 'Convertir en compte professionnel',
        description:
          'Transformez votre compte Instagram personnel en compte Business ou Creator dans les paramètres.',
        tip: 'Allez dans Paramètres > Compte > Passer à un compte professionnel.',
      },
      {
        title: 'Lier à une Page Facebook',
        description:
          'Connectez votre compte Instagram à une Page Facebook dont vous êtes administrateur.',
        tip: "Cette liaison est obligatoire pour utiliser l'API Instagram.",
      },
      {
        title: 'Vérifier les permissions Facebook',
        description:
          "Assurez-vous que l'application Facebook a les permissions Instagram nécessaires.",
        tip: "Ajoutez 'instagram_basic' et 'instagram_content_publish' à votre app.",
      },
      {
        title: 'Connecter votre compte',
        description: "Cliquez sur 'Connecter' pour autoriser Kairn à publier sur Instagram.",
      },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Publiez sur votre profil LinkedIn',
    color: 'text-[#0A66C2]',
    bgColor: 'bg-[#0A66C2]/10',
    borderColor: 'border-[#0A66C2]/30',
    authUrl: '/api/social/auth/linkedin',
    icon: 'LINKEDIN',
    requirements: ['Compte LinkedIn actif', 'Application LinkedIn Developer'],
    setupSteps: [
      {
        title: 'Créer une application LinkedIn',
        description: 'Rendez-vous sur linkedin.com/developers et créez une nouvelle application.',
        tip: "Vous aurez besoin d'une Page LinkedIn pour créer l'application.",
      },
      {
        title: "Demander l'accès aux produits",
        description: "Demandez l'accès au produit 'Share on LinkedIn' dans l'onglet Products.",
        tip: "L'approbation peut prendre quelques jours.",
      },
      {
        title: 'Configurer OAuth 2.0',
        description:
          "Ajoutez les scopes 'w_member_social' et 'r_liteprofile' puis configurez l'URI de redirection.",
        tip: "Copiez l'URI exacte depuis les paramètres de Kairn.",
      },
      {
        title: 'Connecter votre compte',
        description: "Cliquez sur 'Connecter' pour autoriser Kairn à publier sur LinkedIn.",
      },
    ],
  },
  {
    id: 'threads',
    name: 'Threads',
    description: 'Publiez sur votre profil Threads',
    color: 'text-ivory',
    bgColor: 'bg-ivory/10',
    borderColor: 'border-ivory/30',
    authUrl: '/api/social/auth/threads',
    icon: 'THREADS',
    requirements: ['Compte Threads actif', 'Application Meta avec Threads API'],
    setupSteps: [
      {
        title: "Configurer l'application Meta",
        description:
          "Dans votre application Meta, ajoutez le produit 'Threads API' depuis le tableau de bord.",
        tip: "Threads API est un produit séparé de l'API Instagram.",
      },
      {
        title: 'Demander les permissions',
        description: "Ajoutez les permissions 'threads_basic' et 'threads_content_publish'.",
        tip: 'Ces permissions permettent de lire et publier du contenu.',
      },
      {
        title: "Configurer l'URI de redirection",
        description: "Ajoutez l'URI de callback Threads dans les paramètres OAuth.",
        tip: 'Utilisez une URI différente de celle de Facebook/Instagram.',
      },
      {
        title: 'Connecter votre compte',
        description: "Cliquez sur 'Connecter' pour autoriser Kairn à publier sur Threads.",
      },
    ],
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    description: 'Publiez des tweets sur votre compte X',
    color: 'text-ivory',
    bgColor: 'bg-ivory/10',
    borderColor: 'border-ivory/30',
    authUrl: '/api/social/auth/twitter',
    icon: 'TWITTER',
    requirements: [
      'Compte X (Twitter) actif',
      'Application Twitter Developer',
      'Plan Free ou Basic',
    ],
    setupSteps: [
      {
        title: 'Créer un projet Developer',
        description: 'Rendez-vous sur developer.twitter.com et créez un nouveau projet.',
        tip: 'Le plan gratuit permet 1500 tweets/mois.',
      },
      {
        title: 'Configurer OAuth 2.0',
        description:
          "Activez OAuth 2.0 dans les paramètres d'authentification de votre application.",
        tip: "Choisissez 'Web App' comme type d'application.",
      },
      {
        title: 'Ajouter les permissions',
        description: "Configurez les scopes 'tweet.read', 'tweet.write' et 'users.read'.",
        tip: 'Ces permissions sont nécessaires pour publier et lire les tweets.',
      },
      {
        title: 'Connecter votre compte',
        description: "Cliquez sur 'Connecter' pour autoriser Kairn à publier sur X.",
      },
    ],
  },
];

/** Props du composant SocialNetworksTab */
export interface SocialNetworksTabProps {
  accounts: SocialAccount[];
  onRefresh: () => void;
  toast: ToastHandler;
}

/**
 * Onglet de gestion des connexions aux réseaux sociaux.
 * Affiche les comptes connectés, un assistant de connexion par étapes et les statistiques.
 */
export function SocialNetworksTab({ accounts, onRefresh, toast }: SocialNetworksTabProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [refreshingAccount, setRefreshingAccount] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<SocialAccount | null>(null);

  const activeAccounts = accounts.filter(a => a.isActive).length;

  /** Ouvre l'assistant de connexion pour une plateforme */
  const handleStartWizard = (platform: PlatformConfig) => {
    setSelectedPlatform(platform);
    setCurrentStep(0);
    setShowWizard(true);
  };

  /** Redirige vers l'URL OAuth de la plateforme sélectionnée */
  const handleConnect = () => {
    if (selectedPlatform) {
      window.location.href = selectedPlatform.authUrl;
    }
  };

  /** Supprime un compte social */
  const handleDeleteAccount = async () => {
    if (!deletingAccount) return;

    try {
      const response = await fetch(`/api/social/accounts/${deletingAccount.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.addToast({
          title: 'Compte déconnecté',
          description: `${deletingAccount.accountName} a été supprimé`,
          variant: 'success',
        });
        setDeletingAccount(null);
        onRefresh();
      } else {
        throw new Error('Échec de la suppression');
      }
    } catch {
      toast.addToast({
        title: 'Erreur',
        description: 'Impossible de supprimer le compte',
        variant: 'error',
      });
    }
  };

  /** Rafraîchit le token OAuth d'un compte */
  const handleRefreshToken = async (account: SocialAccount) => {
    setRefreshingAccount(account.id);
    try {
      const response = await fetch(`/api/social/accounts/${account.id}/refresh`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.addToast({
          title: 'Token rafraîchi',
          description: data.message,
          variant: 'success',
        });
        onRefresh();
      } else {
        toast.addToast({
          title: 'Échec du rafraîchissement',
          description: data.message,
          variant: 'error',
        });
      }
    } catch {
      toast.addToast({
        title: 'Erreur',
        description: 'Impossible de rafraîchir le token',
        variant: 'error',
      });
    } finally {
      setRefreshingAccount(null);
    }
  };

  /** Active ou désactive un compte */
  const handleToggleActive = async (account: SocialAccount) => {
    try {
      const response = await fetch(`/api/social/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !account.isActive }),
      });

      if (response.ok) {
        toast.addToast({
          title: account.isActive ? 'Compte désactivé' : 'Compte activé',
          variant: 'success',
        });
        onRefresh();
      }
    } catch {
      toast.addToast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        variant: 'error',
      });
    }
  };

  /** Vérifie si un token expire dans les 7 prochains jours */
  const isTokenExpiringSoon = (tokenExpiry: string | null | undefined): boolean => {
    if (!tokenExpiry) return false;
    const expiryDate = new Date(tokenExpiry);
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return expiryDate < sevenDaysFromNow;
  };

  /** Formate une date en format français court */
  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'Jamais';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  /** Retourne la liste des plateformes déjà connectées */
  const getConnectedPlatforms = () => {
    return accounts.map(a => a.platform.toLowerCase());
  };

  const connectedPlatforms = getConnectedPlatforms();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-ivory text-xl font-bold">Connexion aux réseaux sociaux</h2>
          <p className="text-ivory/60 text-sm">
            {accounts.length} compte{accounts.length !== 1 ? 's' : ''} connecté
            {accounts.length !== 1 ? 's' : ''}, {activeAccounts} actif
            {activeAccounts !== 1 ? 's' : ''}
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
              <p className="text-ivory text-2xl font-bold">{accounts.length}</p>
              <p className="text-ivory/50 text-xs">Connectés</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-ivory text-2xl font-bold">{activeAccounts}</p>
              <p className="text-ivory/50 text-xs">Actifs</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
              <AlertCircle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-ivory text-2xl font-bold">
                {accounts.filter(a => isTokenExpiringSoon(a.tokenExpiry)).length}
              </p>
              <p className="text-ivory/50 text-xs">Expirent bientôt</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
              <Zap className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-ivory text-2xl font-bold">
                {PLATFORMS.length - connectedPlatforms.length}
              </p>
              <p className="text-ivory/50 text-xs">Disponibles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      {accounts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-ivory/20 bg-night/40 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10">
            <Link2 className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-ivory mt-4 text-lg font-medium">Aucun compte connecté</h3>
          <p className="text-ivory/60 mt-2 max-w-md text-center text-sm">
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
              className="border-gold/10 bg-night/40 hover:border-gold/20 flex items-center justify-between rounded-2xl border p-4 transition"
            >
              <div className="flex items-center gap-4">
                <SocialPlatformIcon platform={account.platform} className="h-12 w-12" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-ivory font-medium">{account.accountName}</span>
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
                  <div className="text-ivory/50 mt-1 flex items-center gap-4 text-sm">
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
                  className="text-ivory/70 hover:bg-gold/10 hover:text-ivory rounded-lg p-2 transition"
                  title={account.isActive ? 'Désactiver' : 'Activer'}
                >
                  <Settings className="h-4 w-4" />
                </button>

                {account.platform === 'LINKEDIN' && (
                  <button
                    onClick={() => handleRefreshToken(account)}
                    disabled={refreshingAccount === account.id}
                    className="text-ivory/70 hover:bg-gold/10 hover:text-ivory rounded-lg p-2 transition disabled:opacity-50"
                    title="Rafraîchir le token"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshingAccount === account.id ? 'animate-spin' : ''}`}
                    />
                  </button>
                )}

                <button
                  onClick={() => setDeletingAccount(account)}
                  className="text-ivory/70 rounded-lg p-2 transition hover:bg-red-500/10 hover:text-red-400"
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
      <div className="border-ivory/10 bg-night/40 rounded-2xl border p-6">
        <h3 className="text-ivory/70 mb-4 text-sm font-semibold">Plateformes disponibles</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map(platform => {
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
                    ? 'cursor-default border-green-500/30 bg-green-500/5'
                    : `${platform.borderColor} ${platform.bgColor} hover:bg-opacity-20`
                }`}
              >
                <SocialPlatformIcon platform={platform.icon} className="h-10 w-10 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${isConnected ? 'text-green-400' : 'text-ivory'}`}>
                      {platform.name}
                    </p>
                    {isConnected && <CheckCircle className="h-4 w-4 text-green-400" />}
                  </div>
                  <p className="text-ivory/50 mt-0.5 truncate text-xs">{platform.description}</p>
                </div>
                {!isConnected && (
                  <ChevronRight className="text-ivory/30 h-5 w-5 transition-transform group-hover:translate-x-1" />
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
              <li>• Vos tokens d&apos;accès sont chiffrés avec AES-256-GCM</li>
              <li>• Nous ne stockons jamais vos mots de passe</li>
              <li>
                • Vous pouvez révoquer l&apos;accès à tout moment depuis les paramètres de chaque
                plateforme
              </li>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="border-gold/20 bg-night w-full max-w-md rounded-2xl border p-6"
            >
              <h3 className="text-ivory text-lg font-semibold">Déconnecter le compte</h3>
              <p className="text-ivory/60 mt-2 text-sm">
                Êtes-vous sûr de vouloir déconnecter{' '}
                <span className="text-ivory font-medium">{deletingAccount.accountName}</span> ? Les
                posts programmés ne seront plus publiés sur cette plateforme.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeletingAccount(null)}
                  className="text-ivory/70 hover:text-ivory rounded-lg px-4 py-2 text-sm font-medium transition"
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

/** Assistant de connexion par étapes pour les plateformes sociales */
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="border-gold/20 from-night to-night/95 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border bg-gradient-to-br shadow-xl"
      >
        {/* Header */}
        <div className="border-gold/10 flex-shrink-0 border-b p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedPlatform && (
                <button
                  onClick={() => {
                    onSelectPlatform(null);
                    onSetStep(0);
                  }}
                  className="text-ivory/70 hover:bg-gold/10 hover:text-ivory rounded-lg p-2 transition"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <div>
                <h3 className="text-ivory text-xl font-semibold">
                  {selectedPlatform ? `Connecter ${selectedPlatform.name}` : 'Connecter un compte'}
                </h3>
                {selectedPlatform && (
                  <p className="text-ivory/60 mt-1 text-sm">
                    Étape {currentStep + 1} sur {totalSteps}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-ivory/70 hover:bg-gold/10 hover:text-ivory rounded-lg p-2 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Bar */}
          {selectedPlatform && (
            <div className="bg-ivory/10 mt-4 h-1.5 overflow-hidden rounded-full">
              <motion.div
                className="bg-gold h-full rounded-full"
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
            <div className="space-y-4">
              <p className="text-ivory/60 text-sm">
                Sélectionnez une plateforme pour commencer la configuration guidée.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {platforms.map(platform => {
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
                          ? 'cursor-default border-green-500/30 bg-green-500/5'
                          : `${platform.borderColor} ${platform.bgColor} hover:bg-opacity-20`
                      }`}
                    >
                      <SocialPlatformIcon
                        platform={platform.icon}
                        className="h-12 w-12 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-semibold ${isConnected ? 'text-green-400' : 'text-ivory'}`}
                          >
                            {platform.name}
                          </p>
                          {isConnected && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                              <CheckCircle className="h-3 w-3" />
                              Connecté
                            </span>
                          )}
                        </div>
                        <p className="text-ivory/60 mt-1 text-sm">{platform.description}</p>
                        <div className="mt-3">
                          <p className="flex items-center gap-1 text-xs font-medium text-amber-400">
                            <AlertCircle className="h-3 w-3" />
                            Prérequis
                          </p>
                          <ul className="mt-1 space-y-0.5">
                            {platform.requirements.map((req, idx) => (
                              <li key={idx} className="text-ivory/50 text-xs">
                                • {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {!isConnected && (
                        <ChevronRight className="text-ivory/30 h-5 w-5 flex-shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ) : (
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
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${selectedPlatform.bgColor}`}
                      >
                        <span className={`text-xl font-bold ${selectedPlatform.color}`}>
                          {currentStep + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-ivory text-lg font-semibold">
                          {currentStepData.title}
                        </h4>
                        <p className="text-ivory/70 mt-2 text-sm">{currentStepData.description}</p>
                        {currentStepData.tip && (
                          <div className="bg-gold/10 mt-4 flex items-start gap-3 rounded-xl p-4">
                            <Sparkles className="text-gold mt-0.5 h-5 w-5 flex-shrink-0" />
                            <p className="text-gold text-sm">{currentStepData.tip}</p>
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
                          ? 'bg-gold w-8'
                          : idx < currentStep
                            ? 'bg-gold/50 w-2'
                            : 'bg-ivory/20 w-2'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="border-gold/10 flex-shrink-0 border-t p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-ivory/70 hover:text-ivory rounded-lg px-4 py-2 text-sm font-medium transition"
            >
              Annuler
            </button>
            {selectedPlatform && (
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={() => onSetStep(currentStep - 1)}
                    className="border-ivory/20 text-ivory hover:bg-ivory/5 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </button>
                )}
                {isLastStep ? (
                  <button
                    onClick={onConnect}
                    className={`flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium text-white transition ${
                      selectedPlatform.id === 'facebook'
                        ? 'bg-[#1877F2] hover:bg-[#1877F2]/90'
                        : selectedPlatform.id === 'instagram'
                          ? 'bg-[#E4405F] hover:bg-[#E4405F]/90'
                          : selectedPlatform.id === 'linkedin'
                            ? 'bg-[#0A66C2] hover:bg-[#0A66C2]/90'
                            : 'bg-gold hover:bg-gold/90 text-night'
                    }`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Connecter {selectedPlatform.name}
                  </button>
                ) : (
                  <button
                    onClick={() => onSetStep(currentStep + 1)}
                    className="bg-gold text-night hover:bg-gold/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
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
