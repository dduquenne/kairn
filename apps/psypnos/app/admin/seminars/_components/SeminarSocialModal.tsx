'use client';

import {
  Share2,
  Sparkles,
  Loader2,
  Check,
  Copy,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Settings2,
  Send,
  Calendar,
} from 'lucide-react';
import { useState, useCallback, useEffect, useMemo } from 'react';

import { CONTENT_TONES, CONTENT_ANGLES } from '@/lib/social/prompts';
import type {
  SocialPlatform,
  ContentTone,
  ContentAngle,
  SeminarInstagramFormat,
  SeminarLinkedInFormat,
  SeminarFacebookFormat,
  SeminarThreadsFormat,
  SeminarUrgencyLevel,
} from '@/lib/social/types';

import { SocialPlatformIcon } from '../../social/accounts/_components/SocialPlatformIcon';
import type { Seminar } from '../types';

interface GeneratedContent {
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
  characterCount?: number;
}

interface SocialAccountInfo {
  id: string;
  platform: SocialPlatform;
  accountName: string;
  isActive: boolean;
}

interface SeminarSocialModalProps {
  seminar: Seminar;
  open: boolean;
  onClose: () => void;
}

const PLATFORMS: Array<{ id: SocialPlatform; name: string }> = [
  { id: 'FACEBOOK', name: 'Facebook' },
  { id: 'LINKEDIN', name: 'LinkedIn' },
  { id: 'INSTAGRAM', name: 'Instagram' },
  { id: 'TWITTER', name: 'Twitter/X' },
  { id: 'THREADS', name: 'Threads' },
];

// Options de formats par plateforme
const INSTAGRAM_FORMATS: Array<{ id: SeminarInstagramFormat; name: string; description: string }> =
  [
    {
      id: 'compte_rebours',
      name: 'Compte à rebours',
      description: "Créer l'urgence avec le nombre de jours/places",
    },
    {
      id: 'apercu_experience',
      name: "Aperçu de l'expérience",
      description: 'Faire vivre par anticipation',
    },
    {
      id: 'temoignage_passe',
      name: 'Témoignage passé',
      description: "Retour d'expérience d'un participant",
    },
    {
      id: 'question_reflexive',
      name: 'Question réflexive',
      description: 'Poser une question qui fait réfléchir',
    },
    {
      id: 'liste_benefices',
      name: 'Liste des bénéfices',
      description: 'Présenter ce que le participant va retirer',
    },
    {
      id: 'coulisses',
      name: 'Coulisses',
      description: "Montrer la préparation et l'envers du décor",
    },
  ];

const LINKEDIN_FORMATS: Array<{ id: SeminarLinkedInFormat; name: string; description: string }> = [
  {
    id: 'annonce_expert',
    name: 'Annonce expert',
    description: "Annoncer avec un positionnement d'expertise",
  },
  {
    id: 'probleme_solution',
    name: 'Problème-Solution',
    description: 'Identifier un problème + présenter le séminaire',
  },
  {
    id: 'observation_terrain',
    name: 'Observation terrain',
    description: 'Partager une observation professionnelle',
  },
  {
    id: 'invitation_reflexion',
    name: 'Invitation réflexion',
    description: "Question qui ouvre sur l'invitation",
  },
  {
    id: 'programme_detaille',
    name: 'Programme détaillé',
    description: 'Présenter le programme de manière structurée',
  },
  {
    id: 'derniere_chance',
    name: 'Dernière chance',
    description: "Créer l'urgence pour les dernières places",
  },
];

const FACEBOOK_FORMATS: Array<{ id: SeminarFacebookFormat; name: string; description: string }> = [
  {
    id: 'invitation_chaleureuse',
    name: 'Invitation chaleureuse',
    description: 'Ton conversationnel et accueillant',
  },
  {
    id: 'histoire_transformation',
    name: 'Histoire de transformation',
    description: "Récit d'un participant passé",
  },
  {
    id: 'question_engagement',
    name: 'Question engagement',
    description: 'Poser une question pour engager',
  },
  {
    id: 'details_pratiques',
    name: 'Détails pratiques',
    description: 'Présenter les informations concrètes',
  },
  { id: 'derniers_jours', name: 'Derniers jours', description: 'Urgence bienveillante' },
  {
    id: 'partage_vision',
    name: 'Partage de vision',
    description: 'Expliquer pourquoi ce séminaire existe',
  },
];

const THREADS_FORMATS: Array<{ id: SeminarThreadsFormat; name: string; description: string }> = [
  {
    id: 'pensee_spontanee',
    name: 'Pensée spontanée',
    description: 'Réflexion naturelle sur le séminaire',
  },
  {
    id: 'micro_confession',
    name: 'Micro confession',
    description: 'Partage personnel du praticien',
  },
  {
    id: 'question_ouverte',
    name: 'Question ouverte',
    description: 'Question sans réponse directe',
  },
  {
    id: 'fragment_anticipation',
    name: "Fragment d'anticipation",
    description: "Évocation poétique de l'expérience",
  },
  { id: 'rappel_humain', name: 'Rappel humain', description: 'Rappel simple et authentique' },
];

const URGENCY_LEVELS: Array<{ level: SeminarUrgencyLevel; name: string; description: string }> = [
  { level: 1, name: 'Annonce douce', description: "Première annonce, pas d'urgence" },
  { level: 2, name: 'Invitation ouverte', description: 'Invitation avec mention des places' },
  { level: 3, name: 'Rappel engagé', description: 'Rappel avec mention du remplissage' },
  { level: 4, name: 'Dernières places', description: 'Urgence marquée, peu de places' },
  { level: 5, name: 'Dernière chance', description: 'Ultime appel avant clôture' },
];

export function SeminarSocialModal({ seminar, open, onClose }: SeminarSocialModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
    'FACEBOOK',
    'LINKEDIN',
    'INSTAGRAM',
  ]);
  const [selectedTone, setSelectedTone] = useState<ContentTone>('inspirant');
  const [selectedAngle, setSelectedAngle] = useState<ContentAngle>('benefices');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generations, setGenerations] = useState<GeneratedContent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<SocialPlatform | null>(null);

  // Création de posts
  const [accounts, setAccounts] = useState<SocialAccountInfo[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Record<SocialPlatform, string>>(
    {} as Record<SocialPlatform, string>
  );
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdPlatforms, setCreatedPlatforms] = useState<SocialPlatform[]>([]);

  // Options avancées
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [instagramFormat, setInstagramFormat] = useState<SeminarInstagramFormat | 'auto'>('auto');
  const [linkedinFormat, setLinkedinFormat] = useState<SeminarLinkedInFormat | 'auto'>('auto');
  const [facebookFormat, setFacebookFormat] = useState<SeminarFacebookFormat | 'auto'>('auto');
  const [threadsFormat, setThreadsFormat] = useState<SeminarThreadsFormat | 'auto'>('auto');
  const [urgencyLevel, setUrgencyLevel] = useState<SeminarUrgencyLevel | 'auto'>('auto');
  const [placesRemaining, setPlacesRemaining] = useState<string>('');

  // Calcul des jours avant l'événement
  const daysUntilEvent = useMemo(() => {
    const start = new Date(seminar.startAt);
    const now = new Date();
    const diffTime = start.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [seminar.startAt]);

  // Charger les comptes sociaux actifs à l'ouverture du modal
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function fetchAccounts() {
      try {
        const response = await fetch('/api/social/accounts?active=true');
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;

        const activeAccounts: SocialAccountInfo[] = (data.accounts || []).map(
          (a: {
            id: string;
            platform: SocialPlatform;
            accountName: string;
            isActive: boolean;
          }) => ({
            id: a.id,
            platform: a.platform,
            accountName: a.accountName,
            isActive: a.isActive,
          })
        );
        setAccounts(activeAccounts);

        // Auto-sélectionner le premier compte actif par plateforme
        const autoSelected: Record<string, string> = {};
        for (const account of activeAccounts) {
          if (!autoSelected[account.platform]) {
            autoSelected[account.platform] = account.id;
          }
        }
        setSelectedAccounts(autoSelected as Record<SocialPlatform, string>);
      } catch {
        // Silencieux - les comptes ne sont pas critiques pour la génération
      }
    }

    void fetchAccounts();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const togglePlatform = (platform: SocialPlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const handleGenerate = useCallback(async () => {
    if (selectedPlatforms.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      const requestBody: Record<string, unknown> = {
        seminarId: seminar.id,
        platforms: selectedPlatforms,
        tone: selectedTone,
        angle: selectedAngle,
        customInstructions: customInstructions.trim() || undefined,
      };

      // Ajouter les options avancées si elles ne sont pas en mode "auto"
      if (instagramFormat !== 'auto') {
        requestBody.instagramFormat = instagramFormat;
      }
      if (linkedinFormat !== 'auto') {
        requestBody.linkedinFormat = linkedinFormat;
      }
      if (facebookFormat !== 'auto') {
        requestBody.facebookFormat = facebookFormat;
      }
      if (threadsFormat !== 'auto') {
        requestBody.threadsFormat = threadsFormat;
      }
      if (urgencyLevel !== 'auto') {
        requestBody.urgencyLevel = urgencyLevel;
      }
      if (placesRemaining && !isNaN(parseInt(placesRemaining))) {
        requestBody.placesRemaining = parseInt(placesRemaining);
      }

      const response = await fetch('/api/social/generate-seminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération');
      }

      setGenerations(
        data.generations.map((gen: GeneratedContent) => ({
          ...gen,
          characterCount: gen.content.length,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsGenerating(false);
    }
  }, [
    seminar.id,
    selectedPlatforms,
    selectedTone,
    selectedAngle,
    customInstructions,
    instagramFormat,
    linkedinFormat,
    facebookFormat,
    threadsFormat,
    urgencyLevel,
    placesRemaining,
  ]);

  const handleCopy = async (content: string, hashtags: string[], platform: SocialPlatform) => {
    const fullContent = `${content}\n\n${hashtags.map(h => `#${h}`).join(' ')}`;
    await navigator.clipboard.writeText(fullContent);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  /**
   * Crée les posts sociaux en base via l'API pour chaque plateforme générée
   */
  const handleCreatePosts = useCallback(async () => {
    if (generations.length === 0) return;

    setIsCreating(true);
    setCreateError(null);
    const created: SocialPlatform[] = [];

    try {
      for (const gen of generations) {
        const accountId = selectedAccounts[gen.platform];
        if (!accountId) continue;

        const body: Record<string, unknown> = {
          accountId,
          platform: gen.platform,
          content: gen.content,
          hashtags: gen.hashtags,
          generatedBy: 'ai',
          aiModel: 'claude-sonnet-4-5-20250929',
          metadata: { seminarId: seminar.id, seminarTitle: seminar.title },
        };

        if (scheduledAt) {
          body.scheduledAt = new Date(scheduledAt).toISOString();
        }

        const response = await fetch('/api/social/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Erreur lors de la création du post ${gen.platform}`);
        }

        created.push(gen.platform);
      }

      setCreatedPlatforms(created);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erreur inconnue');
      // Conserver les plateformes déjà créées pour feedback partiel
      setCreatedPlatforms(created);
    } finally {
      setIsCreating(false);
    }
  }, [generations, selectedAccounts, scheduledAt, seminar.id, seminar.title]);

  /** Comptes disponibles pour les plateformes générées */
  const accountsForPlatform = useCallback(
    (platform: SocialPlatform) => accounts.filter(a => a.platform === platform),
    [accounts]
  );

  /** Vérifie si toutes les plateformes générées ont un compte sélectionné */
  const canCreatePosts = useMemo(() => {
    if (generations.length === 0) return false;
    return generations.every(gen => selectedAccounts[gen.platform]);
  }, [generations, selectedAccounts]);

  const formatDateRange = (startAt: string, endAt: string): string => {
    try {
      const start = new Date(startAt);
      const end = new Date(endAt);
      const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      return `${dateFormatter.format(start)} - ${dateFormatter.format(end)}`;
    } catch {
      return `${startAt} - ${endAt}`;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="bg-night/80 absolute inset-0 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="border-gold/20 from-night/95 to-night/90 relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border bg-gradient-to-br shadow-2xl">
        {/* Header */}
        <div className="border-gold/10 bg-night/95 sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="bg-gold/10 flex h-10 w-10 items-center justify-center rounded-full">
              <Share2 className="text-gold h-5 w-5" />
            </div>
            <div>
              <h2 className="text-ivory text-lg font-semibold">Diffusion réseaux sociaux</h2>
              <p className="text-ivory/60 text-sm">
                Générer des posts pour promouvoir ce séminaire
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ivory/60 hover:bg-gold/10 hover:text-ivory rounded-lg p-2 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Seminar Info */}
          <div className="border-gold/10 bg-night/40 rounded-xl border p-4">
            <h3 className="text-gold font-medium">{seminar.title}</h3>
            <p className="text-ivory/70 mt-1 line-clamp-2 text-sm">{seminar.description}</p>
            <div className="text-ivory/50 mt-2 flex flex-wrap gap-2 text-xs">
              <span>{formatDateRange(seminar.startAt, seminar.endAt)}</span>
              <span>•</span>
              <span>{seminar.capacity} places</span>
              {seminar.price && (
                <>
                  <span>•</span>
                  <span>{seminar.price}€</span>
                </>
              )}
              <span>•</span>
              <span className={daysUntilEvent <= 7 ? 'text-amber-400' : ''}>
                J-{daysUntilEvent}
              </span>
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <p className="text-ivory mb-3 text-sm font-medium">Plateformes</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(platform => {
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isSelected
                        ? 'bg-gold/20 text-gold ring-gold/30 ring-1'
                        : 'bg-night/60 text-ivory/60 hover:bg-gold/10 hover:text-ivory'
                    }`}
                  >
                    <SocialPlatformIcon platform={platform.id} className="h-4 w-4" />
                    {platform.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tone & Angle */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-ivory mb-2 block text-sm font-medium">Ton</label>
              <select
                value={selectedTone}
                onChange={e => setSelectedTone(e.target.value as ContentTone)}
                className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-3 py-2 text-sm transition focus:outline-none"
              >
                {Object.values(CONTENT_TONES).map(tone => (
                  <option key={tone.id} value={tone.id}>
                    {tone.name} - {tone.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-ivory mb-2 block text-sm font-medium">Angle</label>
              <select
                value={selectedAngle}
                onChange={e => setSelectedAngle(e.target.value as ContentAngle)}
                className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-3 py-2 text-sm transition focus:outline-none"
              >
                {Object.values(CONTENT_ANGLES).map(angle => (
                  <option key={angle.id} value={angle.id}>
                    {angle.name} - {angle.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="border-gold/10 bg-night/30 text-ivory/80 hover:bg-night/40 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm transition"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="text-gold h-4 w-4" />
              <span>Options avancées</span>
              <span className="text-ivory/50 text-xs">(formats par plateforme, urgence)</span>
            </div>
            {showAdvancedOptions ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* Advanced Options Panel */}
          {showAdvancedOptions && (
            <div className="border-gold/10 bg-night/30 space-y-4 rounded-lg border p-4">
              {/* Urgency Level & Places Remaining */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-ivory mb-2 block text-sm font-medium">
                    Niveau d&apos;urgence
                  </label>
                  <select
                    value={urgencyLevel}
                    onChange={e =>
                      setUrgencyLevel(
                        e.target.value === 'auto'
                          ? 'auto'
                          : (parseInt(e.target.value) as SeminarUrgencyLevel)
                      )
                    }
                    className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-3 py-2 text-sm transition focus:outline-none"
                  >
                    <option value="auto">Automatique (selon les dates)</option>
                    {URGENCY_LEVELS.map(level => (
                      <option key={level.level} value={level.level}>
                        {level.level}/5 - {level.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-ivory mb-2 block text-sm font-medium">
                    Places restantes (optionnel)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={seminar.capacity}
                    value={placesRemaining}
                    onChange={e => setPlacesRemaining(e.target.value)}
                    placeholder={`Max: ${seminar.capacity}`}
                    className="border-gold/20 bg-night/50 text-ivory placeholder:text-ivory/30 focus:border-gold w-full rounded-lg border px-3 py-2 text-sm transition focus:outline-none"
                  />
                </div>
              </div>

              {/* Platform-specific formats */}
              <div className="border-gold/10 border-t pt-4">
                <p className="text-ivory mb-3 text-sm font-medium">Formats par plateforme</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Instagram Format */}
                  {selectedPlatforms.includes('INSTAGRAM') && (
                    <div>
                      <label className="text-ivory/70 mb-1 flex items-center gap-2 text-xs font-medium">
                        <SocialPlatformIcon platform="INSTAGRAM" className="h-3 w-3" />
                        Instagram
                      </label>
                      <select
                        value={instagramFormat}
                        onChange={e =>
                          setInstagramFormat(e.target.value as SeminarInstagramFormat | 'auto')
                        }
                        className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-3 py-2 text-xs transition focus:outline-none"
                      >
                        <option value="auto">Automatique</option>
                        {INSTAGRAM_FORMATS.map(format => (
                          <option key={format.id} value={format.id}>
                            {format.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* LinkedIn Format */}
                  {selectedPlatforms.includes('LINKEDIN') && (
                    <div>
                      <label className="text-ivory/70 mb-1 flex items-center gap-2 text-xs font-medium">
                        <SocialPlatformIcon platform="LINKEDIN" className="h-3 w-3" />
                        LinkedIn
                      </label>
                      <select
                        value={linkedinFormat}
                        onChange={e =>
                          setLinkedinFormat(e.target.value as SeminarLinkedInFormat | 'auto')
                        }
                        className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-3 py-2 text-xs transition focus:outline-none"
                      >
                        <option value="auto">Automatique</option>
                        {LINKEDIN_FORMATS.map(format => (
                          <option key={format.id} value={format.id}>
                            {format.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Facebook Format */}
                  {selectedPlatforms.includes('FACEBOOK') && (
                    <div>
                      <label className="text-ivory/70 mb-1 flex items-center gap-2 text-xs font-medium">
                        <SocialPlatformIcon platform="FACEBOOK" className="h-3 w-3" />
                        Facebook
                      </label>
                      <select
                        value={facebookFormat}
                        onChange={e =>
                          setFacebookFormat(e.target.value as SeminarFacebookFormat | 'auto')
                        }
                        className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-3 py-2 text-xs transition focus:outline-none"
                      >
                        <option value="auto">Automatique</option>
                        {FACEBOOK_FORMATS.map(format => (
                          <option key={format.id} value={format.id}>
                            {format.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Threads Format */}
                  {selectedPlatforms.includes('THREADS') && (
                    <div>
                      <label className="text-ivory/70 mb-1 flex items-center gap-2 text-xs font-medium">
                        <SocialPlatformIcon platform="THREADS" className="h-3 w-3" />
                        Threads
                      </label>
                      <select
                        value={threadsFormat}
                        onChange={e =>
                          setThreadsFormat(e.target.value as SeminarThreadsFormat | 'auto')
                        }
                        className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-3 py-2 text-xs transition focus:outline-none"
                      >
                        <option value="auto">Automatique</option>
                        {THREADS_FORMATS.map(format => (
                          <option key={format.id} value={format.id}>
                            {format.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Custom Instructions */}
          <div>
            <label className="text-ivory mb-2 block text-sm font-medium">
              Instructions personnalisées (optionnel)
            </label>
            <textarea
              value={customInstructions}
              onChange={e => setCustomInstructions(e.target.value)}
              placeholder="Ex: Insister sur le côté unique de l'expérience, mentionner la réduction early bird..."
              rows={2}
              className="border-gold/20 bg-night/50 text-ivory placeholder:text-ivory/30 focus:border-gold w-full resize-none rounded-lg border px-3 py-2 text-sm transition focus:outline-none"
            />
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || selectedPlatforms.length === 0}
            className="bg-gold/20 text-gold hover:bg-gold/30 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Générer les posts ({selectedPlatforms.length} plateforme
                {selectedPlatforms.length > 1 ? 's' : ''})
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Generated Content */}
          {generations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-ivory text-sm font-medium">Contenu généré</p>
                <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                  {generations.length} post{generations.length > 1 ? 's' : ''} générés
                </span>
              </div>

              {generations.map(gen => {
                const isCreated = createdPlatforms.includes(gen.platform);
                return (
                  <div
                    key={gen.platform}
                    className={`overflow-hidden rounded-lg border ${
                      isCreated
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-gold/10 bg-night/40'
                    }`}
                  >
                    <div className="border-gold/10 flex items-center justify-between border-b px-4 py-2">
                      <div className="flex items-center gap-2">
                        <SocialPlatformIcon platform={gen.platform} className="h-4 w-4" />
                        <span className="text-ivory font-medium">
                          {PLATFORMS.find(p => p.id === gen.platform)?.name}
                        </span>
                        <span className="text-ivory/40 text-xs">
                          {gen.characterCount || gen.content.length} caractères
                        </span>
                        {isCreated && (
                          <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                            <Check className="h-3 w-3" />
                            Créé
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(gen.content, gen.hashtags, gen.platform)}
                        className="text-gold hover:bg-gold/10 flex items-center gap-1.5 rounded px-2 py-1 text-xs transition"
                      >
                        {copiedPlatform === gen.platform ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Copié !
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copier
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-4">
                      <p className="text-ivory/80 whitespace-pre-wrap text-sm">{gen.content}</p>
                      {gen.hashtags.length > 0 && (
                        <p className="text-gold/70 mt-3 text-sm">
                          {gen.hashtags.map(h => `#${h}`).join(' ')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Section création de posts sociaux */}
              {createdPlatforms.length < generations.length && (
                <div className="border-gold/20 bg-night/30 space-y-4 rounded-lg border p-4">
                  <p className="text-ivory text-sm font-medium">Créer comme posts sociaux</p>

                  {/* Sélection du compte par plateforme */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {generations.map(gen => {
                      const platformAccounts = accountsForPlatform(gen.platform);
                      if (createdPlatforms.includes(gen.platform)) return null;
                      return (
                        <div key={gen.platform}>
                          <label className="text-ivory/70 mb-1 flex items-center gap-2 text-xs font-medium">
                            <SocialPlatformIcon platform={gen.platform} className="h-3 w-3" />
                            {PLATFORMS.find(p => p.id === gen.platform)?.name}
                          </label>
                          {platformAccounts.length > 0 ? (
                            <select
                              value={selectedAccounts[gen.platform] || ''}
                              onChange={e =>
                                setSelectedAccounts(prev => ({
                                  ...prev,
                                  [gen.platform]: e.target.value,
                                }))
                              }
                              className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-3 py-2 text-xs transition focus:outline-none"
                            >
                              {platformAccounts.map(account => (
                                <option key={account.id} value={account.id}>
                                  {account.accountName}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
                              Aucun compte configuré
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Date de programmation */}
                  <div>
                    <label className="text-ivory/70 mb-1 flex items-center gap-2 text-xs font-medium">
                      <Calendar className="h-3 w-3" />
                      Programmer la publication (optionnel)
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={e => setScheduledAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-3 py-2 text-xs transition focus:outline-none"
                    />
                    {!scheduledAt && (
                      <p className="text-ivory/40 mt-1 text-xs">
                        Sans date, les posts seront créés en brouillon.
                      </p>
                    )}
                  </div>

                  {/* Erreur de création */}
                  {createError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                      <p className="text-xs text-red-400">{createError}</p>
                    </div>
                  )}

                  {/* Bouton créer */}
                  <button
                    type="button"
                    onClick={handleCreatePosts}
                    disabled={isCreating || !canCreatePosts}
                    className="bg-gold/20 text-gold hover:bg-gold/30 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Créer {generations.length - createdPlatforms.length} post
                        {generations.length - createdPlatforms.length > 1 ? 's' : ''}
                        {scheduledAt ? ' programmés' : ' en brouillon'}
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Succès total */}
              {createdPlatforms.length > 0 && createdPlatforms.length === generations.length && (
                <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                  <Check className="h-5 w-5 text-green-400" />
                  <p className="text-sm text-green-400">
                    {createdPlatforms.length} post{createdPlatforms.length > 1 ? 's' : ''} créé
                    {createdPlatforms.length > 1 ? 's' : ''}{' '}
                    {scheduledAt ? 'et programmés' : 'en brouillon'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
