'use client';

import { X, Loader, Wand2 } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

import { FAQItem } from '@/lib/blog';

import { ToneOption, AVAILABLE_TONES } from '../_utils/toneDefinitions';

/** Nombre maximum de retries par étape en cas d'erreur réseau */
const MAX_STEP_RETRIES = 2;

interface ArticleGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateData?: (article: GeneratedArticleData) => void;
  initialData?: {
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
    seoIntent?: string;
    persona?: string;
    tones?: string[];
  };
}

export interface GeneratedArticleData {
  title: string;
  description: string;
  category: string;
  content: string;
  tags: string[];
  faq: FAQItem[];
  imagePrompt?: string;
  seoIntent?: string;
  persona?: string;
  tones?: string[];
}

/** Réponse du endpoint POST /api/blog/jobs/[id]/step */
interface StepResponse {
  jobId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  currentStepIndex: number;
  progress: number;
  currentStep: string;
  totalSteps: number;
  result?: {
    success: boolean;
    article: {
      title: string;
      description: string;
      content: string;
      category: string;
      tags: string[];
      faq: Array<{ question: string; answer: string }>;
      imagePrompt?: string;
    };
    warning?: string;
    error?: string;
  };
  error?: string;
}

export function ArticleGeneratorModal({
  isOpen,
  onClose,
  onGenerateData,
  initialData,
}: ArticleGeneratorModalProps) {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState<'Comprendre' | 'Traverser' | 'Découvrir' | 'Cheminer'>(
    'Comprendre'
  );
  const [targetLength, setTargetLength] = useState<'short' | 'medium' | 'long'>('long');
  const [selectedTones, setSelectedTones] = useState<ToneOption[]>(['pédagogique']);
  const [seoQuery, setSeoQuery] = useState('');
  const [searchIntent, setSearchIntent] = useState('');
  const [readerPersona, setReaderPersona] = useState('');
  const [useAvvStyle, setUseAvvStyle] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Ref pour l'AbortController permettant d'annuler la boucle step-by-step
  const abortControllerRef = useRef<AbortController | null>(null);

  // Synchroniser l'état avec initialData quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && initialData) {
      setTopic(initialData.title || '');
      setCategory(
        (initialData.category as 'Comprendre' | 'Traverser' | 'Découvrir' | 'Cheminer') ||
          'Comprendre'
      );
      setSeoQuery(initialData.description || '');
      setSearchIntent(initialData.seoIntent || '');
      setReaderPersona(initialData.persona || '');

      // Filtrer les tons pour ne garder que ceux valides dans AVAILABLE_TONES
      const validTones = initialData.tones?.filter(t => {
        return AVAILABLE_TONES.some(available => available.value === t);
      }) as ToneOption[] | undefined;

      setSelectedTones(validTones && validTones.length > 0 ? validTones : ['pédagogique']);
      setError(null);
    }
  }, [isOpen, initialData]);

  const suggestedTopics = [
    'Les bienfaits de la somatothérapie',
    'Comprendre la breathwork & rebirth',
    'La sophrologie au quotidien',
    'Découvrir le reiki et ses bienfaits',
    'La cohérence cardiaque pour gérer le stress',
  ];

  /** Annule la boucle step-by-step en cours */
  const stopStepLoop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Nettoyer quand le composant est démonté
  useEffect(() => {
    return () => {
      stopStepLoop();
    };
  }, [stopStepLoop]);

  /**
   * Exécute un appel POST /api/blog/jobs/[id]/step avec retry en cas d'erreur réseau
   */
  const callStep = useCallback(
    async (jobId: string, signal: AbortSignal): Promise<StepResponse> => {
      let lastError: Error | null = null;
      for (let attempt = 0; attempt <= MAX_STEP_RETRIES; attempt++) {
        try {
          const response = await fetch(`/api/blog/jobs/${jobId}/step`, {
            method: 'POST',
            signal,
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erreur lors de l'exécution de l'étape");
          }
          return await response.json();
        } catch (err) {
          if (signal.aborted) throw err;
          lastError = err instanceof Error ? err : new Error('Erreur réseau');
          if (attempt < MAX_STEP_RETRIES) {
            // Attente exponentielle avant retry
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
      }
      throw lastError || new Error('Échec après plusieurs tentatives');
    },
    []
  );

  /**
   * Boucle active : appelle POST .../step en séquence jusqu'à COMPLETED ou FAILED
   */
  const runStepByStep = useCallback(
    async (jobId: string) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        let completed = false;
        while (!completed && !controller.signal.aborted) {
          const stepResult = await callStep(jobId, controller.signal);

          // Mettre à jour la progression
          setGenerationProgress(stepResult.progress);
          setGenerationStage(stepResult.currentStep || 'Traitement en cours...');

          if (stepResult.status === 'COMPLETED' && stepResult.result) {
            completed = true;
            setGenerationProgress(100);
            setGenerationStage('Article généré avec succès!');

            const article = stepResult.result.article;
            onGenerateData?.({
              title: article.title || '',
              description: article.description || '',
              category: article.category || category,
              content: article.content || '',
              tags: article.tags || [],
              faq: article.faq || [],
              imagePrompt: article.imagePrompt,
              seoIntent: searchIntent || undefined,
              persona: readerPersona || undefined,
              tones: selectedTones.length > 0 ? selectedTones : undefined,
            });

            // Attendre un court instant avant de fermer
            setTimeout(() => {
              handleReset();
              onClose();
            }, 500);
          } else if (stepResult.status === 'FAILED') {
            throw new Error(stepResult.error || "Erreur lors de la génération de l'article");
          }
          // Si PROCESSING, la boucle continue automatiquement
        }
      } catch (err) {
        if (controller.signal.aborted) return; // Annulation volontaire
        console.error('Error in step-by-step generation:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        setIsGenerating(false);
        setCurrentJobId(null);
      }
    },
    [callStep, onGenerateData, onClose, category, searchIntent, readerPersona, selectedTones]
  );

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Veuillez saisir un sujet pour l'article");
      return;
    }

    if (selectedTones.length === 0) {
      setError('Veuillez sélectionner au moins un ton préféré');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    setGenerationStage('Création du job de génération...');

    try {
      // Récupérer le token CSRF
      const csrfResponse = await fetch('/api/csrf-token');
      const { token: csrfToken } = await csrfResponse.json();

      // Créer un job de génération via la nouvelle API
      const response = await fetch('/api/blog/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          topic: topic.trim(),
          category,
          targetLength,
          editorialCategory: category,
          preferredTones: selectedTones,
          seoQuery: seoQuery.trim() || undefined,
          searchIntent: searchIntent.trim() || undefined,
          readerPersona: readerPersona.trim() || undefined,
          useAvvStyle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du job');
      }

      const { jobId } = await response.json();
      console.log(`[ArticleGenerator] Job créé: ${jobId}`);

      // Stocker l'ID du job
      setCurrentJobId(jobId);
      setGenerationStage('Démarrage de la génération...');
      setGenerationProgress(0);

      // Lancer la boucle step-by-step
      runStepByStep(jobId);
    } catch (err) {
      console.error('Error creating generation job:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsGenerating(false);
      setCurrentJobId(null);
    }
  };

  const handleReset = () => {
    stopStepLoop();
    setTopic('');
    setCategory('Comprendre');
    setTargetLength('long');
    setSelectedTones(['pédagogique']);
    setSeoQuery('');
    setSearchIntent('');
    setReaderPersona('');
    setUseAvvStyle(true);
    setError(null);
    setIsGenerating(false);
    setGenerationProgress(0);
    setGenerationStage('');
    setCurrentJobId(null);
  };

  const handleClose = () => {
    // Fermeture du modal — la boucle step-by-step s'arrête
    // car elle est pilotée par le frontend
    if (isGenerating) {
      console.log(
        `[ArticleGenerator] Fermeture du modal — arrêt de la génération du job ${currentJobId}`
      );
    }
    stopStepLoop();
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="border-gold/20 bg-night/95 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="border-gold/10 flex-shrink-0 border-b p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wand2 className="text-gold h-6 w-6" />
              <h2 className="text-ivory text-2xl font-semibold">Générer un Article</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isGenerating}
              className="text-ivory/70 hover:bg-gold/10 hover:text-ivory rounded-lg p-2 transition disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Topic input */}
            <div>
              <label className="text-gold mb-2 block text-sm font-medium">
                Sujet de l'article *
              </label>
              <textarea
                value={topic}
                onChange={e => {
                  setTopic(e.target.value);
                  setError(null);
                }}
                disabled={isGenerating}
                rows={3}
                className="border-gold/20 bg-night/50 text-ivory placeholder-ivory/40 focus:border-gold w-full rounded-lg border px-4 py-3 transition focus:outline-none disabled:opacity-50"
                placeholder="Ex: Comment la sophrologie peut aider à surmonter l'anxiété..."
              />
              {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            </div>

            {/* Suggested topics */}
            <div>
              <label className="text-gold mb-2 block text-sm font-medium">
                Suggestions de sujets
              </label>
              <div className="flex flex-wrap gap-2">
                {suggestedTopics.map((suggestedTopic, index) => (
                  <button
                    key={index}
                    onClick={() => setTopic(suggestedTopic)}
                    disabled={isGenerating}
                    className="border-gold/20 bg-night/50 text-ivory/70 hover:border-gold/40 hover:text-ivory rounded-full border px-3 py-1 text-sm transition disabled:opacity-50"
                  >
                    {suggestedTopic}
                  </button>
                ))}
              </div>
            </div>

            {/* Category and Length */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gold mb-2 block text-sm font-medium">Catégorie *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  disabled={isGenerating}
                  className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-4 py-2 transition focus:outline-none disabled:opacity-50"
                >
                  <option value="Comprendre">Comprendre</option>
                  <option value="Traverser">Traverser</option>
                  <option value="Découvrir">Découvrir</option>
                  <option value="Cheminer">Cheminer</option>
                </select>
              </div>

              <div>
                <label className="text-gold mb-2 block text-sm font-medium">Longueur</label>
                <select
                  value={targetLength}
                  onChange={e => setTargetLength(e.target.value as 'short' | 'medium' | 'long')}
                  disabled={isGenerating}
                  className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-4 py-2 transition focus:outline-none disabled:opacity-50"
                >
                  <option value="short">Court (800-1000 mots)</option>
                  <option value="medium">Moyen (1000-1500 mots)</option>
                  <option value="long">Long (1500-2000 mots)</option>
                </select>
              </div>
            </div>

            {/* Preferred Tones - Using HTML details for lightweight accordion */}
            <details
              open
              className="border-gold/20 bg-night/40 group space-y-4 rounded-lg border p-4"
            >
              <summary className="flex cursor-pointer items-center justify-between">
                <label className="text-gold cursor-pointer text-sm font-medium">
                  Tons préférés (sélectionnez au moins un) *
                  {selectedTones.length > 0 && (
                    <span className="bg-gold/20 text-gold ml-2 rounded-full px-2 py-1 text-xs">
                      {selectedTones.length} sélectionné(s)
                    </span>
                  )}
                </label>
                <span className="text-gold transition-transform group-open:rotate-180">▼</span>
              </summary>

              <div className="border-gold/10 space-y-3 border-t pt-3">
                <p className="text-ivory/60 text-xs">
                  💡 Vous pouvez sélectionner plusieurs tons pour une combinaison harmonieuse
                </p>

                {[
                  'Information',
                  'Créatif & Émotionnel',
                  'Approche & Réflexion',
                  'Ton & Engagement',
                ].map(categoryName => {
                  const tonesInCategory = AVAILABLE_TONES.filter(t => t.category === categoryName);
                  return (
                    <div key={categoryName}>
                      <h4 className="text-gold/80 mb-2 text-xs font-semibold uppercase tracking-widest">
                        {categoryName}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {tonesInCategory.map(tone => {
                          const isSelected = selectedTones.includes(tone.value);
                          return (
                            <label
                              key={tone.value}
                              className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition ${
                                isSelected
                                  ? 'border-gold bg-gold/10'
                                  : 'border-gold/20 bg-night/40 hover:border-gold/40 hover:bg-night/50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedTones([...selectedTones, tone.value]);
                                  } else {
                                    setSelectedTones(selectedTones.filter(t => t !== tone.value));
                                  }
                                }}
                                disabled={isGenerating}
                                className="border-gold/50 text-gold focus:ring-gold h-5 w-5 cursor-pointer rounded disabled:opacity-50"
                              />
                              <span
                                className={`text-sm font-medium ${isSelected ? 'text-gold' : 'text-ivory'}`}
                              >
                                {tone.label}
                              </span>
                              {isSelected && <span className="text-gold ml-auto text-xs">✓</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Selected tones summary */}
                <div className="border-gold/30 bg-gold/5 mt-4 rounded-lg border p-4">
                  {selectedTones.length > 0 ? (
                    <>
                      <p className="text-gold mb-2 text-xs font-semibold">
                        TONS SÉLECTIONNÉS ({selectedTones.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTones.map(tone => (
                          <span
                            key={tone}
                            className="bg-gold/20 text-gold inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
                          >
                            {AVAILABLE_TONES.find(t => t.value === tone)?.label || tone}
                            <button
                              onClick={() =>
                                setSelectedTones(selectedTones.filter(t => t !== tone))
                              }
                              className="hover:text-gold/60 ml-1"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-ivory/60 text-xs">
                      ⚠️ Veuillez sélectionner au moins un ton pour continuer
                    </p>
                  )}
                </div>
              </div>
            </details>

            {/* Advanced options */}
            <details className="group">
              <summary className="text-gold hover:text-gold/80 cursor-pointer text-sm font-medium">
                Options avancées (SEO & Persona)
              </summary>
              <div className="border-gold/10 bg-night/30 mt-4 space-y-4 rounded-lg border p-4">
                <div>
                  <label className="text-ivory/70 mb-2 block text-sm font-medium">
                    Requête SEO principale
                  </label>
                  <input
                    type="text"
                    value={seoQuery}
                    onChange={e => setSeoQuery(e.target.value)}
                    disabled={isGenerating}
                    className="border-gold/20 bg-night/50 text-ivory placeholder-ivory/40 focus:border-gold w-full rounded-lg border px-4 py-2 transition focus:outline-none disabled:opacity-50"
                    placeholder="Ex: somatothérapie anxiété"
                  />
                </div>

                <div>
                  <label className="text-ivory/70 mb-2 block text-sm font-medium">
                    Intention de recherche
                  </label>
                  <input
                    type="text"
                    value={searchIntent}
                    onChange={e => setSearchIntent(e.target.value)}
                    disabled={isGenerating}
                    className="border-gold/20 bg-night/50 text-ivory placeholder-ivory/40 focus:border-gold w-full rounded-lg border px-4 py-2 transition focus:outline-none disabled:opacity-50"
                    placeholder="Ex: Comprendre comment utiliser la somatothérapie pour gérer l'anxiété"
                  />
                </div>

                <div>
                  <label className="text-ivory/70 mb-2 block text-sm font-medium">
                    Persona du lecteur
                  </label>
                  <textarea
                    value={readerPersona}
                    onChange={e => setReaderPersona(e.target.value)}
                    disabled={isGenerating}
                    rows={2}
                    className="border-gold/20 bg-night/50 text-ivory placeholder-ivory/40 focus:border-gold w-full rounded-lg border px-4 py-2 transition focus:outline-none disabled:opacity-50"
                    placeholder="Ex: Personne anxieuse cherchant des solutions naturelles..."
                  />
                </div>
              </div>
            </details>

            {/* Style option */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="useAvvStyle"
                checked={useAvvStyle}
                onChange={e => setUseAvvStyle(e.target.checked)}
                disabled={isGenerating}
                className="border-gold/20 text-gold focus:ring-gold h-4 w-4 rounded disabled:opacity-50"
              />
              <label htmlFor="useAvvStyle" className="text-ivory text-sm font-medium">
                Utiliser le style rédactionnel AVV
              </label>
            </div>

            {/* Info box */}
            <div className="border-gold/20 bg-gold/5 rounded-lg border p-4">
              <p className="text-ivory/70 text-sm">
                <strong className="text-gold">Note :</strong> La génération se déroule en 9 étapes :
                plan détaillé, introduction, sections (générées individuellement), conclusion,
                révision de cohérence, titre/description SEO, tags, FAQ et prompt image.
                <br />
                <br />
                <strong className="text-gold">Info :</strong> Chaque étape est exécutée
                individuellement. La progression s'affiche en temps réel. Gardez le modal ouvert
                pendant la génération. Durée estimée : 2-5 minutes.
              </p>
            </div>
          </div>
        </div>

        {/* Actions - Fixe au bas */}
        <div className="border-gold/10 bg-night/50 flex-shrink-0 border-t px-6 py-4">
          {/* Barre de progression - Affichée pendant la génération */}
          {isGenerating && (
            <div className="bg-gold/5 border-gold/20 mb-4 space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-gold text-sm font-medium">
                  {generationStage || 'Génération en cours...'}
                </span>
                <span className="text-gold text-sm font-semibold">
                  Étape {Math.max(1, Math.ceil(generationProgress / (100 / 9)))}/9
                </span>
              </div>
              <div className="bg-gold/10 h-2 w-full overflow-hidden rounded-full">
                <div
                  className="from-gold to-gold/60 h-full rounded-full bg-gradient-to-r transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(generationProgress, 100)}%` }}
                />
              </div>
              {/* Indicateurs d'étapes - 9 étapes */}
              <div className="text-ivory/50 flex justify-between text-xs">
                <span className={generationProgress >= 11.11 ? 'text-gold' : ''}>Plan</span>
                <span className={generationProgress >= 22.22 ? 'text-gold' : ''}>Intro</span>
                <span className={generationProgress >= 33.33 ? 'text-gold' : ''}>Sections</span>
                <span className={generationProgress >= 44.44 ? 'text-gold' : ''}>Conclusion</span>
                <span className={generationProgress >= 55.55 ? 'text-gold' : ''}>Révision</span>
                <span className={generationProgress >= 66.66 ? 'text-gold' : ''}>SEO</span>
                <span className={generationProgress >= 77.77 ? 'text-gold' : ''}>Tags</span>
                <span className={generationProgress >= 88.88 ? 'text-gold' : ''}>FAQ</span>
                <span className={generationProgress >= 100 ? 'text-gold' : ''}>Image</span>
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="border-gold/30 text-gold hover:bg-gold/10 rounded-lg border px-6 py-2 font-medium transition"
            >
              {isGenerating ? 'Annuler la génération' : 'Annuler'}
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim() || selectedTones.length === 0}
              className="bg-gold/20 text-gold hover:bg-gold/30 flex items-center gap-2 rounded-lg px-6 py-2 font-medium transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Générer l'article
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
