'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  Calendar,
  Send,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import type {
  SocialPlatform,
  GeneratedContent,
  SocialAccountPublic,
  ContentTone,
  ContentAngle,
} from '@/lib/social/types';
import { PLATFORM_SPECS } from '@/lib/social/types';

import { SuggestedTimeSlots } from '../../../_components/SuggestedTimeSlots';
import { SocialPlatformIcon } from '../../../accounts/_components/SocialPlatformIcon';

// ===========================================
// Types
// ===========================================

interface SavePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  generations: GeneratedContent[];
  blogSlug: string;
  blogTitle: string;
  articleDate?: string;
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

type SaveMode = 'draft' | 'schedule' | 'now';

// ===========================================
// Helpers
// ===========================================

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
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
  articleDate,
  articleImage,
  tone,
  angle,
  onSaveSuccess,
}: SavePostModalProps) {
  // State
  const [accounts, setAccounts] = useState<SocialAccountPublic[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [postConfigs, setPostConfigs] = useState<PostConfig[]>([]);
  const [saveMode, setSaveMode] = useState<SaveMode>('schedule');
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
        const response = await fetch('/api/social/accounts?active=true');
        if (response.ok) {
          const data = await response.json();
          setAccounts(data.accounts || []);
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
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
        generations.map(gen => {
          // Trouver un compte actif pour cette plateforme
          const accountForPlatform = accounts.find(a => a.platform === gen.platform && a.isActive);

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

  // Handlers
  const updatePostConfig = useCallback((platform: SocialPlatform, updates: Partial<PostConfig>) => {
    setPostConfigs(prev =>
      prev.map(config => (config.platform === platform ? { ...config, ...updates } : config))
    );
  }, []);

  const getAccountsForPlatform = useCallback(
    (platform: SocialPlatform) => {
      return accounts.filter(a => a.platform === platform && a.isActive);
    },
    [accounts]
  );

  const handleSave = useCallback(async () => {
    const enabledConfigs = postConfigs.filter(c => c.enabled && c.accountId);

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

        if (saveMode === 'schedule') {
          if (useIndividualSchedules) {
            scheduledAt = config.scheduledAt;
          } else {
            scheduledAt = globalScheduleDate;
          }
        } else if (saveMode === 'now') {
          // Pour publication immédiate, on programme dans 1 seconde
          scheduledAt = new Date(Date.now() + 1000);
        }

        // Construire l'URL du lien avec paramètres UTM par plateforme
        // On utilise NEXT_PUBLIC_SITE_URL pour avoir l'URL de production correcte
        // plutôt que window.location.origin qui peut être différent (localhost, preview, etc.)
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://appreciezvotrevie.fr';
        const utmSourceMap: Record<string, string> = {
          FACEBOOK: 'facebook',
          LINKEDIN: 'linkedin',
          INSTAGRAM: 'instagram',
          TWITTER: 'twitter',
          THREADS: 'threads',
        };
        const utmSource = utmSourceMap[config.platform] || config.platform.toLowerCase();
        const linkUrl = blogSlug
          ? `${siteUrl}/blog/${blogSlug}?utm_source=${utmSource}&utm_medium=social&utm_content=blog`
          : undefined;

        const response = await fetch('/api/social/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
            generatedBy: 'ai',
            aiModel: 'claude-sonnet-4-5-20250929',
            metadata: {
              tone,
              angle,
            },
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erreur lors de la sauvegarde');
        }

        results.push({ platform: config.platform, success: true });
      } catch (error) {
        results.push({
          platform: config.platform,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    setSaveResults(results);
    setIsSaving(false);

    // Si tous les posts ont été sauvegardés avec succès
    if (results.every(r => r.success)) {
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
  const enabledConfigsCount = postConfigs.filter(c => c.enabled && c.accountId).length;
  const canSave = enabledConfigsCount > 0 && !isSaving;

  const needsScheduleDate =
    saveMode === 'schedule' && !useIndividualSchedules && !globalScheduleDate;

  const needsIndividualDates =
    saveMode === 'schedule' &&
    useIndividualSchedules &&
    postConfigs.some(c => c.enabled && c.accountId && !c.scheduledAt);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="bg-night/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="border-gold/20 from-night to-night/95 relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl border bg-gradient-to-br shadow-2xl"
        >
          {/* Header */}
          <div className="border-gold/20 bg-night/50 flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <Save className="text-gold h-5 w-5" />
              <h2 className="text-ivory text-xl font-semibold">Sauvegarder les posts</h2>
            </div>
            <button
              onClick={onClose}
              className="text-ivory/60 hover:bg-gold/10 hover:text-ivory rounded-lg p-2 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            {isLoadingAccounts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="text-gold h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Article info */}
                <div className="border-gold/10 bg-night/30 rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="text-gold h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="text-ivory/60 text-sm">Article source</p>
                      <p className="text-ivory font-medium">{blogTitle}</p>
                    </div>
                  </div>
                </div>

                {/* Save Mode Selection */}
                <div className="space-y-3">
                  <h3 className="text-ivory/60 text-sm font-medium uppercase tracking-wider">
                    Mode de publication
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setSaveMode('draft')}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition ${
                        saveMode === 'draft'
                          ? 'border-gold/50 bg-gold/10'
                          : 'border-gold/10 hover:border-gold/30'
                      }`}
                    >
                      <FileText
                        className={`h-6 w-6 ${saveMode === 'draft' ? 'text-gold' : 'text-ivory/50'}`}
                      />
                      <span className={saveMode === 'draft' ? 'text-gold' : 'text-ivory/70'}>
                        Brouillon
                      </span>
                    </button>

                    <button
                      onClick={() => setSaveMode('schedule')}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition ${
                        saveMode === 'schedule'
                          ? 'border-gold/50 bg-gold/10'
                          : 'border-gold/10 hover:border-gold/30'
                      }`}
                    >
                      <Calendar
                        className={`h-6 w-6 ${saveMode === 'schedule' ? 'text-gold' : 'text-ivory/50'}`}
                      />
                      <span className={saveMode === 'schedule' ? 'text-gold' : 'text-ivory/70'}>
                        Programmer
                      </span>
                    </button>

                    <button
                      onClick={() => setSaveMode('now')}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition ${
                        saveMode === 'now'
                          ? 'border-gold/50 bg-gold/10'
                          : 'border-gold/10 hover:border-gold/30'
                      }`}
                    >
                      <Send
                        className={`h-6 w-6 ${saveMode === 'now' ? 'text-gold' : 'text-ivory/50'}`}
                      />
                      <span className={saveMode === 'now' ? 'text-gold' : 'text-ivory/70'}>
                        Publier maintenant
                      </span>
                    </button>
                  </div>
                </div>

                {/* Schedule Options */}
                {saveMode === 'schedule' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={useIndividualSchedules}
                          onChange={e => setUseIndividualSchedules(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="bg-night/50 peer-checked:bg-gold/50 peer h-6 w-11 rounded-full after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                      </label>
                      <span className="text-ivory/70">
                        Programmer individuellement par plateforme
                      </span>
                    </div>

                    {!useIndividualSchedules && (
                      <div className="border-gold/10 bg-night/30 rounded-lg border p-4">
                        <p className="text-ivory/60 mb-3 text-sm">
                          Date et heure de publication pour tous les posts :
                        </p>
                        <div className="space-y-4">
                          <SuggestedTimeSlots
                            platform={postConfigs[0]?.platform || 'FACEBOOK'}
                            articleDate={articleDate}
                            selectedDate={globalScheduleDate}
                            onSelect={setGlobalScheduleDate}
                          />
                          <div>
                            <p className="text-ivory/40 mb-2 text-xs uppercase tracking-wider">
                              Ou choisir manuellement
                            </p>
                            <input
                              type="datetime-local"
                              value={
                                globalScheduleDate ? formatDateTimeLocal(globalScheduleDate) : ''
                              }
                              onChange={e => {
                                const date = e.target.value ? new Date(e.target.value) : null;
                                setGlobalScheduleDate(date);
                              }}
                              min={formatDateTimeLocal(new Date())}
                              className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-4 py-2 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Posts Configuration */}
                <div className="space-y-3">
                  <h3 className="text-ivory/60 text-sm font-medium uppercase tracking-wider">
                    Posts à sauvegarder ({enabledConfigsCount} sélectionné
                    {enabledConfigsCount > 1 ? 's' : ''})
                  </h3>

                  <div className="space-y-3">
                    {postConfigs.map(config => {
                      const platformAccounts = getAccountsForPlatform(config.platform);
                      const hasAccount = platformAccounts.length > 0;
                      const isExpanded = expandedPlatform === config.platform;

                      return (
                        <div
                          key={config.platform}
                          className={`rounded-lg border transition ${
                            config.enabled && hasAccount
                              ? 'border-gold/30 bg-night/40'
                              : 'border-gold/10 bg-night/20 opacity-60'
                          }`}
                        >
                          {/* Platform Header */}
                          <div className="flex items-center gap-4 p-4">
                            <label className="relative flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                checked={config.enabled && hasAccount}
                                onChange={e =>
                                  updatePostConfig(config.platform, {
                                    enabled: e.target.checked,
                                  })
                                }
                                disabled={!hasAccount}
                                className="peer sr-only"
                              />
                              <div className="border-gold/30 bg-night/50 after:border-gold peer-checked:border-gold peer-checked:bg-gold/20 peer h-5 w-5 rounded border after:absolute after:left-[5px] after:top-[2px] after:h-2.5 after:w-1.5 after:rotate-45 after:border-b-2 after:border-r-2 after:opacity-0 after:transition-opacity peer-checked:after:opacity-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"></div>
                            </label>

                            <SocialPlatformIcon platform={config.platform} className="h-8 w-8" />

                            <div className="flex-1">
                              <p className="text-ivory font-medium">
                                {PLATFORM_SPECS[config.platform].name}
                              </p>
                              {!hasAccount && (
                                <p className="text-xs text-red-400">Aucun compte connecté</p>
                              )}
                            </div>

                            {hasAccount && config.enabled && (
                              <button
                                onClick={() =>
                                  setExpandedPlatform(isExpanded ? null : config.platform)
                                }
                                className="text-ivory/60 hover:bg-gold/10 hover:text-ivory flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition"
                              >
                                Détails
                                <ChevronDown
                                  className={`h-4 w-4 transition ${isExpanded ? 'rotate-180' : ''}`}
                                />
                              </button>
                            )}
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {isExpanded && config.enabled && hasAccount && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-gold/10 overflow-hidden border-t"
                              >
                                <div className="space-y-4 p-4">
                                  {/* Account Selection */}
                                  <div>
                                    <label className="text-ivory/60 mb-2 block text-sm">
                                      Compte
                                    </label>
                                    <select
                                      value={config.accountId || ''}
                                      onChange={e =>
                                        updatePostConfig(config.platform, {
                                          accountId: e.target.value || null,
                                        })
                                      }
                                      className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-4 py-2 focus:outline-none"
                                    >
                                      <option value="">Sélectionner un compte</option>
                                      {platformAccounts.map(account => (
                                        <option key={account.id} value={account.id}>
                                          {account.accountName}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Individual Schedule */}
                                  {saveMode === 'schedule' && useIndividualSchedules && (
                                    <div className="space-y-3">
                                      <SuggestedTimeSlots
                                        platform={config.platform}
                                        articleDate={articleDate}
                                        selectedDate={config.scheduledAt}
                                        onSelect={date =>
                                          updatePostConfig(config.platform, {
                                            scheduledAt: date,
                                          })
                                        }
                                      />
                                      <div>
                                        <p className="text-ivory/40 mb-2 text-xs uppercase tracking-wider">
                                          Ou choisir manuellement
                                        </p>
                                        <input
                                          type="datetime-local"
                                          value={
                                            config.scheduledAt
                                              ? formatDateTimeLocal(config.scheduledAt)
                                              : ''
                                          }
                                          onChange={e => {
                                            const date = e.target.value
                                              ? new Date(e.target.value)
                                              : null;
                                            updatePostConfig(config.platform, {
                                              scheduledAt: date,
                                            });
                                          }}
                                          min={formatDateTimeLocal(new Date())}
                                          className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-4 py-2 focus:outline-none"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Content Preview */}
                                  <div>
                                    <label className="text-ivory/60 mb-2 block text-sm">
                                      Aperçu du contenu
                                    </label>
                                    <div className="border-gold/10 bg-night/30 rounded-lg border p-3">
                                      <p className="text-ivory/80 line-clamp-4 whitespace-pre-wrap text-sm">
                                        {config.content}
                                      </p>
                                      {config.hashtags.length > 0 && (
                                        <p className="text-gold/70 mt-2 text-sm">
                                          {config.hashtags.map(h => `#${h}`).join(' ')}
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
                        {needsScheduleDate && 'Veuillez sélectionner une date de publication.'}
                        {needsIndividualDates &&
                          "Certains posts n'ont pas de date de publication définie."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Save Results */}
                {saveResults.length > 0 && (
                  <div className="space-y-2">
                    {saveResults.map(result => (
                      <div
                        key={result.platform}
                        className={`flex items-center gap-3 rounded-lg p-3 ${
                          result.success
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
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
                            ? ' - Sauvegardé avec succès'
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
          <div className="border-gold/20 bg-night/50 flex items-center justify-between border-t px-6 py-4">
            <p className="text-ivory/50 text-sm">
              {enabledConfigsCount} post{enabledConfigsCount > 1 ? 's' : ''} à sauvegarder
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="border-gold/20 text-ivory/70 hover:border-gold/40 hover:text-ivory rounded-lg border px-4 py-2 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave || needsScheduleDate || needsIndividualDates}
                className="bg-gold/20 text-gold hover:bg-gold/30 flex items-center gap-2 rounded-lg px-6 py-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {saveMode === 'draft' && 'Sauvegarder en brouillon'}
                    {saveMode === 'schedule' && 'Programmer'}
                    {saveMode === 'now' && 'Publier maintenant'}
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
