'use client';

export const dynamic = 'force-dynamic';

import { motion } from 'framer-motion';
import {
  Sparkles,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Check,
  Copy,
  RotateCcw,
  Save,
  FileText,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, useRef } from 'react';

import { CONTENT_TONES, CONTENT_ANGLES } from '@/lib/social/prompts';
import { FACEBOOK_FORMATS, FACEBOOK_TONE_LEVELS } from '@/lib/social/prompts/facebook-specs';
import { INSTAGRAM_FORMATS, AUTHENTICITY_LEVELS } from '@/lib/social/prompts/instagram-specs';
import { LINKEDIN_FORMATS, LINKEDIN_EXPERTISE_LEVELS } from '@/lib/social/prompts/linkedin-specs';
import { THREADS_FORMATS, THREADS_AUTHENTICITY_LEVELS } from '@/lib/social/prompts/threads-specs';
import type {
  SocialPlatform,
  ContentTone,
  ContentAngle,
  GeneratedContent,
  InstagramPostFormat,
  AuthenticityLevel,
  ThreadsPostFormat,
  ThreadsAuthenticityLevel,
  FacebookPostFormat,
  FacebookToneLevel,
  LinkedInPostFormat,
  LinkedInExpertiseLevel,
} from '@/lib/social/types';
import { useToast } from '@/lib/toast-context';

import { SocialPlatformIcon } from '../../accounts/_components/SocialPlatformIcon';

import { ArticleSelector } from './_components/ArticleSelector';
import { GeneratedContentPreview } from './_components/GeneratedContentPreview';
import { SavePostModal } from './_components/SavePostModal';

// ===========================================
// Types
// ===========================================

interface BlogPost {
  slug: string;
  title: string;
  category: string;
  description: string;
  date: string;
  published: boolean;
  image?: string;
}

interface GenerationState {
  isGenerating: boolean;
  generations: GeneratedContent[];
  error: string | null;
  tokensUsed: number;
}

// ===========================================
// Constants
// ===========================================

const AVAILABLE_PLATFORMS: Array<{
  id: SocialPlatform;
  name: string;
  description: string;
}> = [
  {
    id: 'FACEBOOK',
    name: 'Facebook',
    description: 'Posts pour Pages Facebook',
  },
  {
    id: 'LINKEDIN',
    name: 'LinkedIn',
    description: 'Posts professionnels',
  },
  {
    id: 'INSTAGRAM',
    name: 'Instagram',
    description: 'Captions Instagram',
  },
  {
    id: 'TWITTER',
    name: 'Twitter/X',
    description: 'Tweets courts et percutants',
  },
  {
    id: 'THREADS',
    name: 'Threads',
    description: 'Posts conversationnels',
  },
];

// ===========================================
// Main Component
// ===========================================

export default function NewSocialPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  // Récupérer le blogSlug et les plateformes depuis l'URL pour pré-sélection
  const blogSlugFromUrl = searchParams?.get('blogSlug') ?? null;
  const platformsFromUrl = searchParams?.get('platforms') ?? null;

  /**
   * Parse les plateformes depuis le paramètre URL.
   * Retourne les plateformes par défaut si le paramètre est absent ou invalide.
   */
  const parsePlatformsFromUrl = (): SocialPlatform[] => {
    if (!platformsFromUrl) return ['FACEBOOK', 'LINKEDIN', 'INSTAGRAM'];
    const validPlatforms: SocialPlatform[] = [
      'FACEBOOK',
      'LINKEDIN',
      'INSTAGRAM',
      'TWITTER',
      'THREADS',
    ];
    const parsed = platformsFromUrl
      .split(',')
      .filter((p): p is SocialPlatform => validPlatforms.includes(p as SocialPlatform));
    return parsed.length > 0 ? parsed : ['FACEBOOK', 'LINKEDIN', 'INSTAGRAM'];
  };

  // Form state
  const [selectedArticle, setSelectedArticle] = useState<BlogPost | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] =
    useState<SocialPlatform[]>(parsePlatformsFromUrl());
  const [selectedTone, setSelectedTone] = useState<ContentTone>('inspirant');
  const [selectedAngle, setSelectedAngle] = useState<ContentAngle>('benefices');
  const [customInstructions, setCustomInstructions] = useState('');

  // Options spécifiques Instagram
  const [instagramFormat, setInstagramFormat] = useState<InstagramPostFormat>('hook_reveal');
  const [authenticityLevel, setAuthenticityLevel] = useState<AuthenticityLevel>(3);

  // Options spécifiques Threads
  const [threadsFormat, setThreadsFormat] = useState<ThreadsPostFormat>('pensee_brute');
  const [threadsAuthenticityLevel, setThreadsAuthenticityLevel] =
    useState<ThreadsAuthenticityLevel>(3);

  // Options spécifiques Facebook
  const [facebookFormat, setFacebookFormat] = useState<FacebookPostFormat>('confession');
  const [facebookToneLevel, setFacebookToneLevel] = useState<FacebookToneLevel>(2);

  // Options spécifiques LinkedIn
  const [linkedinFormat, setLinkedinFormat] = useState<LinkedInPostFormat>('observation_pro');
  const [linkedinExpertiseLevel, setLinkedinExpertiseLevel] = useState<LinkedInExpertiseLevel>(3);

  // Vérifier si Instagram, Threads, Facebook ou LinkedIn est sélectionné
  const isInstagramSelected = selectedPlatforms.includes('INSTAGRAM');
  const isThreadsSelected = selectedPlatforms.includes('THREADS');
  const isFacebookSelected = selectedPlatforms.includes('FACEBOOK');
  const isLinkedInSelected = selectedPlatforms.includes('LINKEDIN');

  // Generation state
  const [generation, setGeneration] = useState<GenerationState>({
    isGenerating: false,
    generations: [],
    error: null,
    tokensUsed: 0,
  });

  // Save modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Articles state
  const [articles, setArticles] = useState<BlogPost[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);

  // Ref pour suivre le dernier slug traité (évite les re-sélections indésirables)
  const lastProcessedSlugRef = useRef<string | null>(null);

  // Load articles on mount
  useEffect(() => {
    async function loadArticles() {
      try {
        const response = await fetch('/api/blog/posts?includeUnpublished=false&t=' + Date.now(), {
          cache: 'no-store',
        });

        if (!response.ok) throw new Error('Failed to fetch articles');

        const data = await response.json();
        setArticles(data);
      } catch (error) {
        console.error('Error loading articles:', error);
        addToast({
          title: 'Impossible de charger les articles',
          variant: 'error',
        });
      } finally {
        setIsLoadingArticles(false);
      }
    }

    loadArticles();
  }, [addToast]);

  // Pré-sélectionner l'article si un blogSlug est fourni dans l'URL
  useEffect(() => {
    // Ne traiter que si on a un nouveau slug différent du dernier traité
    if (
      blogSlugFromUrl &&
      articles.length > 0 &&
      blogSlugFromUrl !== lastProcessedSlugRef.current
    ) {
      const article = articles.find(a => a.slug === blogSlugFromUrl);
      if (article) {
        lastProcessedSlugRef.current = blogSlugFromUrl;
        setSelectedArticle(article);
        addToast({
          title: 'Article pré-sélectionné',
          description: article.title,
          variant: 'info',
        });
      }
    }
  }, [blogSlugFromUrl, articles, addToast]);

  // Toggle platform selection
  const togglePlatform = useCallback((platform: SocialPlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  }, []);

  // Generate content
  const handleGenerate = useCallback(async () => {
    if (!selectedArticle) {
      addToast({
        title: 'Veuillez sélectionner un article',
        variant: 'error',
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      addToast({
        title: 'Veuillez sélectionner au moins une plateforme',
        variant: 'error',
      });
      return;
    }

    setGeneration({
      isGenerating: true,
      generations: [],
      error: null,
      tokensUsed: 0,
    });

    try {
      const response = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogSlug: selectedArticle.slug,
          platforms: selectedPlatforms,
          tone: selectedTone,
          angle: selectedAngle,
          customInstructions: customInstructions || undefined,
          // Options spécifiques Instagram
          instagramFormat: isInstagramSelected ? instagramFormat : undefined,
          authenticityLevel: isInstagramSelected ? authenticityLevel : undefined,
          // Options spécifiques Threads
          threadsFormat: isThreadsSelected ? threadsFormat : undefined,
          threadsAuthenticityLevel: isThreadsSelected ? threadsAuthenticityLevel : undefined,
          // Options spécifiques Facebook
          facebookFormat: isFacebookSelected ? facebookFormat : undefined,
          facebookToneLevel: isFacebookSelected ? facebookToneLevel : undefined,
          // Options spécifiques LinkedIn
          linkedinFormat: isLinkedInSelected ? linkedinFormat : undefined,
          linkedinExpertiseLevel: isLinkedInSelected ? linkedinExpertiseLevel : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération');
      }

      setGeneration({
        isGenerating: false,
        generations: data.generations,
        error: null,
        tokensUsed: data.totalTokensUsed,
      });

      addToast({
        title: 'Contenu généré avec succès',
        description: `${data.generations.length} post(s) créé(s)`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Generation error:', error);
      setGeneration(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }));

      addToast({
        title: 'Erreur de génération',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'error',
      });
    }
  }, [
    selectedArticle,
    selectedPlatforms,
    selectedTone,
    selectedAngle,
    customInstructions,
    isInstagramSelected,
    instagramFormat,
    authenticityLevel,
    isThreadsSelected,
    threadsFormat,
    threadsAuthenticityLevel,
    isFacebookSelected,
    facebookFormat,
    facebookToneLevel,
    isLinkedInSelected,
    linkedinFormat,
    linkedinExpertiseLevel,
    addToast,
  ]);

  // Update generated content
  const handleUpdateContent = useCallback((platform: SocialPlatform, newContent: string) => {
    setGeneration(prev => ({
      ...prev,
      generations: prev.generations.map(g =>
        g.platform === platform ? { ...g, content: newContent } : g
      ),
    }));
  }, []);

  // Copy content to clipboard
  const handleCopyContent = useCallback(
    async (content: string) => {
      try {
        await navigator.clipboard.writeText(content);
        addToast({
          title: 'Contenu copié',
          variant: 'success',
        });
      } catch {
        addToast({
          title: 'Erreur lors de la copie',
          variant: 'error',
        });
      }
    },
    [addToast]
  );

  // Handle save success
  const handleSaveSuccess = useCallback(() => {
    addToast({
      title: 'Posts sauvegardés',
      description: 'Les posts ont été ajoutés au calendrier de publication',
      variant: 'success',
    });
    // Reset generation state
    setGeneration({
      isGenerating: false,
      generations: [],
      error: null,
      tokensUsed: 0,
    });
    // Redirect to calendar
    router.push('/admin/social/calendar');
  }, [addToast, router]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-ivory/70 hover:bg-gold/10 hover:text-ivory rounded-lg p-2 transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-gold text-sm uppercase tracking-[0.3em]">Réseaux sociaux</p>
            <h1 className="text-ivory mt-2 text-3xl font-semibold">Générer du contenu</h1>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column - Configuration */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6"
        >
          {/* Article Selection - z-index élevé pour que le dropdown passe au-dessus des autres panneaux */}
          <div className="border-gold/20 from-night/60 to-night/40 relative z-50 rounded-lg border bg-gradient-to-br p-6 backdrop-blur-sm">
            <h2 className="text-ivory mb-4 flex items-center gap-2 text-lg font-semibold">
              <FileText className="text-gold h-5 w-5" />
              Article source
            </h2>

            <ArticleSelector
              articles={articles}
              isLoading={isLoadingArticles}
              selectedArticle={selectedArticle}
              onSelect={setSelectedArticle}
            />
          </div>

          {/* Platform Selection - z-index plus bas pour rester en dessous du dropdown d'article */}
          <div className="border-gold/20 from-night/60 to-night/40 relative z-10 rounded-lg border bg-gradient-to-br p-6 backdrop-blur-sm">
            <h2 className="text-ivory mb-4 text-lg font-semibold">Plateformes cibles</h2>

            <div className="space-y-3">
              {AVAILABLE_PLATFORMS.map(platform => (
                <label
                  key={platform.id}
                  className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition ${
                    selectedPlatforms.includes(platform.id)
                      ? 'border-gold/40 bg-gold/10'
                      : 'border-gold/10 bg-night/30 hover:border-gold/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(platform.id)}
                    onChange={() => togglePlatform(platform.id)}
                    className="sr-only"
                  />
                  <SocialPlatformIcon platform={platform.id} className="h-8 w-8" />
                  <div className="flex-1">
                    <p className="text-ivory font-medium">{platform.name}</p>
                    <p className="text-ivory/60 text-sm">{platform.description}</p>
                  </div>
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded border transition ${
                      selectedPlatforms.includes(platform.id)
                        ? 'border-gold bg-gold text-night'
                        : 'border-ivory/30'
                    }`}
                  >
                    {selectedPlatforms.includes(platform.id) && <Check className="h-4 w-4" />}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Tone & Angle */}
          <div className="border-gold/20 from-night/60 to-night/40 rounded-lg border bg-gradient-to-br p-6 backdrop-blur-sm">
            <h2 className="text-ivory mb-4 text-lg font-semibold">Ton et angle</h2>

            <div className="space-y-4">
              {/* Tone Selection */}
              <div>
                <label className="text-ivory/80 mb-2 block text-sm font-medium">Ton</label>
                <select
                  value={selectedTone}
                  onChange={e => setSelectedTone(e.target.value as ContentTone)}
                  className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-4 py-3 transition focus:outline-none"
                >
                  {Object.values(CONTENT_TONES).map(tone => (
                    <option key={tone.id} value={tone.id}>
                      {tone.name} - {tone.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Angle Selection */}
              <div>
                <label className="text-ivory/80 mb-2 block text-sm font-medium">Angle</label>
                <select
                  value={selectedAngle}
                  onChange={e => setSelectedAngle(e.target.value as ContentAngle)}
                  className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-4 py-3 transition focus:outline-none"
                >
                  {Object.values(CONTENT_ANGLES).map(angle => (
                    <option key={angle.id} value={angle.id}>
                      {angle.name} - {angle.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Instructions */}
              <div>
                <label className="text-ivory/80 mb-2 block text-sm font-medium">
                  Instructions personnalisées <span className="text-ivory/50">(optionnel)</span>
                </label>
                <textarea
                  value={customInstructions}
                  onChange={e => setCustomInstructions(e.target.value)}
                  placeholder="Ex: Mettre l'accent sur l'aspect pratique, mentionner une promotion en cours..."
                  rows={3}
                  className="border-gold/20 bg-night/50 text-ivory placeholder-ivory/40 focus:border-gold w-full resize-none rounded-lg border px-4 py-3 transition focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Instagram Options - Affiché uniquement si Instagram est sélectionné */}
          {isInstagramSelected && (
            <div className="border-gold/20 from-night/60 to-night/40 rounded-lg border bg-gradient-to-br p-6 backdrop-blur-sm">
              <h2 className="text-ivory mb-4 flex items-center gap-2 text-lg font-semibold">
                <SocialPlatformIcon platform="INSTAGRAM" className="h-5 w-5" />
                Options Instagram
              </h2>

              <div className="space-y-4">
                {/* Format Selection */}
                <div>
                  <label className="text-ivory/80 mb-2 block text-sm font-medium">
                    Format de post
                  </label>
                  <select
                    value={instagramFormat}
                    onChange={e => setInstagramFormat(e.target.value as InstagramPostFormat)}
                    className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-4 py-3 transition focus:outline-none"
                  >
                    {Object.values(INSTAGRAM_FORMATS).map(format => (
                      <option key={format.id} value={format.id}>
                        {format.name} - {format.description}
                      </option>
                    ))}
                  </select>
                  <p className="text-ivory/50 mt-2 text-xs">
                    {INSTAGRAM_FORMATS[instagramFormat].bestFor.join(' • ')}
                  </p>
                </div>

                {/* Authenticity Level */}
                <div>
                  <label className="text-ivory/80 mb-2 block text-sm font-medium">
                    Niveau d&apos;authenticité:{' '}
                    <span className="text-gold">{AUTHENTICITY_LEVELS[authenticityLevel].name}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={authenticityLevel}
                    onChange={e =>
                      setAuthenticityLevel(Number(e.target.value) as AuthenticityLevel)
                    }
                    className="accent-gold w-full"
                  />
                  <div className="text-ivory/50 mt-1 flex justify-between text-xs">
                    <span>Professionnel</span>
                    <span>Vulnérable</span>
                  </div>
                  <p className="text-ivory/50 mt-2 text-xs">
                    {AUTHENTICITY_LEVELS[authenticityLevel].description}
                  </p>
                </div>

                {/* Format Preview */}
                <div className="bg-night/30 rounded-lg p-4">
                  <p className="text-gold/70 mb-2 text-xs font-medium uppercase tracking-wider">
                    Exemple de structure
                  </p>
                  <pre className="text-ivory/70 whitespace-pre-wrap text-xs">
                    {INSTAGRAM_FORMATS[instagramFormat].example.slice(0, 300)}...
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Threads Options - Affiché uniquement si Threads est sélectionné */}
          {isThreadsSelected && (
            <div className="border-gold/20 from-night/60 to-night/40 rounded-lg border bg-gradient-to-br p-6 backdrop-blur-sm">
              <h2 className="text-ivory mb-4 flex items-center gap-2 text-lg font-semibold">
                <SocialPlatformIcon platform="THREADS" className="h-5 w-5" />
                Options Threads
              </h2>

              <div className="space-y-4">
                {/* Format Selection */}
                <div>
                  <label className="text-ivory/80 mb-2 block text-sm font-medium">
                    Format de post
                  </label>
                  <select
                    value={threadsFormat}
                    onChange={e => setThreadsFormat(e.target.value as ThreadsPostFormat)}
                    className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-4 py-3 transition focus:outline-none"
                  >
                    {Object.values(THREADS_FORMATS).map(format => (
                      <option key={format.id} value={format.id}>
                        {format.name} - {format.description.slice(0, 50)}...
                      </option>
                    ))}
                  </select>
                  <p className="text-ivory/50 mt-2 text-xs">
                    Idéal pour : {THREADS_FORMATS[threadsFormat].bestFor.join(' • ')}
                  </p>
                </div>

                {/* Authenticity Level */}
                <div>
                  <label className="text-ivory/80 mb-2 block text-sm font-medium">
                    Niveau d&apos;authenticité:{' '}
                    <span className="text-gold">
                      {THREADS_AUTHENTICITY_LEVELS[threadsAuthenticityLevel].name}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={threadsAuthenticityLevel}
                    onChange={e =>
                      setThreadsAuthenticityLevel(
                        Number(e.target.value) as ThreadsAuthenticityLevel
                      )
                    }
                    className="accent-gold w-full"
                  />
                  <div className="text-ivory/50 mt-1 flex justify-between text-xs">
                    <span>Informatif</span>
                    <span>Brut</span>
                  </div>
                  <p className="text-ivory/50 mt-2 text-xs">
                    {THREADS_AUTHENTICITY_LEVELS[threadsAuthenticityLevel].description}
                  </p>
                </div>

                {/* Format Preview */}
                <div className="bg-night/30 rounded-lg p-4">
                  <p className="text-gold/70 mb-2 text-xs font-medium uppercase tracking-wider">
                    Exemples de ce format
                  </p>
                  <div className="space-y-2">
                    {THREADS_FORMATS[threadsFormat].examples.slice(0, 2).map((example, idx) => (
                      <p key={idx} className="text-ivory/70 text-xs italic">
                        &ldquo;{example}&rdquo;
                      </p>
                    ))}
                  </div>
                </div>

                {/* Threads Tips */}
                <div className="bg-gold/5 rounded-lg p-3">
                  <p className="text-gold/80 text-xs">
                    💡 Threads privilégie l&apos;authenticité. Pas de hashtags, pas de CTA. Écrivez
                    comme vous pensez.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Facebook Options - Affiché uniquement si Facebook est sélectionné */}
          {isFacebookSelected && (
            <div className="border-gold/20 from-night/60 to-night/40 rounded-lg border bg-gradient-to-br p-6 backdrop-blur-sm">
              <h2 className="text-ivory mb-4 flex items-center gap-2 text-lg font-semibold">
                <SocialPlatformIcon platform="FACEBOOK" className="h-5 w-5" />
                Options Facebook
              </h2>

              <div className="space-y-4">
                {/* Format Selection */}
                <div>
                  <label className="text-ivory/80 mb-2 block text-sm font-medium">
                    Format de post
                  </label>
                  <select
                    value={facebookFormat}
                    onChange={e => setFacebookFormat(e.target.value as FacebookPostFormat)}
                    className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-4 py-3 transition focus:outline-none"
                  >
                    {Object.values(FACEBOOK_FORMATS).map(format => (
                      <option key={format.id} value={format.id}>
                        {format.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-ivory/50 mt-2 text-xs">
                    {FACEBOOK_FORMATS[facebookFormat].description.slice(0, 80)}...
                  </p>
                  <p className="text-ivory/50 mt-1 text-xs">
                    Idéal pour : {FACEBOOK_FORMATS[facebookFormat].bestFor.join(' • ')}
                  </p>
                </div>

                {/* Tone Level */}
                <div>
                  <label className="text-ivory/80 mb-2 block text-sm font-medium">
                    Niveau de ton:{' '}
                    <span className="text-gold">
                      {FACEBOOK_TONE_LEVELS[facebookToneLevel].name}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={facebookToneLevel}
                    onChange={e =>
                      setFacebookToneLevel(Number(e.target.value) as FacebookToneLevel)
                    }
                    className="accent-gold w-full"
                  />
                  <div className="text-ivory/50 mt-1 flex justify-between text-xs">
                    <span>Informatif</span>
                    <span>Expert</span>
                  </div>
                  <p className="text-ivory/50 mt-2 text-xs">
                    {FACEBOOK_TONE_LEVELS[facebookToneLevel].description}
                  </p>
                </div>

                {/* Format Preview */}
                <div className="bg-night/30 rounded-lg p-4">
                  <p className="text-gold/70 mb-2 text-xs font-medium uppercase tracking-wider">
                    Exemple de structure
                  </p>
                  <pre className="text-ivory/70 whitespace-pre-wrap text-xs">
                    {FACEBOOK_FORMATS[facebookFormat].example.slice(0, 400)}...
                  </pre>
                </div>

                {/* Facebook Tips */}
                <div className="bg-gold/5 rounded-lg p-3">
                  <p className="text-gold/80 text-xs">
                    💡 Facebook privilégie le storytelling et les émotions. Terminez par une
                    question pour susciter les commentaires.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* LinkedIn Options - Affiché uniquement si LinkedIn est sélectionné */}
          {isLinkedInSelected && (
            <div className="border-gold/20 from-night/60 to-night/40 rounded-lg border bg-gradient-to-br p-6 backdrop-blur-sm">
              <h2 className="text-ivory mb-4 flex items-center gap-2 text-lg font-semibold">
                <SocialPlatformIcon platform="LINKEDIN" className="h-5 w-5" />
                Options LinkedIn
              </h2>

              <div className="space-y-4">
                {/* Format Selection */}
                <div>
                  <label className="text-ivory/80 mb-2 block text-sm font-medium">
                    Format de post
                  </label>
                  <select
                    value={linkedinFormat}
                    onChange={e => setLinkedinFormat(e.target.value as LinkedInPostFormat)}
                    className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-4 py-3 transition focus:outline-none"
                  >
                    {Object.values(LINKEDIN_FORMATS).map(format => (
                      <option key={format.id} value={format.id}>
                        {format.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-ivory/50 mt-2 text-xs">
                    {LINKEDIN_FORMATS[linkedinFormat].description.slice(0, 80)}...
                  </p>
                  <p className="text-ivory/50 mt-1 text-xs">
                    Idéal pour : {LINKEDIN_FORMATS[linkedinFormat].bestFor.join(' • ')}
                  </p>
                </div>

                {/* Expertise Level */}
                <div>
                  <label className="text-ivory/80 mb-2 block text-sm font-medium">
                    Niveau d&apos;expertise:{' '}
                    <span className="text-gold">
                      {LINKEDIN_EXPERTISE_LEVELS[linkedinExpertiseLevel].name}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={linkedinExpertiseLevel}
                    onChange={e =>
                      setLinkedinExpertiseLevel(Number(e.target.value) as LinkedInExpertiseLevel)
                    }
                    className="accent-gold w-full"
                  />
                  <div className="text-ivory/50 mt-1 flex justify-between text-xs">
                    <span>Informatif</span>
                    <span>Personnel</span>
                  </div>
                  <p className="text-ivory/50 mt-2 text-xs">
                    {LINKEDIN_EXPERTISE_LEVELS[linkedinExpertiseLevel].description}
                  </p>
                </div>

                {/* Format Preview */}
                <div className="bg-night/30 rounded-lg p-4">
                  <p className="text-gold/70 mb-2 text-xs font-medium uppercase tracking-wider">
                    Exemple de structure
                  </p>
                  <pre className="text-ivory/70 whitespace-pre-wrap text-xs">
                    {LINKEDIN_FORMATS[linkedinFormat].example.slice(0, 400)}...
                  </pre>
                </div>

                {/* LinkedIn Tips */}
                <div className="bg-gold/5 rounded-lg p-3">
                  <p className="text-gold/80 text-xs">
                    💡 LinkedIn favorise les posts avec commentaires dans les 90 premières minutes.
                    Terminez toujours par une question ouverte. Lien en commentaire = meilleur
                    reach.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!selectedArticle || selectedPlatforms.length === 0 || generation.isGenerating}
            className="from-gold/20 to-gold/30 text-gold hover:from-gold/30 hover:to-gold/40 flex w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r px-6 py-4 font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generation.isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Générer le contenu
              </>
            )}
          </button>
        </motion.div>

        {/* Right Column - Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="border-gold/20 from-night/60 to-night/40 rounded-lg border bg-gradient-to-br p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-ivory text-lg font-semibold">Contenu généré</h2>
              {generation.tokensUsed > 0 && (
                <span className="text-ivory/50 text-sm">
                  {generation.tokensUsed.toLocaleString()} tokens utilisés
                </span>
              )}
            </div>

            {/* Error State */}
            {generation.error && (
              <div className="mb-4 rounded-lg bg-red-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
                  <div>
                    <p className="font-medium text-red-400">Erreur de génération</p>
                    <p className="mt-1 text-sm text-red-400/80">{generation.error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!generation.isGenerating && generation.generations.length === 0 && (
              <div className="py-16 text-center">
                <Sparkles className="text-gold/30 mx-auto h-12 w-12" />
                <p className="text-ivory/50 mt-4">
                  Sélectionnez un article et les plateformes, puis cliquez sur "Générer le contenu"
                </p>
              </div>
            )}

            {/* Loading State */}
            {generation.isGenerating && (
              <div className="py-16 text-center">
                <Loader2 className="text-gold mx-auto h-12 w-12 animate-spin" />
                <p className="text-ivory/70 mt-4">Génération du contenu en cours...</p>
                <p className="text-ivory/50 mt-2 text-sm">Cela peut prendre quelques secondes</p>
              </div>
            )}

            {/* Generated Content */}
            {!generation.isGenerating && generation.generations.length > 0 && (
              <div className="space-y-6">
                {generation.generations.map(gen => (
                  <GeneratedContentPreview
                    key={gen.platform}
                    generation={gen}
                    articleImage={selectedArticle?.image}
                    onContentChange={content => handleUpdateContent(gen.platform, content)}
                    onCopy={() =>
                      handleCopyContent(
                        `${gen.content}\n\n${gen.hashtags.map(h => `#${h}`).join(' ')}`
                      )
                    }
                  />
                ))}

                {/* Actions */}
                <div className="border-gold/10 flex gap-3 border-t pt-6">
                  <button
                    onClick={handleGenerate}
                    className="border-gold/20 text-ivory/70 hover:border-gold/40 hover:text-ivory flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 font-medium transition"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Régénérer
                  </button>
                  <button
                    onClick={() => setIsSaveModalOpen(true)}
                    className="bg-gold/20 text-gold hover:bg-gold/30 flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition"
                  >
                    <Save className="h-4 w-4" />
                    Sauvegarder
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Save Modal */}
      <SavePostModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        generations={generation.generations}
        blogSlug={selectedArticle?.slug || ''}
        blogTitle={selectedArticle?.title || ''}
        articleImage={selectedArticle?.image}
        tone={selectedTone}
        angle={selectedAngle}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
}
