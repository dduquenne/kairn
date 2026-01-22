"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Settings,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { DeleteConfirmation } from "../../_components/DeleteConfirmation";
import { SocialPlatformIcon } from "./_components/SocialPlatformIcon";
import { ConnectAccountModal } from "./_components/ConnectAccountModal";

interface SocialAccount {
  id: string;
  platform: string;
  accountId: string;
  accountName: string;
  tokenExpiry: string | null;
  scope: string[];
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    pageId?: string;
    pageName?: string;
    igUsername?: string;
    personId?: string;
    avatarUrl?: string;
  };
}

interface AccountStats {
  total: number;
  active: number;
  byPlatform: {
    FACEBOOK: number;
    LINKEDIN: number;
    INSTAGRAM: number;
  };
  expiringSoon: number;
}

export default function SocialAccountsPage() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [refreshingAccount, setRefreshingAccount] = useState<string | null>(null);
  const { addToast } = useToast();

  // Afficher les messages de succès/erreur depuis l'URL
  useEffect(() => {
    if (!searchParams) return;

    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const platform = searchParams.get("platform");
    const account = searchParams.get("account");

    if (success === "true" && platform && account) {
      addToast({
        title: `Compte ${platform} connecté`,
        description: `${account} a été ajouté avec succès`,
        variant: "success",
      });
      // Nettoyer l'URL
      window.history.replaceState({}, "", "/admin/social/accounts");
    } else if (error) {
      addToast({
        title: "Erreur de connexion",
        description: decodeURIComponent(error),
        variant: "error",
      });
      window.history.replaceState({}, "", "/admin/social/accounts");
    }
  }, [searchParams, addToast]);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/social/accounts?t=" + Date.now(), {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Échec du chargement des comptes");
      }

      const data = await response.json();
      setAccounts(data.accounts);
      setStats(data.stats);
    } catch (error) {
      console.error("Erreur chargement comptes:", error);
      addToast({
        title: "Impossible de charger les comptes",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleDeleteAccount = async (id: string) => {
    try {
      const response = await fetch(`/api/social/accounts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Échec de la suppression");
      }

      addToast({
        title: "Compte supprimé",
        variant: "success",
      });
      setDeleteConfirmation(null);
      loadAccounts();
    } catch (error) {
      console.error("Erreur suppression:", error);
      addToast({
        title: "Impossible de supprimer le compte",
        variant: "error",
      });
    }
  };

  const handleRefreshToken = async (id: string) => {
    setRefreshingAccount(id);
    try {
      const response = await fetch(`/api/social/accounts/${id}/refresh`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        addToast({
          title: "Token rafraîchi",
          description: data.message,
          variant: "success",
        });
        loadAccounts();
      } else {
        addToast({
          title: "Échec du rafraîchissement",
          description: data.message,
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Erreur refresh:", error);
      addToast({
        title: "Erreur de rafraîchissement",
        variant: "error",
      });
    } finally {
      setRefreshingAccount(null);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/social/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (!response.ok) {
        throw new Error("Échec de la mise à jour");
      }

      addToast({
        title: currentActive ? "Compte désactivé" : "Compte activé",
        variant: "success",
      });
      loadAccounts();
    } catch (error) {
      console.error("Erreur toggle:", error);
      addToast({
        title: "Impossible de modifier le statut",
        variant: "error",
      });
    }
  };

  const isTokenExpiringSoon = (tokenExpiry: string | null): boolean => {
    if (!tokenExpiry) return false;
    const expiryDate = new Date(tokenExpiry);
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return expiryDate < sevenDaysFromNow;
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "Jamais";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gold">
              Réseaux sociaux
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ivory">
              Comptes connectés
            </h1>
          </div>

          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold/20 px-6 py-3 font-medium text-gold transition hover:bg-gold/30"
          >
            <Plus className="h-5 w-5" />
            Connecter un compte
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4">
            <p className="text-sm text-ivory/60">Total</p>
            <p className="mt-1 text-2xl font-semibold text-ivory">
              {stats.total}
            </p>
          </div>
          <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4">
            <p className="text-sm text-ivory/60">Actifs</p>
            <p className="mt-1 text-2xl font-semibold text-green-400">
              {stats.active}
            </p>
          </div>
          <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4">
            <p className="text-sm text-ivory/60">Facebook</p>
            <p className="mt-1 text-2xl font-semibold text-blue-400">
              {stats.byPlatform.FACEBOOK}
            </p>
          </div>
          <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4">
            <p className="text-sm text-ivory/60">Expirant bientôt</p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                stats.expiringSoon > 0 ? "text-amber-400" : "text-ivory"
              }`}
            >
              {stats.expiringSoon}
            </p>
          </div>
        </motion.div>
      )}

      {/* Accounts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm"
      >
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded bg-gold/10"
              />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-ivory/50">Aucun compte connecté</p>
            <p className="mt-2 text-sm text-ivory/30">
              Connectez vos comptes sociaux pour automatiser vos publications
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account, index) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between rounded-lg border border-gold/10 bg-night/30 p-4 transition hover:border-gold/20"
              >
                <div className="flex items-center gap-4">
                  {/* Platform Icon */}
                  <SocialPlatformIcon
                    platform={account.platform}
                    className="h-10 w-10"
                  />

                  {/* Account Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ivory">
                        {account.accountName}
                      </span>
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
                          Token expire bientôt
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-ivory/50">
                      <span className="capitalize">
                        {account.platform.toLowerCase()}
                      </span>
                      <span>•</span>
                      <span>
                        Dernière utilisation: {formatDate(account.lastUsed)}
                      </span>
                      {account.tokenExpiry && (
                        <>
                          <span>•</span>
                          <span>
                            Expire: {formatDate(account.tokenExpiry)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Toggle Active */}
                  <button
                    onClick={() =>
                      handleToggleActive(account.id, account.isActive)
                    }
                    className="rounded-lg p-2 text-ivory/70 transition hover:bg-gold/10 hover:text-ivory"
                    title={account.isActive ? "Désactiver" : "Activer"}
                  >
                    <Settings className="h-4 w-4" />
                  </button>

                  {/* Refresh Token (only for LinkedIn) */}
                  {account.platform === "LINKEDIN" && (
                    <button
                      onClick={() => handleRefreshToken(account.id)}
                      disabled={refreshingAccount === account.id}
                      className="rounded-lg p-2 text-ivory/70 transition hover:bg-gold/10 hover:text-ivory disabled:opacity-50"
                      title="Rafraîchir le token"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${
                          refreshingAccount === account.id ? "animate-spin" : ""
                        }`}
                      />
                    </button>
                  )}

                  {/* View on Platform */}
                  {account.metadata?.avatarUrl && (
                    <a
                      href={
                        account.platform === "LINKEDIN"
                          ? `https://www.linkedin.com/in/${account.metadata.personId}`
                          : account.platform === "INSTAGRAM"
                          ? `https://instagram.com/${account.metadata.igUsername}`
                          : `https://facebook.com/${account.accountId}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-2 text-ivory/70 transition hover:bg-gold/10 hover:text-ivory"
                      title="Voir sur la plateforme"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() =>
                      setDeleteConfirmation({
                        id: account.id,
                        name: account.accountName,
                      })
                    }
                    className="rounded-lg p-2 text-ivory/70 transition hover:bg-red-500/10 hover:text-red-400"
                    title="Supprimer le compte"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Connect Account Modal */}
      <ConnectAccountModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmation
        open={!!deleteConfirmation}
        title={deleteConfirmation?.name || ""}
        description="Ce compte sera déconnecté. Les posts programmés ne seront plus publiés sur cette plateforme."
        onConfirm={() => {
          if (deleteConfirmation) {
            handleDeleteAccount(deleteConfirmation.id);
          }
        }}
        onCancel={() => setDeleteConfirmation(null)}
      />
    </div>
  );
}
