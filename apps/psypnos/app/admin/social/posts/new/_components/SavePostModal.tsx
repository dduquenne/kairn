"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  Calendar,
  Clock,
  Send,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";


import type {
  SocialPlatform,
  GeneratedContent,
  SocialAccountPublic,
  ContentTone,
  ContentAngle,
} from "@/lib/social/types";
import { OPTIMAL_POSTING_TIMES, PLATFORM_SPECS } from "@/lib/social/types";

import { SocialPlatformIcon } from "../../../accounts/_components/SocialPlatformIcon";

// ===========================================
// Types
// ===========================================

interface SavePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  generations: GeneratedContent[];
  blogSlug: string;
  blogTitle: string;
  articleImage?: string;
  tone: ContentTone;
  angle: ContentAngle;
  onSaveSuccess: () => void;
}

interface PostConfig {
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
  accountId: string | null;
  scheduledAt: Date | null;
  enabled: boolean;
}

type SaveMode = "draft" | "schedule" | "now";

interface SuggestedTime {
  date: Date;
  label: string;
  isPrimary: boolean;
}

// ===========================================
// Helpers
// ===========================================

function getNextOptimalTimes(
  platform: SocialPlatform,
  count: number = 5
): SuggestedTime[] {
  const now = new Date();
  const slots = OPTIMAL_POSTING_TIMES[platform] || [];
  const suggestions: SuggestedTime[] = [];

  // Générer les 14 prochains jours de créneaux
  for (let dayOffset = 0; dayOffset < 14 && suggestions.length < count; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    const dayOfWeek = date.getDay();

    for (const slot of slots) {
      if (slot.dayOfWeek === dayOfWeek) {
        const slotDate = new Date(date);
        slotDate.setHours(slot.hour, 0, 0, 0);

        // Ne pas inclure les créneaux passés
        if (slotDate > now) {
          const label = formatSuggestedTime(slotDate);
          suggestions.push({
            date: slotDate,
            label,
            isPrimary: slot.priority === "primary",
          });
        }
      }
    }
  }

  // Trier par date et retourner les premiers
  return suggestions
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, count);
}

function formatSuggestedTime(date: Date): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return `Aujourd'hui à ${time}`;
  if (isTomorrow) return `Demain à ${time}`;

  const day = date.toLocaleDateString("fr-FR", { weekday: "long" });
  const dayNum = date.getDate();
  const month = date.toLocaleDateString("fr-FR", { month: "short" });

  return `${day.charAt(0).toUpperCase() + day.slice(1)} ${dayNum} ${month} à ${time}`;
}

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ===========================================
// Main Component
// ===========================================

export function SavePostModal({
  isOpen,
  onClose,
  generations,
  blogSlug,
  blogTitle,
  articleImage,
  tone,
  angle,
  onSaveSuccess,
}: SavePostModalProps) {
  // State
  const [accounts, setAccounts] = useState<SocialAccountPublic[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [postConfigs, setPostConfigs] = useState<PostConfig[]>([]);
  const [saveMode, setSaveMode] = useState<SaveMode>("schedule");
  const [globalScheduleDate, setGlobalScheduleDate] = useState<Date | null>(null);
  const [useIndividualSchedules, setUseIndividualSchedules] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResults, setSaveResults] = useState<
    Array<{ platform: SocialPlatform; success: boolean; error?: string }>
  >([]);
  const [expandedPlatform, setExpandedPlatform] = useState<SocialPlatform | null>(null);

  // Charger les comptes au montage
  useEffect(() => {
    async function loadAccounts() {
      if (!isOpen) return;

      setIsLoadingAccounts(true);
      try {
        const response = await fetch("/api/social/accounts?active=true");
        if (response.ok) {
          const data = await response.json();
          setAccounts(data.accounts || []);
        }
      } catch (error) {
        console.error("Error loading accounts:", error);
      } finally {
        setIsLoadingAccounts(false);
      }
    }

    loadAccounts();
  }, [isOpen]);

  // Initialiser les configurations quand les générations ou comptes changent
  useEffect(() => {
    if (generations.length > 0) {
      setPostConfigs(
        generations.map((gen) => {
          // Trouver un compte actif pour cette plateforme
          const accountForPlatform = accounts.find(
            (a) => a.platform === gen.platform && a.isActive
          );

          return {
            platform: gen.platform,
            content: gen.content,
            hashtags: gen.hashtags,
            accountId: accountForPlatform?.id || null,
            scheduledAt: null,
            enabled: !!accountForPlatform,
          };
        })
      );
    }
  }, [generations, accounts]);

  // Calculer les suggestions d'horaires optimaux pour chaque plateforme
  const suggestedTimes = useMemo(() => {
    const times: Record<SocialPlatform, SuggestedTime[]> = {
      FACEBOOK: [],
      LINKEDIN: [],
      INSTAGRAM: [],
      TWITTER: [],
      THREADS: [],
    };

    for (const platform of Object.keys(times) as SocialPlatform[]) {
      times[platform] = getNextOptimalTimes(platform, 5);
    }

    return times;
  }, []);

  // Handlers
  const updatePostConfig = useCallback(
    (platform: SocialPlatform, updates: Partial<PostConfig>) => {
      setPostConfigs((prev) =>
        prev.map((config) =>
          config.platform === platform ? { ...config, ...updates } : config
        )
      );
    },
    []
  );

  const getAccountsForPlatform = useCallback(
    (platform: SocialPlatform) => {
      return accounts.filter((a) => a.platform === platform && a.isActive);
    },
    [accounts]
  );

  const handleSave = useCallback(async () => {
    const enabledConfigs = postConfigs.filter((c) => c.enabled && c.accountId);

    if (enabledConfigs.length === 0) {
      return;
    }

    setIsSaving(true);
    setSaveResults([]);

    const results: typeof saveResults = [];

    for (const config of enabledConfigs) {
      try {
        // Déterminer la date de programmation
        let scheduledAt: Date | null = null;

        if (saveMode === "schedule") {
          if (useIndividualSchedules) {
            scheduledAt = config.scheduledAt;
          } else {
            scheduledAt = globalScheduleDate;
          }
        } else if (saveMode === "now") {
          // Pour publication immédiate, on programme dans 1 seconde
          scheduledAt = new Date(Date.now() + 1000);
        }

        // Construire l'URL du lien (URL de l'article)
        // On utilise NEXT_PUBLIC_SITE_URL pour avoir l'URL de production correcte
        // plutôt que window.location.origin qui peut être différent (localhost, preview, etc.)
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://psypnos.fr';
        const linkUrl = blogSlug
          ? `${siteUrl}/blog/${blogSlug}`
          : undefined;

        const response = await fetch("/api/social/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: config.accountId,
            platform: config.platform,
            content: config.content,
            blogSlug,
            blogTitle,
            mediaUrls: articleImage ? [articleImage] : [],
            hashtags: config.hashtags,
            linkUrl,
            scheduledAt: scheduledAt?.toISOString(),
            generatedBy: "ai",
            aiModel: "claude-sonnet-4-5-20250929",
            metadata: {
              tone,
              angle,
            },
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Erreur lors de la sauvegarde");
        }

        results.push({ platform: config.platform, success: true });
      } catch (error) {
        results.push({
          platform: config.platform,
          success: false,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    setSaveResults(results);
    setIsSaving(false);

    // Si tous les posts ont été sauvegardés avec succès
    if (results.every((r) => r.success)) {
      setTimeout(() => {
        onSaveSuccess();
        onClose();
      }, 1500);
    }
  }, [
    postConfigs,
    saveMode,
    useIndividualSchedules,
    globalScheduleDate,
    blogSlug,
    blogTitle,
    articleImage,
    tone,
    angle,
    onSaveSuccess,
    onClose,
  ]);

  // Validation
  const enabledConfigsCount = postConfigs.filter((c) => c.enabled && c.accountId).length;
  const canSave = enabledConfigsCount > 0 && !isSaving;

  const needsScheduleDate =
    saveMode === "schedule" &&
    !useIndividualSchedules &&
    !globalScheduleDate;

  const needsIndividualDates =
    saveMode === "schedule" &&
    useIndividualSchedules &&
    postConfigs.some((c) => c.enabled && c.accountId && !c.scheduledAt);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl border border-gold/20 bg-gradient-to-br from-night to-night/95 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gold/20 bg-night/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <Save className="h-5 w-5 text-gold" />
              <h2 className="text-xl font-semibold text-ivory">
                Sauvegarder les posts
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-ivory/60 transition hover:bg-gold/10 hover:text-ivory"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 140px)" }}>
            {isLoadingAccounts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Article info */}
                <div className="rounded-lg border border-gold/10 bg-night/30 p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 flex-shrink-0 text-gold" />
                    <div>
                      <p className="text-sm text-ivory/60">Article source</p>
                      <p className="font-medium text-ivory">{blogTitle}</p>
                    </div>
                  </div>
                </div>

                {/* Save Mode Selection */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-ivory/60">
                    Mode de publication
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setSaveMode("draft")}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition ${
                        saveMode === "draft"
                          ? "border-gold/50 bg-gold/10"
                          : "border-gold/10 hover:border-gold/30"
                      }`}
                    >
                      <FileText
                        className={`h-6 w-6 ${saveMode === "draft" ? "text-gold" : "text-ivory/50"}`}
                      />
                      <span
                        className={saveMode === "draft" ? "text-gold" : "text-ivory/70"}
                      >
                        Brouillon
                      </span>
                    </button>

                    <button
                      onClick={() => setSaveMode("schedule")}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition ${
                        saveMode === "schedule"
                          ? "border-gold/50 bg-gold/10"
                          : "border-gold/10 hover:border-gold/30"
                      }`}
                    >
                      <Calendar
                        className={`h-6 w-6 ${saveMode === "schedule" ? "text-gold" : "text-ivory/50"}`}
                      />
                      <span
                        className={saveMode === "schedule" ? "text-gold" : "text-ivory/70"}
                      >
                        Programmer
                      </span>
                    </button>

                    <button
                      onClick={() => setSaveMode("now")}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition ${
                        saveMode === "now"
                          ? "border-gold/50 bg-gold/10"
                          : "border-gold/10 hover:border-gold/30"
                      }`}
                    >
                      <Send
                        className={`h-6 w-6 ${saveMode === "now" ? "text-gold" : "text-ivory/50"}`}
                      />
                      <span
                        className={saveMode === "now" ? "text-gold" : "text-ivory/70"}
                      >
                        Publier maintenant
                      </span>
                    </button>
                  </div>
                </div>

                {/* Schedule Options */}
                {saveMode === "schedule" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={useIndividualSchedules}
                          onChange={(e) => setUseIndividualSchedules(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-night/50 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-gold/50 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                      </label>
                      <span className="text-ivory/70">
                        Programmer individuellement par plateforme
                      </span>
                    </div>

                    {!useIndividualSchedules && (
                      <div className="rounded-lg border border-gold/10 bg-night/30 p-4">
                        <p className="mb-3 text-sm text-ivory/60">
                          Date et heure de publication pour tous les posts :
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <input
                            type="datetime-local"
                            value={globalScheduleDate ? formatDateTimeLocal(globalScheduleDate) : ""}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : null;
                              setGlobalScheduleDate(date);
                            }}
                            min={formatDateTimeLocal(new Date())}
                            className="rounded-lg border border-gold/20 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                          />
                          <div className="space-y-2">
                            <p className="flex items-center gap-2 text-xs text-ivory/50">
                              <Sparkles className="h-3 w-3" />
                              Suggestions :
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {suggestedTimes.FACEBOOK.slice(0, 3).map((time, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setGlobalScheduleDate(time.date)}
                                  className={`rounded-full px-3 py-1 text-xs transition ${
                                    time.isPrimary
                                      ? "bg-gold/20 text-gold hover:bg-gold/30"
                                      : "bg-ivory/10 text-ivory/70 hover:bg-ivory/20"
                                  }`}
                                >
                                  {time.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Posts Configuration */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-ivory/60">
                    Posts à sauvegarder ({enabledConfigsCount} sélectionné
                    {enabledConfigsCount > 1 ? "s" : ""})
                  </h3>

                  <div className="space-y-3">
                    {postConfigs.map((config) => {
                      const platformAccounts = getAccountsForPlatform(config.platform);
                      const hasAccount = platformAccounts.length > 0;
                      const isExpanded = expandedPlatform === config.platform;
                      const platformSuggestions = suggestedTimes[config.platform] || [];

                      return (
                        <div
                          key={config.platform}
                          className={`rounded-lg border transition ${
                            config.enabled && hasAccount
                              ? "border-gold/30 bg-night/40"
                              : "border-gold/10 bg-night/20 opacity-60"
                          }`}
                        >
                          {/* Platform Header */}
                          <div className="flex items-center gap-4 p-4">
                            <label className="relative flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                checked={config.enabled && hasAccount}
                                onChange={(e) =>
                                  updatePostConfig(config.platform, {
                                    enabled: e.target.checked,
                                  })
                                }
                                disabled={!hasAccount}
                                className="peer sr-only"
                              />
                              <div className="peer h-5 w-5 rounded border border-gold/30 bg-night/50 after:absolute after:left-[5px] after:top-[2px] after:h-2.5 after:w-1.5 after:rotate-45 after:border-b-2 after:border-r-2 after:border-gold after:opacity-0 after:transition-opacity peer-checked:border-gold peer-checked:bg-gold/20 peer-checked:after:opacity-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"></div>
                            </label>

                            <SocialPlatformIcon
                              platform={config.platform}
                              className="h-8 w-8"
                            />

                            <div className="flex-1">
                              <p className="font-medium text-ivory">
                                {PLATFORM_SPECS[config.platform].name}
                              </p>
                              {!hasAccount && (
                                <p className="text-xs text-red-400">
                                  Aucun compte connecté
                                </p>
                              )}
                            </div>

                            {hasAccount && config.enabled && (
                              <button
                                onClick={() =>
                                  setExpandedPlatform(isExpanded ? null : config.platform)
                                }
                                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-ivory/60 transition hover:bg-gold/10 hover:text-ivory"
                              >
                                Détails
                                <ChevronDown
                                  className={`h-4 w-4 transition ${isExpanded ? "rotate-180" : ""}`}
                                />
                              </button>
                            )}
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {isExpanded && config.enabled && hasAccount && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-gold/10"
                              >
                                <div className="space-y-4 p-4">
                                  {/* Account Selection */}
                                  <div>
                                    <label className="mb-2 block text-sm text-ivory/60">
                                      Compte
                                    </label>
                                    <select
                                      value={config.accountId || ""}
                                      onChange={(e) =>
                                        updatePostConfig(config.platform, {
                                          accountId: e.target.value || null,
                                        })
                                      }
                                      className="w-full rounded-lg border border-gold/20 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                                    >
                                      <option value="">Sélectionner un compte</option>
                                      {platformAccounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                          {account.accountName}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Individual Schedule */}
                                  {saveMode === "schedule" && useIndividualSchedules && (
                                    <div>
                                      <label className="mb-2 block text-sm text-ivory/60">
                                        <Clock className="mr-1 inline h-4 w-4" />
                                        Date de publication
                                      </label>
                                      <input
                                        type="datetime-local"
                                        value={
                                          config.scheduledAt
                                            ? formatDateTimeLocal(config.scheduledAt)
                                            : ""
                                        }
                                        onChange={(e) => {
                                          const date = e.target.value
                                            ? new Date(e.target.value)
                                            : null;
                                          updatePostConfig(config.platform, {
                                            scheduledAt: date,
                                          });
                                        }}
                                        min={formatDateTimeLocal(new Date())}
                                        className="w-full rounded-lg border border-gold/20 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                                      />

                                      {/* Platform-specific suggestions */}
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {platformSuggestions.map((time, idx) => (
                                          <button
                                            key={idx}
                                            onClick={() =>
                                              updatePostConfig(config.platform, {
                                                scheduledAt: time.date,
                                              })
                                            }
                                            className={`rounded-full px-2.5 py-1 text-xs transition ${
                                              time.isPrimary
                                                ? "bg-gold/20 text-gold hover:bg-gold/30"
                                                : "bg-ivory/10 text-ivory/70 hover:bg-ivory/20"
                                            }`}
                                          >
                                            {time.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Content Preview */}
                                  <div>
                                    <label className="mb-2 block text-sm text-ivory/60">
                                      Aperçu du contenu
                                    </label>
                                    <div className="rounded-lg border border-gold/10 bg-night/30 p-3">
                                      <p className="line-clamp-4 whitespace-pre-wrap text-sm text-ivory/80">
                                        {config.content}
                                      </p>
                                      {config.hashtags.length > 0 && (
                                        <p className="mt-2 text-sm text-gold/70">
                                          {config.hashtags.map((h) => `#${h}`).join(" ")}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Validation Messages */}
                {(needsScheduleDate || needsIndividualDates) && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-400" />
                      <p className="text-sm text-amber-300">
                        {needsScheduleDate &&
                          "Veuillez sélectionner une date de publication."}
                        {needsIndividualDates &&
                          "Certains posts n'ont pas de date de publication définie."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Save Results */}
                {saveResults.length > 0 && (
                  <div className="space-y-2">
                    {saveResults.map((result) => (
                      <div
                        key={result.platform}
                        className={`flex items-center gap-3 rounded-lg p-3 ${
                          result.success
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {result.success ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <AlertCircle className="h-5 w-5" />
                        )}
                        <SocialPlatformIcon platform={result.platform} className="h-5 w-5" />
                        <span className="text-sm">
                          {PLATFORM_SPECS[result.platform].name}
                          {result.success
                            ? " - Sauvegardé avec succès"
                            : ` - Erreur: ${result.error}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gold/20 bg-night/50 px-6 py-4">
            <p className="text-sm text-ivory/50">
              {enabledConfigsCount} post{enabledConfigsCount > 1 ? "s" : ""} à sauvegarder
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-gold/20 px-4 py-2 text-ivory/70 transition hover:border-gold/40 hover:text-ivory"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave || needsScheduleDate || needsIndividualDates}
                className="flex items-center gap-2 rounded-lg bg-gold/20 px-6 py-2 font-medium text-gold transition hover:bg-gold/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {saveMode === "draft" && "Sauvegarder en brouillon"}
                    {saveMode === "schedule" && "Programmer"}
                    {saveMode === "now" && "Publier maintenant"}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
