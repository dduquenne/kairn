// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Générateur d'articles multi-étapes avec Claude
 *
 * Cette implémentation décompose la génération d'article en plusieurs étapes
 * pour éviter les problèmes de limitation de tokens et améliorer la qualité.
 *
 * Étapes:
 * 1. Générer le plan/outline de l'article
 * 2. Générer le contenu principal section par section
 * 3. Générer le titre et la description SEO
 * 4. Générer les tags
 * 5. Générer la FAQ
 * 6. Générer le prompt image
 */

import Anthropic from "@anthropic-ai/sdk";
import { PSYPNOS_STYLE_SYSTEM_PROMPT } from "./psypnos-system-prompt";
import {
  PSYPNOS_IMAGE_GENERATION_PROMPT,
  enrichImagePromptWithThematics,
  validatePromptForMandatoryElements,
} from "./psypnos-image-prompt-generator";
import {
  parseJsonFromText,
  withRetryAndTimeout,
  type RetryOptions,
} from "./ai-utils";

// Configuration des timeouts et retries
const API_TIMEOUT_MS = 90000; // 90 secondes par étape
const RETRY_OPTIONS: RetryOptions = {
  maxRetries: 2,
  initialDelayMs: 2000,
  backoffMultiplier: 2,
  maxDelayMs: 15000,
  onRetry: (attempt, error, delayMs) => {
    console.warn(`🔄 Multi-step retry ${attempt} après erreur, attente ${delayMs}ms:`,
      error instanceof Error ? error.message : error
    );
  },
};

// Types
export interface MultiStepGenerationOptions {
  topic: string;
  category: string;
  targetLength?: "short" | "medium" | "long";
  seoQuery?: string;
  searchIntent?: string;
  editorialCategory?: "Comprendre" | "Traverser" | "Découvrir" | "Cheminer";
  readerPersona?: string;
  preferredTones?: string[];
  usePsypnosStyle?: boolean;
  // Callback pour le suivi de progression
  onProgress?: (step: GenerationStep) => void;
}

export interface GenerationStep {
  step: number;
  totalSteps: number;
  name: string;
  status: "pending" | "in_progress" | "completed" | "error";
  message?: string;
}

export interface ArticleOutline {
  mainThesis: string;
  sections: {
    title: string;
    keyPoints: string[];
    estimatedWords: number;
  }[];
  targetAudience: string;
  keyMessages: string[];
}

export interface GeneratedArticleMultiStep {
  success: boolean;
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  tags?: string[];
  faq?: Array<{ question: string; answer: string }>;
  imagePrompt?: string;
  error?: string;
  // Métadonnées de génération
  generationMetadata?: {
    outline?: ArticleOutline;
    stepsCompleted: number;
    totalSteps: number;
  };
}

// Constantes
const LENGTH_CONFIG = {
  short: { words: "800-1000", sections: 2, maxContentTokens: 4000 },
  medium: { words: "1000-1500", sections: 3, maxContentTokens: 6000 },
  long: { words: "1500-2000", sections: 4, maxContentTokens: 8000 },
} as const;

const SPECIFIC_TONE_GUIDE: Record<string, string> = {
  informatif: "Présente les faits et informations avec clarté et objectivité.",
  pédagogique: "Approche pédagogique progressive, guidant pas à pas vers la compréhension.",
  inspirant: "Motivant et porteur, incitant à croire en ses capacités de transformation.",
  narratif: "Raconte des histoires engageantes, utilisant des anecdotes.",
  conversationnel: "Ton amical et accessible, comme une conversation entre amis.",
  professionnel: "Formel et expert, avec vocabulaire spécialisé.",
  provocateur: "Défi les conventions, provoque la réflexion critique.",
  humoristique: "Léger et amusant, utilise l'humour.",
  poétique: "Approche poétique et métaphorique, beauté du langage.",
  introspectif: "Approche introspective et contemplative, exploration intérieure.",
  engagé: "Prend position, appelle à l'action avec passion.",
  scientifique: "Base sur les données et recherches, ton neutre et basé sur preuves.",
  pragmatique: "Focalisé sur l'utilité pratique et les résultats concrets.",
  analytique: "Approche analytique et structurée, décortiquant avec précision.",
  apaisant: "Calme, rassurant, comme une voix intérieure qui guide.",
} as const;

const TOTAL_STEPS = 6;

/**
 * Crée une instance Anthropic
 */
function createAnthropicClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

/**
 * Génère un contexte éditorial à partir des options
 */
function buildEditorialContext(options: MultiStepGenerationOptions): string {
  const parts: string[] = [];

  if (options.seoQuery) {
    parts.push(`**Requête SEO principale** : ${options.seoQuery}`);
  }
  if (options.searchIntent) {
    parts.push(`**Intention de recherche** : ${options.searchIntent}`);
  }
  if (options.editorialCategory) {
    parts.push(`**Catégorie éditoriale** : ${options.editorialCategory}`);
  }
  if (options.readerPersona) {
    parts.push(`**Persona lecteur** : ${options.readerPersona}`);
  }
  if (options.preferredTones && options.preferredTones.length > 0) {
    const tonesDesc = options.preferredTones
      .map(t => `- **${t}** : ${SPECIFIC_TONE_GUIDE[t] || t}`)
      .join("\n");
    parts.push(`**Tons préférés** :\n${tonesDesc}`);
  }

  return parts.join("\n");
}

/**
 * ÉTAPE 1: Génère le plan/outline de l'article
 */
async function generateOutline(
  anthropic: Anthropic,
  options: MultiStepGenerationOptions,
  usePsypnosStyle: boolean
): Promise<ArticleOutline> {
  const lengthConfig = LENGTH_CONFIG[options.targetLength || "medium"];
  const editorialContext = buildEditorialContext(options);

  const prompt = `Tu dois planifier un article de blog sur le sujet suivant.

## SUJET
${options.topic}

## CATÉGORIE
${options.category}

## CONTEXTE ÉDITORIAL
${editorialContext}

## CONTRAINTES
- Longueur cible : ${lengthConfig.words} mots
- Nombre de sections H2 : ${lengthConfig.sections} sections maximum
- L'article doit être structuré pour le web (lisibilité, SEO)

## TÂCHE
Génère un plan détaillé pour cet article au format JSON suivant :

{
  "mainThesis": "La thèse principale de l'article en une phrase",
  "sections": [
    {
      "title": "Titre de la section H2 (sans majuscules inutiles)",
      "keyPoints": ["Point clé 1", "Point clé 2", "Point clé 3"],
      "estimatedWords": 300
    }
  ],
  "targetAudience": "Description du public cible",
  "keyMessages": ["Message clé 1", "Message clé 2", "Message clé 3"]
}

IMPORTANT:
- Les titres de section doivent suivre la convention française (pas de majuscule sauf noms propres et début de phrase)
- Le JSON doit être valide et complet
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après`;

  // Appel API avec retry et timeout
  const message = await withRetryAndTimeout(
    () => anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1500,
      temperature: 0.7,
      ...(usePsypnosStyle && { system: PSYPNOS_STYLE_SYSTEM_PROMPT }),
      messages: [{ role: "user", content: prompt }],
    }),
    API_TIMEOUT_MS,
    RETRY_OPTIONS
  );

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";

  // Parser le JSON avec l'utilitaire robuste
  try {
    return parseJsonFromText<ArticleOutline>(responseText);
  } catch (error) {
    console.error("Erreur parsing outline JSON:", responseText.slice(0, 1000));
    throw new Error(`Impossible de parser le plan de l'article: ${error instanceof Error ? error.message : "Erreur"}`);
  }
}

/**
 * ÉTAPE 2: Génère le contenu principal de l'article
 */
async function generateContent(
  anthropic: Anthropic,
  options: MultiStepGenerationOptions,
  outline: ArticleOutline,
  usePsypnosStyle: boolean
): Promise<string> {
  const lengthConfig = LENGTH_CONFIG[options.targetLength || "medium"];
  const editorialContext = buildEditorialContext(options);

  // Formater les sections du plan
  const sectionsGuide = outline.sections
    .map((s, i) => `### Section ${i + 1}: ${s.title}\n- Points clés : ${s.keyPoints.join(", ")}\n- Longueur : ~${s.estimatedWords} mots`)
    .join("\n\n");

  const prompt = `Tu dois rédiger le contenu complet d'un article de blog.

## SUJET
${options.topic}

## CATÉGORIE
${options.category}

## CONTEXTE ÉDITORIAL
${editorialContext}

## THÈSE PRINCIPALE
${outline.mainThesis}

## PUBLIC CIBLE
${outline.targetAudience}

## PLAN À SUIVRE
${sectionsGuide}

## MESSAGES CLÉS À TRANSMETTRE
${outline.keyMessages.map(m => `- ${m}`).join("\n")}

## INSTRUCTIONS DE RÉDACTION

1. **Structure** :
   - Commence par un chapo introductif engageant (2 paragraphes max)
   - Rédige chaque section H2 avec son contenu complet
   - Termine par une conclusion avec CTA subtil
   - N'inclus PAS de titre H1 (géré par la page)
   - N'inclus PAS de FAQ (générée séparément)

2. **Style Markdown** :
   - Une idée par paragraphe (3-4 lignes max)
   - Aucun retour à la ligne dans un paragraphe
   - Utilise le **gras** pour concepts-clés, *italique* pour introspection
   - Intègre des listes (3-5 points) régulièrement
   - Utilise des citations au format : > « Citation » — Auteur
   - Utilise les callouts [!NOTE], [!TIP], [!WARNING] si pertinent
   - Pas de tableaux, pas de MAJUSCULES

3. **Conventions de titres** :
   - H2/H3 : pas de majuscule inutile (sauf noms propres)
   - Exemples corrects : "Comprendre l'anxiété", "Les bénéfices de la méditation"

4. **SEO** :
   - Featured snippet dans les premiers paragraphes
   - Mots-clés bien distribués
   - E-E-A-T visible dans la première section

5. **Longueur** : ${lengthConfig.words} mots pour le corps de l'article

IMPORTANT: Rédige UNIQUEMENT le contenu Markdown de l'article. Pas de balises XML, pas de métadonnées.`;

  // Appel API avec retry et timeout (timeout plus long pour le contenu)
  const message = await withRetryAndTimeout(
    () => anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: lengthConfig.maxContentTokens,
      temperature: 0.7,
      ...(usePsypnosStyle && { system: PSYPNOS_STYLE_SYSTEM_PROMPT }),
      messages: [{ role: "user", content: prompt }],
    }),
    API_TIMEOUT_MS * 1.5, // Timeout plus long pour le contenu principal
    RETRY_OPTIONS
  );

  const content = message.content[0].type === "text" ? message.content[0].text : "";

  if (!content || content.trim().length < 500) {
    throw new Error("Contenu généré trop court ou vide");
  }

  return content.trim();
}

/**
 * ÉTAPE 3: Génère le titre et la description SEO
 */
async function generateTitleAndDescription(
  anthropic: Anthropic,
  options: MultiStepGenerationOptions,
  content: string,
  outline: ArticleOutline,
  usePsypnosStyle: boolean
): Promise<{ title: string; description: string }> {
  // Extraire les premiers 2000 caractères du contenu pour le contexte
  const contentPreview = content.slice(0, 2000);

  const prompt = `Génère un titre et une description SEO pour cet article.

## SUJET
${options.topic}

## CATÉGORIE
${options.category}

## THÈSE PRINCIPALE
${outline.mainThesis}

## REQUÊTE SEO
${options.seoQuery || "Non spécifiée"}

## DÉBUT DU CONTENU
${contentPreview}...

## TÂCHE
Génère un titre et une description optimisés SEO au format JSON :

{
  "title": "Titre accrocheur et informatif (50-60 caractères idéalement)",
  "description": "Meta description engageante de 20 mots maximum"
}

RÈGLES POUR LE TITRE :
- Pas de majuscule inutile (sauf noms propres et début)
- Exemples corrects : "Comprendre l'hypnose ericksonienne", "Comment gérer l'anxiété"
- Exemples incorrects : "Comprendre L'Hypnose Ericksonienne"

RÈGLES POUR LA DESCRIPTION :
- Maximum 20 mots
- Engageante et informative
- Doit donner envie de lire l'article

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

  // Appel API avec retry et timeout
  const message = await withRetryAndTimeout(
    () => anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 500,
      temperature: 0.7,
      ...(usePsypnosStyle && { system: PSYPNOS_STYLE_SYSTEM_PROMPT }),
      messages: [{ role: "user", content: prompt }],
    }),
    API_TIMEOUT_MS,
    RETRY_OPTIONS
  );

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    // Utiliser le parsing JSON robuste avec fallback
    return parseJsonFromText<{ title: string; description: string }>(
      responseText,
      { title: options.topic, description: `Découvrez notre article sur ${options.topic}` }
    );
  } catch (error) {
    console.error("Erreur parsing title/description JSON:", responseText.slice(0, 500));
    // Retourner des valeurs par défaut au lieu de throw
    return {
      title: options.topic,
      description: `Découvrez notre article sur ${options.topic}`,
    };
  }
}

/**
 * ÉTAPE 4: Génère les tags SEO
 */
async function generateTags(
  anthropic: Anthropic,
  options: MultiStepGenerationOptions,
  content: string,
  title: string,
  usePsypnosStyle: boolean
): Promise<string[]> {
  const contentPreview = content.slice(0, 1500);

  const prompt = `Génère des tags SEO pour cet article.

## TITRE
${title}

## SUJET
${options.topic}

## CATÉGORIE
${options.category}

## REQUÊTE SEO
${options.seoQuery || "Non spécifiée"}

## EXTRAIT DU CONTENU
${contentPreview}...

## TÂCHE
Génère 5 à 8 tags SEO pertinents au format JSON :

{
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

RÈGLES :
- Tags en français
- Pertinents pour le SEO et la thématique
- Mélange de termes généraux et spécifiques
- Pas de majuscules inutiles
- Entre 5 et 8 tags

Réponds UNIQUEMENT avec le JSON.`;

  // Appel API avec retry et timeout
  const message = await withRetryAndTimeout(
    () => anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 300,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
    API_TIMEOUT_MS,
    RETRY_OPTIONS
  );

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    // Utiliser le parsing JSON robuste avec fallback
    const parsed = parseJsonFromText<{ tags?: string[] }>(responseText, { tags: [] });
    return parsed.tags || [];
  } catch (error) {
    console.error("Erreur parsing tags JSON (non-bloquant):", responseText.slice(0, 300));
    return [];
  }
}

/**
 * ÉTAPE 5: Génère la FAQ
 */
async function generateFAQ(
  anthropic: Anthropic,
  options: MultiStepGenerationOptions,
  content: string,
  title: string,
  usePsypnosStyle: boolean
): Promise<Array<{ question: string; answer: string }>> {
  const contentPreview = content.slice(0, 2000);

  const prompt = `Génère une FAQ pour cet article.

## TITRE
${title}

## SUJET
${options.topic}

## REQUÊTE SEO
${options.seoQuery || "Non spécifiée"}

## INTENTION DE RECHERCHE
${options.searchIntent || "Non spécifiée"}

## EXTRAIT DU CONTENU
${contentPreview}...

## TÂCHE
Génère 3 à 5 questions fréquentes avec leurs réponses au format JSON :

{
  "faq": [
    {
      "question": "Question pertinente se terminant par un point d'interrogation ?",
      "answer": "Réponse concise et informative (2-3 phrases)"
    }
  ]
}

RÈGLES :
- Questions que les lecteurs pourraient poser sur Google
- Réponses optimisées pour les featured snippets
- Réponses concises (2-3 phrases, ~50-80 mots)
- Questions liées au contenu de l'article
- Format adapté à la recherche vocale

Réponds UNIQUEMENT avec le JSON.`;

  // Appel API avec retry et timeout
  const message = await withRetryAndTimeout(
    () => anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1500,
      temperature: 0.7,
      ...(usePsypnosStyle && { system: PSYPNOS_STYLE_SYSTEM_PROMPT }),
      messages: [{ role: "user", content: prompt }],
    }),
    API_TIMEOUT_MS,
    RETRY_OPTIONS
  );

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    // Utiliser le parsing JSON robuste avec fallback
    const parsed = parseJsonFromText<{ faq?: Array<{ question: string; answer: string }> }>(
      responseText,
      { faq: [] }
    );
    return parsed.faq || [];
  } catch (error) {
    console.error("Erreur parsing FAQ JSON (non-bloquant):", responseText.slice(0, 500));
    return [];
  }
}

/**
 * ÉTAPE 6: Génère le prompt pour l'image
 */
async function generateImagePrompt(
  anthropic: Anthropic,
  options: MultiStepGenerationOptions,
  content: string,
  title: string,
  usePsypnosStyle: boolean
): Promise<string> {
  const contentPreview = content.slice(0, 1500);

  const prompt = `Génère un prompt pour une image d'illustration respectant l'identité visuelle Psypnos v2.0.

## TITRE
${title}

## SUJET
${options.topic}

## CATÉGORIE
${options.category}

## EXTRAIT DU CONTENU
${contentPreview}...

## 🔴 4 ÉLÉMENTS OBLIGATOIRES (NON NÉGOCIABLE)

**CHAQUE prompt image DOIT inclure ces 4 éléments - aucune exception :**

1. ✅ **SILHOUETTE(S) MINIMALISTE(S)** (1-3 silhouettes)
   - Formes épurées et stylisées, NON réalistes
   - Illuminées d'une aura/halo doré
   - Postures contemplatives (assises, profil, méditation)

2. ✅ **LUMIÈRE DORÉE RAYONNANTE** (ÉLÉMENT CRUCIAL)
   - Halos de lumière dorée autour des silhouettes
   - Rayonnement centripète ou enveloppant
   - DOIT être EXPLICITEMENT NOMMÉE dans le prompt

3. ✅ **PALETTE PSYPNOS OFFICIELLE** (codes hex OBLIGATOIRES)
   - **Or Psypnos** (#c7a962) : Couleur primaire dominante
   - **Bleu nuit** (#0e1f2f) : Base/fond principal
   - **Ivoire** (#f5f1e6) : Lumières douces
   - Accents : pourpre (#9b7eaa), sauge (#7b9d8f), or clair (#f0d9a3)

4. ✅ **ATMOSPHÈRE CHALEUREUSE + PROFONDEUR EN COUCHES**
   - Voile translucide doux, qualité ACCUEILLANTE
   - Profondeur : plan net → midground → arrière-plan estompé
   - Message d'espoir implicite

## STRUCTURE DU PROMPT
Image 1920×640px (ratio 3:1), style [aquarelle numérique/illustration abstraite].
Composition : [Description avec silhouette(s) + formes + mouvement]
Silhouette : [Description minimaliste illuminée - aura dorée (#c7a962)]
Lumière : [EXPLICITEMENT nommer la lumière dorée rayonnante]
Palette : [Or Psypnos (#c7a962), bleu nuit (#0e1f2f), ivoire (#f5f1e6)]
Atmosphère : [Chaleureuse/accueillante + profondeur en couches]
Message : L'image transmet : "[Message d'espoir]"
Directive : Silhouettes minimalistes OK. Pas d'humains réalistes, texte ou logo. Qualité haute.

EXEMPLES BON STYLE (v2.0) :
✅ "Silhouette minimaliste dont les lignes s'apaisent en spirales. Halo doré (#c7a962). Fond bleu nuit (#0e1f2f). L'image transmet : L'apaisement est possible."
✅ "Silhouette translucide révélant un cœur lumineux or (#c7a962). Palette pourpre (#9b7eaa), ivoire (#f5f1e6)."

EXEMPLES À ÉVITER :
❌ "Femme en consultation avec thérapeute"
❌ Prompts sans silhouettes minimalistes illuminées
❌ Prompts sans codes hex de la palette Psypnos

Réponds UNIQUEMENT avec le prompt image, sans JSON ni balises.`;

  // Appel API avec le system prompt spécialisé et retry/timeout
  const message = await withRetryAndTimeout(
    () => anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
      temperature: 0.7,
      system: PSYPNOS_IMAGE_GENERATION_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
    API_TIMEOUT_MS,
    RETRY_OPTIONS
  );

  const rawImagePrompt = message.content[0].type === "text" ? message.content[0].text : "";

  // Enrichir avec les données thématiques et la catégorie
  const enrichedPrompt = enrichImagePromptWithThematics(
    rawImagePrompt.trim(),
    options.topic,
    options.category
  );

  // Valider que le prompt contient les 4 éléments obligatoires
  const validation = validatePromptForMandatoryElements(enrichedPrompt);

  if (!validation.isValid) {
    console.warn(
      `⚠️ IMAGE_PROMPT (multi-step) manque des éléments obligatoires: ${validation.missingElements.join(", ")}`
    );
  }

  return enrichedPrompt;
}

/**
 * Génère un article complet en plusieurs étapes
 */
export async function generateArticleMultiStep(
  options: MultiStepGenerationOptions,
  apiKey: string
): Promise<GeneratedArticleMultiStep> {
  const anthropic = createAnthropicClient(apiKey);
  const usePsypnosStyle = options.usePsypnosStyle !== false;

  const notifyProgress = (step: number, name: string, status: GenerationStep["status"], message?: string) => {
    if (options.onProgress) {
      options.onProgress({ step, totalSteps: TOTAL_STEPS, name, status, message });
    }
  };

  let outline: ArticleOutline | undefined;
  let content: string | undefined;
  let title: string | undefined;
  let description: string | undefined;
  let tags: string[] = [];
  let faq: Array<{ question: string; answer: string }> = [];
  let imagePrompt: string | undefined;
  let stepsCompleted = 0;

  try {
    // ÉTAPE 1: Générer le plan
    notifyProgress(1, "Génération du plan", "in_progress", "Création de la structure de l'article...");
    try {
      outline = await generateOutline(anthropic, options, usePsypnosStyle);
      stepsCompleted = 1;
      notifyProgress(1, "Génération du plan", "completed");
    } catch (error) {
      console.error("Erreur étape 1 (outline):", error);
      notifyProgress(1, "Génération du plan", "error", "Échec de la génération du plan");
      throw new Error(`Échec de la génération du plan: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }

    // ÉTAPE 2: Générer le contenu
    notifyProgress(2, "Rédaction du contenu", "in_progress", "Rédaction de l'article...");
    try {
      content = await generateContent(anthropic, options, outline, usePsypnosStyle);
      stepsCompleted = 2;
      notifyProgress(2, "Rédaction du contenu", "completed");
    } catch (error) {
      console.error("Erreur étape 2 (content):", error);
      notifyProgress(2, "Rédaction du contenu", "error", "Échec de la rédaction");
      throw new Error(`Échec de la rédaction du contenu: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }

    // ÉTAPE 3: Générer titre et description
    notifyProgress(3, "Optimisation SEO", "in_progress", "Génération du titre et description...");
    try {
      const titleDesc = await generateTitleAndDescription(anthropic, options, content, outline, usePsypnosStyle);
      title = titleDesc.title;
      description = titleDesc.description;
      stepsCompleted = 3;
      notifyProgress(3, "Optimisation SEO", "completed");
    } catch (error) {
      console.error("Erreur étape 3 (title/desc):", error);
      notifyProgress(3, "Optimisation SEO", "error", "Échec de l'optimisation SEO");
      // Continuer avec des valeurs par défaut
      title = options.topic;
      description = `Découvrez notre article sur ${options.topic}`;
      stepsCompleted = 3;
    }

    // ÉTAPE 4: Générer les tags
    notifyProgress(4, "Génération des tags", "in_progress", "Création des tags SEO...");
    try {
      tags = await generateTags(anthropic, options, content, title, usePsypnosStyle);
      stepsCompleted = 4;
      notifyProgress(4, "Génération des tags", "completed");
    } catch (error) {
      console.error("Erreur étape 4 (tags):", error);
      notifyProgress(4, "Génération des tags", "error", "Échec de la génération des tags");
      // Continuer sans tags
      stepsCompleted = 4;
    }

    // ÉTAPE 5: Générer la FAQ
    notifyProgress(5, "Création de la FAQ", "in_progress", "Génération des questions fréquentes...");
    try {
      faq = await generateFAQ(anthropic, options, content, title, usePsypnosStyle);
      stepsCompleted = 5;
      notifyProgress(5, "Création de la FAQ", "completed");
    } catch (error) {
      console.error("Erreur étape 5 (FAQ):", error);
      notifyProgress(5, "Création de la FAQ", "error", "Échec de la génération de la FAQ");
      // Continuer sans FAQ
      stepsCompleted = 5;
    }

    // ÉTAPE 6: Générer le prompt image
    notifyProgress(6, "Création du prompt image", "in_progress", "Génération du prompt pour l'illustration...");
    try {
      imagePrompt = await generateImagePrompt(anthropic, options, content, title, usePsypnosStyle);
      stepsCompleted = 6;
      notifyProgress(6, "Création du prompt image", "completed");
    } catch (error) {
      console.error("Erreur étape 6 (image prompt):", error);
      notifyProgress(6, "Création du prompt image", "error", "Échec de la génération du prompt image");
      // Continuer sans prompt image
      stepsCompleted = 6;
    }

    // Ajouter le titre H1 au début du contenu
    const contentWithTitle = title ? `# ${title}\n\n${content}` : content;

    return {
      success: true,
      title,
      description,
      content: contentWithTitle,
      category: options.category,
      tags,
      faq,
      imagePrompt,
      generationMetadata: {
        outline,
        stepsCompleted,
        totalSteps: TOTAL_STEPS,
      },
    };

  } catch (error) {
    console.error("Erreur lors de la génération multi-étapes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue lors de la génération",
      // Retourner les données partielles si disponibles
      title,
      description,
      content,
      category: options.category,
      tags,
      faq,
      imagePrompt,
      generationMetadata: {
        outline,
        stepsCompleted,
        totalSteps: TOTAL_STEPS,
      },
    };
  }
}
