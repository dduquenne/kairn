"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Loader, Wand2 } from "lucide-react";
import { ToneOption, AVAILABLE_TONES } from "../_utils/toneDefinitions";
import { FAQItem } from "@/lib/blog";

// Intervalle de polling en millisecondes
const POLLING_INTERVAL_MS = 2500;

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

// Types pour le job de génération
interface JobStatusResponse {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  currentStep: string | null;
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
  error?: string | null;
  input?: { topic?: string; category?: string };
}

export function ArticleGeneratorModal({
  isOpen,
  onClose,
  onGenerateData,
  initialData,
}: ArticleGeneratorModalProps) {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState<"Comprendre" | "Traverser" | "Découvrir" | "Cheminer">("Comprendre");
  const [targetLength, setTargetLength] = useState<"short" | "medium" | "long">("long");
  const [selectedTones, setSelectedTones] = useState<ToneOption[]>(["pédagogique"]);
  const [seoQuery, setSeoQuery] = useState("");
  const [searchIntent, setSearchIntent] = useState("");
  const [readerPersona, setReaderPersona] = useState("");
  const [usePsypnosStyle, setUsePsypnosStyle] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState<string>("");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Ref pour le timer de polling
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchroniser l'état avec initialData quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && initialData) {
      setTopic(initialData.title || "");
      setCategory(
        (initialData.category as "Comprendre" | "Traverser" | "Découvrir" | "Cheminer") || "Comprendre"
      );
      setSeoQuery(initialData.description || "");
      setSearchIntent(initialData.seoIntent || "");
      setReaderPersona(initialData.persona || "");

      // Filtrer les tons pour ne garder que ceux valides dans AVAILABLE_TONES
      const validTones = initialData.tones?.filter((t) => {
        return AVAILABLE_TONES.some((available) => available.value === t);
      }) as ToneOption[] | undefined;

      setSelectedTones(validTones && validTones.length > 0 ? validTones : ["pédagogique"]);
      setError(null);
    }
  }, [isOpen, initialData]);

  const suggestedTopics = [
    "Les bienfaits de l'hypnose ericksonienne",
    "Comprendre la respiration holotropique",
    "Le rôle de l'inconscient dans la guérison",
    "La psychologie transpersonnelle",
    "Traverser un deuil avec la thérapie",
  ];

  // Arrêter le polling
  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  // Nettoyer le polling quand le composant est démonté ou le modal fermé
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Fonction pour vérifier le statut d'un job
  const checkJobStatus = useCallback(async (jobId: string): Promise<JobStatusResponse> => {
    const response = await fetch(`/api/blog/jobs/${jobId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erreur lors de la vérification du statut");
    }
    return response.json();
  }, []);

  // Fonction de polling récursive
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const status = await checkJobStatus(jobId);

      // Mettre à jour la progression
      setGenerationProgress(status.progress);
      setGenerationStage(status.currentStep || "Traitement en cours...");

      if (status.status === "COMPLETED" && status.result) {
        // Génération terminée avec succès
        stopPolling();
        setGenerationProgress(100);
        setGenerationStage("Article généré avec succès!");

        const article = status.result.article;
        onGenerateData?.({
          title: article.title || "",
          description: article.description || "",
          category: article.category || category,
          content: article.content || "",
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

      } else if (status.status === "FAILED") {
        // Échec de la génération
        stopPolling();
        throw new Error(status.error || "Erreur lors de la génération de l'article");

      } else {
        // Encore en cours (PENDING ou PROCESSING) - continuer le polling
        pollingTimerRef.current = setTimeout(() => {
          pollJobStatus(jobId);
        }, POLLING_INTERVAL_MS);
      }
    } catch (err) {
      stopPolling();
      console.error("Error polling job status:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setIsGenerating(false);
      setCurrentJobId(null);
    }
  }, [checkJobStatus, stopPolling, onGenerateData, onClose, category, searchIntent, readerPersona, selectedTones]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Veuillez saisir un sujet pour l'article");
      return;
    }

    if (selectedTones.length === 0) {
      setError("Veuillez sélectionner au moins un ton préféré");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    setGenerationStage("Création du job de génération...");

    try {
      // Récupérer le token CSRF
      const csrfResponse = await fetch("/api/csrf-token");
      const { token: csrfToken } = await csrfResponse.json();

      // Créer un job de génération via la nouvelle API
      const response = await fetch("/api/blog/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
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
          usePsypnosStyle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la création du job");
      }

      const { jobId } = await response.json();
      console.log(`[ArticleGenerator] Job créé: ${jobId}`);

      // Stocker l'ID du job
      setCurrentJobId(jobId);
      setGenerationStage("En attente de traitement...");
      setGenerationProgress(5);

      // Démarrer le polling pour suivre la progression
      pollJobStatus(jobId);

    } catch (err) {
      console.error("Error creating generation job:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setIsGenerating(false);
      setCurrentJobId(null);
    }
  };

  const handleReset = () => {
    stopPolling();
    setTopic("");
    setCategory("Comprendre");
    setTargetLength("long");
    setSelectedTones(["pédagogique"]);
    setSeoQuery("");
    setSearchIntent("");
    setReaderPersona("");
    setUsePsypnosStyle(true);
    setError(null);
    setIsGenerating(false);
    setGenerationProgress(0);
    setGenerationStage("");
    setCurrentJobId(null);
  };

  const handleClose = () => {
    // On peut fermer le modal même si une génération est en cours
    // Le job continue en arrière-plan
    if (isGenerating) {
      console.log(`[ArticleGenerator] Fermeture du modal pendant la génération du job ${currentJobId}`);
    }
    stopPolling();
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-lg border border-gold/20 bg-night/95 shadow-2xl backdrop-blur-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gold/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wand2 className="h-6 w-6 text-gold" />
              <h2 className="text-2xl font-semibold text-ivory">Générer un Article</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isGenerating}
              className="rounded-lg p-2 text-ivory/70 transition hover:bg-gold/10 hover:text-ivory disabled:opacity-50"
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
              <label className="mb-2 block text-sm font-medium text-gold">
                Sujet de l'article *
              </label>
              <textarea
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  setError(null);
                }}
                disabled={isGenerating}
                rows={3}
                className="w-full rounded-lg border border-gold/20 bg-night/50 px-4 py-3 text-ivory placeholder-ivory/40 transition focus:border-gold focus:outline-none disabled:opacity-50"
                placeholder="Ex: Comment l'hypnose ericksonienne peut aider à surmonter l'anxiété..."
              />
              {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            </div>

            {/* Suggested topics */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gold">
                Suggestions de sujets
              </label>
              <div className="flex flex-wrap gap-2">
                {suggestedTopics.map((suggestedTopic, index) => (
                  <button
                    key={index}
                    onClick={() => setTopic(suggestedTopic)}
                    disabled={isGenerating}
                    className="rounded-full border border-gold/20 bg-night/50 px-3 py-1 text-sm text-ivory/70 transition hover:border-gold/40 hover:text-ivory disabled:opacity-50"
                  >
                    {suggestedTopic}
                  </button>
                ))}
              </div>
            </div>

            {/* Category and Length */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gold">
                  Catégorie *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  disabled={isGenerating}
                  className="w-full rounded-lg border border-gold/20 bg-night/50 px-4 py-2 text-ivory transition focus:border-gold focus:outline-none disabled:opacity-50"
                >
                  <option value="Comprendre">Comprendre</option>
                  <option value="Traverser">Traverser</option>
                  <option value="Découvrir">Découvrir</option>
                  <option value="Cheminer">Cheminer</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gold">
                  Longueur
                </label>
                <select
                  value={targetLength}
                  onChange={(e) => setTargetLength(e.target.value as "short" | "medium" | "long")}
                  disabled={isGenerating}
                  className="w-full rounded-lg border border-gold/20 bg-night/50 px-4 py-2 text-ivory transition focus:border-gold focus:outline-none disabled:opacity-50"
                >
                  <option value="short">Court (800-1000 mots)</option>
                  <option value="medium">Moyen (1000-1500 mots)</option>
                  <option value="long">Long (1500-2000 mots)</option>
                </select>
              </div>
            </div>

            {/* Preferred Tones - Using HTML details for lightweight accordion */}
            <details open className="space-y-4 rounded-lg border border-gold/20 bg-night/40 p-4 group">
              <summary className="cursor-pointer flex items-center justify-between">
                <label className="text-sm font-medium text-gold cursor-pointer">
                  Tons préférés (sélectionnez au moins un) *
                  {selectedTones.length > 0 && (
                    <span className="ml-2 text-xs bg-gold/20 text-gold px-2 py-1 rounded-full">
                      {selectedTones.length} sélectionné(s)
                    </span>
                  )}
                </label>
                <span className="text-gold transition-transform group-open:rotate-180">▼</span>
              </summary>

              <div className="space-y-3 border-t border-gold/10 pt-3">
                <p className="text-xs text-ivory/60">
                  💡 Vous pouvez sélectionner plusieurs tons pour une combinaison harmonieuse
                </p>

                  {["Information", "Créatif & Émotionnel", "Approche & Réflexion", "Ton & Engagement"].map(
                    (categoryName) => {
                      const tonesInCategory = AVAILABLE_TONES.filter((t) => t.category === categoryName);
                      return (
                        <div key={categoryName}>
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold/80">
                            {categoryName}
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {tonesInCategory.map((tone) => {
                              const isSelected = selectedTones.includes(tone.value);
                              return (
                                <label
                                  key={tone.value}
                                  className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 transition cursor-pointer ${
                                    isSelected ? "border-gold bg-gold/10" : "border-gold/20 bg-night/40 hover:border-gold/40 hover:bg-night/50"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedTones([...selectedTones, tone.value]);
                                      } else {
                                        setSelectedTones(selectedTones.filter((t) => t !== tone.value));
                                      }
                                    }}
                                    disabled={isGenerating}
                                    className="h-5 w-5 cursor-pointer rounded border-gold/50 text-gold focus:ring-gold disabled:opacity-50"
                                  />
                                  <span className={`text-sm font-medium ${isSelected ? "text-gold" : "text-ivory"}`}>
                                    {tone.label}
                                  </span>
                                  {isSelected && <span className="ml-auto text-xs text-gold">✓</span>}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                  )}

                  {/* Selected tones summary */}
                  <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 mt-4">
                    {selectedTones.length > 0 ? (
                      <>
                        <p className="mb-2 text-xs font-semibold text-gold">
                          TONS SÉLECTIONNÉS ({selectedTones.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedTones.map((tone) => (
                            <span
                              key={tone}
                              className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1 text-xs text-gold"
                            >
                              {AVAILABLE_TONES.find((t) => t.value === tone)?.label || tone}
                              <button
                                onClick={() => setSelectedTones(selectedTones.filter((t) => t !== tone))}
                                className="ml-1 hover:text-gold/60"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-ivory/60">
                        ⚠️ Veuillez sélectionner au moins un ton pour continuer
                      </p>
                    )}
                  </div>
              </div>
            </details>

            {/* Advanced options */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-gold hover:text-gold/80">
                Options avancées (SEO & Persona)
              </summary>
              <div className="mt-4 space-y-4 rounded-lg border border-gold/10 bg-night/30 p-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-ivory/70">
                    Requête SEO principale
                  </label>
                  <input
                    type="text"
                    value={seoQuery}
                    onChange={(e) => setSeoQuery(e.target.value)}
                    disabled={isGenerating}
                    className="w-full rounded-lg border border-gold/20 bg-night/50 px-4 py-2 text-ivory placeholder-ivory/40 transition focus:border-gold focus:outline-none disabled:opacity-50"
                    placeholder="Ex: hypnose anxiété"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-ivory/70">
                    Intention de recherche
                  </label>
                  <input
                    type="text"
                    value={searchIntent}
                    onChange={(e) => setSearchIntent(e.target.value)}
                    disabled={isGenerating}
                    className="w-full rounded-lg border border-gold/20 bg-night/50 px-4 py-2 text-ivory placeholder-ivory/40 transition focus:border-gold focus:outline-none disabled:opacity-50"
                    placeholder="Ex: Comprendre comment utiliser l'hypnose pour gérer l'anxiété"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-ivory/70">
                    Persona du lecteur
                  </label>
                  <textarea
                    value={readerPersona}
                    onChange={(e) => setReaderPersona(e.target.value)}
                    disabled={isGenerating}
                    rows={2}
                    className="w-full rounded-lg border border-gold/20 bg-night/50 px-4 py-2 text-ivory placeholder-ivory/40 transition focus:border-gold focus:outline-none disabled:opacity-50"
                    placeholder="Ex: Personne anxieuse cherchant des solutions naturelles..."
                  />
                </div>
              </div>
            </details>

            {/* Style option */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="usePsypnosStyle"
                checked={usePsypnosStyle}
                onChange={(e) => setUsePsypnosStyle(e.target.checked)}
                disabled={isGenerating}
                className="h-4 w-4 rounded border-gold/20 text-gold focus:ring-gold disabled:opacity-50"
              />
              <label htmlFor="usePsypnosStyle" className="text-sm font-medium text-ivory">
                Utiliser le style rédactionnel PSYPNOS
              </label>
            </div>

            {/* Info box */}
            <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
              <p className="text-sm text-ivory/70">
                <strong className="text-gold">Note :</strong> La génération se déroule en 9 étapes : plan détaillé, introduction, sections (générées individuellement), conclusion, révision de cohérence, titre/description SEO, tags, FAQ et prompt image.
                <br /><br />
                <strong className="text-gold">Nouveau :</strong> La génération s'exécute en arrière-plan. Vous pouvez fermer ce modal et la génération continuera. Durée estimée : 2-5 minutes.
              </p>
            </div>
          </div>
        </div>

        {/* Actions - Fixe au bas */}
        <div className="flex-shrink-0 border-t border-gold/10 bg-night/50 px-6 py-4">
          {/* Barre de progression - Affichée pendant la génération */}
          {isGenerating && (
            <div className="rounded-lg bg-gold/5 border border-gold/20 p-4 space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gold">
                  {generationStage || "Génération en cours..."}
                </span>
                <span className="text-sm font-semibold text-gold">
                  Étape {Math.max(1, Math.ceil(generationProgress / (100 / 9)))}/9
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-gold/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold to-gold/60 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(generationProgress, 100)}%` }}
                />
              </div>
              {/* Indicateurs d'étapes - 9 étapes */}
              <div className="flex justify-between text-xs text-ivory/50">
                <span className={generationProgress >= 11.11 ? "text-gold" : ""}>Plan</span>
                <span className={generationProgress >= 22.22 ? "text-gold" : ""}>Intro</span>
                <span className={generationProgress >= 33.33 ? "text-gold" : ""}>Sections</span>
                <span className={generationProgress >= 44.44 ? "text-gold" : ""}>Conclusion</span>
                <span className={generationProgress >= 55.55 ? "text-gold" : ""}>Révision</span>
                <span className={generationProgress >= 66.66 ? "text-gold" : ""}>SEO</span>
                <span className={generationProgress >= 77.77 ? "text-gold" : ""}>Tags</span>
                <span className={generationProgress >= 88.88 ? "text-gold" : ""}>FAQ</span>
                <span className={generationProgress >= 100 ? "text-gold" : ""}>Image</span>
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gold/30 px-6 py-2 font-medium text-gold transition hover:bg-gold/10"
            >
              {isGenerating ? "Fermer (le job continue)" : "Annuler"}
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim() || selectedTones.length === 0}
              className="flex items-center gap-2 rounded-lg bg-gold/20 px-6 py-2 font-medium text-gold transition hover:bg-gold/30 disabled:opacity-50"
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
