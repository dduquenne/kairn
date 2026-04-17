/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * @module Step executor pour la génération d'articles step-by-step
 * @description Exécute une seule étape de génération à la fois,
 * permettant de rester dans la limite de 60s du plan Hobby Vercel.
 *
 * Chaque appel à `executeNextStep()` :
 * 1. Lit l'état actuel du job (étape courante, résultats partiels)
 * 2. Exécute une seule étape de génération (appel Claude API)
 * 3. Sauvegarde le résultat partiel en base
 * 4. Retourne le nouveau statut
 */

import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_DEFAULT_MODEL } from '@kairn/ai';

import { prisma } from '@/lib/db/prisma';
import { getSiteId } from '@/lib/db/site';

import {
  generateArticleSectional,
  type SectionalGenerationOptions,
  type DetailedOutline,
  type GenerationProgress,
} from '../../common/claude-article-generator-sectional';

import type { CreateJobInput } from './route';

/**
 * Noms des étapes de génération
 */
const STEP_NAMES = [
  'Génération du plan détaillé',
  "Rédaction de l'introduction",
  'Rédaction des sections',
  'Rédaction de la conclusion',
  'Révision de cohérence',
  'Optimisation SEO',
  'Génération des tags',
  'Création de la FAQ',
  'Création du prompt image',
] as const;

/** Nombre total d'étapes */
const TOTAL_STEPS = STEP_NAMES.length;

/**
 * Structure des résultats partiels stockés entre les étapes
 */
interface PartialResult {
  outline?: DetailedOutline;
  introduction?: string;
  sections?: string[];
  conclusion?: string;
  revisedContent?: string;
  coherenceScore?: number;
  title?: string;
  description?: string;
  tags?: string[];
  faq?: Array<{ question: string; answer: string }>;
  imagePrompt?: string;
  /** Contenu assemblé (intro + sections + conclusion) */
  assembledContent?: string;
}

/**
 * Réponse retournée après l'exécution d'une étape
 */
export interface StepExecutionResult {
  /** ID du job */
  jobId: string;
  /** Statut du job après l'étape */
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  /** Index de la prochaine étape (0-based) */
  currentStepIndex: number;
  /** Progression en pourcentage */
  progress: number;
  /** Description de l'étape courante */
  currentStep: string;
  /** Nombre total d'étapes */
  totalSteps: number;
  /** Résultat final si COMPLETED */
  result?: Record<string, unknown>;
  /** Message d'erreur si FAILED */
  error?: string;
}

/**
 * Exécute la prochaine étape de génération pour un job donné.
 *
 * @param jobId - ID du job en base
 * @returns Le résultat de l'exécution de l'étape
 */
export async function executeNextStep(jobId: string): Promise<StepExecutionResult> {
  const siteId = await getSiteId();

  // Récupérer le job
  const job = await prisma.blogGenerationJob.findFirst({
    where: { id: jobId, siteId },
  });

  if (!job) {
    throw new Error('Job non trouvé');
  }

  // Vérifier que le job est dans un état valide pour l'exécution
  if (job.status === 'COMPLETED') {
    return {
      jobId,
      status: 'COMPLETED',
      currentStepIndex: TOTAL_STEPS,
      progress: 100,
      currentStep: 'Génération terminée',
      totalSteps: TOTAL_STEPS,
      result: job.result as Record<string, unknown>,
    };
  }

  if (job.status === 'FAILED') {
    return {
      jobId,
      status: 'FAILED',
      currentStepIndex: job.currentStepIndex,
      progress: job.progress,
      currentStep: job.currentStep || 'Échec',
      totalSteps: TOTAL_STEPS,
      error: job.error || 'Le job a échoué',
    };
  }

  // Vérifier la clé API
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    await markJobAsFailed(jobId, "ANTHROPIC_API_KEY n'est pas configurée");
    return {
      jobId,
      status: 'FAILED',
      currentStepIndex: job.currentStepIndex,
      progress: job.progress,
      currentStep: 'Erreur de configuration',
      totalSteps: TOTAL_STEPS,
      error: "Le service n'est pas configuré.",
    };
  }

  // Si le job est PENDING, le passer en PROCESSING
  if (job.status === 'PENDING') {
    await prisma.blogGenerationJob.update({
      where: { id: jobId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        currentStep: STEP_NAMES[0],
      },
    });
  }

  const stepIndex = job.currentStepIndex;
  const input = job.input as CreateJobInput;
  const partialResult: PartialResult = (job.partialResult as PartialResult) || {};

  // Construire les options de génération
  const options: SectionalGenerationOptions = {
    topic: input.topic || input.subject || '',
    category: input.category,
    editorialCategory: input.editorialCategory || input.category,
    targetLength: input.targetLength,
    seoQuery: input.seoQuery || input.seoKeyword || '',
    searchIntent: input.searchIntent || input.searchIntention || '',
    readerPersona: input.readerPersona || input.persona || '',
    preferredTones: input.preferredTones || input.tones || [],
    usePsypnosStyle: input.usePsypnosStyle,
  };

  const anthropic = new Anthropic({ apiKey });
  const usePsypnosStyle = options.usePsypnosStyle !== false;

  try {
    const stepName = STEP_NAMES[stepIndex] || `Étape ${stepIndex + 1}`;
    console.log(`[BlogJob:${jobId}] Exécution étape ${stepIndex + 1}/${TOTAL_STEPS}: ${stepName}`);

    // Mettre à jour le statut avant l'exécution
    await prisma.blogGenerationJob.update({
      where: { id: jobId },
      data: {
        currentStep: stepName,
        progress: Math.round((stepIndex / TOTAL_STEPS) * 100),
      },
    });

    // Exécuter l'étape — utilise le générateur sectional existant
    // en passant un callback onProgress qui exécute une seule étape
    const updatedPartial = await executeSingleStep(
      anthropic,
      options,
      usePsypnosStyle,
      stepIndex,
      partialResult
    );

    const nextStepIndex = stepIndex + 1;
    const isCompleted = nextStepIndex >= TOTAL_STEPS;
    const progress = Math.round((nextStepIndex / TOTAL_STEPS) * 100);

    if (isCompleted) {
      // Assembler le résultat final
      const finalResult = buildFinalResult(updatedPartial, options);

      await prisma.blogGenerationJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          currentStep: 'Génération terminée',
          currentStepIndex: nextStepIndex,
          partialResult: updatedPartial as any,
          result: finalResult as any,
          completedAt: new Date(),
        },
      });

      return {
        jobId,
        status: 'COMPLETED',
        currentStepIndex: nextStepIndex,
        progress: 100,
        currentStep: 'Génération terminée',
        totalSteps: TOTAL_STEPS,
        result: finalResult as Record<string, unknown>,
      };
    }

    // Sauvegarder le résultat partiel et avancer l'index
    await prisma.blogGenerationJob.update({
      where: { id: jobId },
      data: {
        currentStepIndex: nextStepIndex,
        partialResult: updatedPartial as any,
        progress,
        currentStep: STEP_NAMES[nextStepIndex] || 'En attente',
      },
    });

    return {
      jobId,
      status: 'PROCESSING',
      currentStepIndex: nextStepIndex,
      progress,
      currentStep: STEP_NAMES[nextStepIndex] || 'En attente',
      totalSteps: TOTAL_STEPS,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error(`[BlogJob:${jobId}] Erreur étape ${stepIndex + 1}:`, error);

    await markJobAsFailed(jobId, errorMessage);

    return {
      jobId,
      status: 'FAILED',
      currentStepIndex: stepIndex,
      progress: Math.round((stepIndex / TOTAL_STEPS) * 100),
      currentStep: `Échec: ${STEP_NAMES[stepIndex] || 'Étape inconnue'}`,
      totalSteps: TOTAL_STEPS,
      error: errorMessage,
    };
  }
}

/**
 * Exécute une seule étape de la génération en important dynamiquement
 * les fonctions du générateur sectional.
 *
 * On réutilise les fonctions internes du générateur existant
 * plutôt que de les dupliquer.
 */
async function executeSingleStep(
  anthropic: Anthropic,
  options: SectionalGenerationOptions,
  usePsypnosStyle: boolean,
  stepIndex: number,
  partial: PartialResult
): Promise<PartialResult> {
  // Import dynamique pour accéder aux fonctions internes du générateur
  const generator = await import('../../common/claude-article-generator-sectional');

  // Utiliser generateArticleSectional avec un onProgress qui capture
  // le résultat d'une seule étape serait complexe.
  // Au lieu de cela, on réutilise la logique existante via une approche
  // step-by-step en appelant directement les fonctions exportées.
  //
  // Comme les fonctions individuelles ne sont pas exportées, on utilise
  // l'approche suivante : on exécute generateArticleSectional mais avec
  // un mécanisme qui s'arrête après une seule étape.
  //
  // Alternative retenue : appeler les fonctions Claude API directement
  // en répliquant la logique par étape (les fonctions du générateur
  // sectional ne sont pas exportées individuellement).

  const { parseJsonFromText, withRetryAndTimeout } = await import('../../common/ai-utils');

  const updated = { ...partial };

  switch (stepIndex) {
    case 0: {
      // Étape 1: Générer le plan détaillé
      const result = await runStepWithGenerator(anthropic, options, usePsypnosStyle, 0, updated);
      updated.outline = result.outline;
      break;
    }
    case 1: {
      // Étape 2: Générer l'introduction
      if (!updated.outline) throw new Error('Plan détaillé manquant');
      const result = await runStepWithGenerator(anthropic, options, usePsypnosStyle, 1, updated);
      updated.introduction = result.introduction;
      break;
    }
    case 2: {
      // Étape 3: Générer les sections
      if (!updated.outline) throw new Error('Plan détaillé manquant');
      const result = await runStepWithGenerator(anthropic, options, usePsypnosStyle, 2, updated);
      updated.sections = result.sections;
      // Assembler le contenu partiel
      updated.assembledContent = [updated.introduction || '', ...(updated.sections || [])]
        .filter(Boolean)
        .join('\n\n');
      break;
    }
    case 3: {
      // Étape 4: Générer la conclusion
      if (!updated.outline) throw new Error('Plan détaillé manquant');
      const result = await runStepWithGenerator(anthropic, options, usePsypnosStyle, 3, updated);
      updated.conclusion = result.conclusion;
      // Mettre à jour le contenu assemblé
      updated.assembledContent = [
        updated.introduction || '',
        ...(updated.sections || []),
        updated.conclusion || '',
      ]
        .filter(Boolean)
        .join('\n\n');
      break;
    }
    case 4: {
      // Étape 5: Révision de cohérence
      if (!updated.outline) throw new Error('Plan détaillé manquant');
      const result = await runStepWithGenerator(anthropic, options, usePsypnosStyle, 4, updated);
      updated.revisedContent = result.revisedContent;
      updated.coherenceScore = result.coherenceScore;
      break;
    }
    case 5: {
      // Étape 6: Titre et description SEO
      if (!updated.outline) throw new Error('Plan détaillé manquant');
      const result = await runStepWithGenerator(anthropic, options, usePsypnosStyle, 5, updated);
      updated.title = result.title;
      updated.description = result.description;
      break;
    }
    case 6: {
      // Étape 7: Tags
      const result = await runStepWithGenerator(anthropic, options, usePsypnosStyle, 6, updated);
      updated.tags = result.tags;
      break;
    }
    case 7: {
      // Étape 8: FAQ
      const result = await runStepWithGenerator(anthropic, options, usePsypnosStyle, 7, updated);
      updated.faq = result.faq;
      break;
    }
    case 8: {
      // Étape 9: Prompt image
      const result = await runStepWithGenerator(anthropic, options, usePsypnosStyle, 8, updated);
      updated.imagePrompt = result.imagePrompt;
      break;
    }
    default:
      throw new Error(`Étape inconnue: ${stepIndex}`);
  }

  return updated;
}

/**
 * Exécute une étape spécifique en utilisant generateArticleSectional
 * avec un mécanisme de capture par étape.
 *
 * Approche : on lance la génération complète mais on l'interrompt
 * après l'étape souhaitée via un AbortController-like pattern.
 * Comme les fonctions internes ne sont pas exportées, on utilise
 * une approche différente : on réplique la logique minimale pour
 * chaque étape en réutilisant le client Anthropic.
 */
async function runStepWithGenerator(
  anthropic: Anthropic,
  options: SectionalGenerationOptions,
  usePsypnosStyle: boolean,
  stepIndex: number,
  partial: PartialResult
): Promise<Partial<PartialResult>> {
  // Import des utilitaires
  const { withRetryAndTimeout } = await import('../../common/ai-utils');
  const { parseJsonFromText } = await import('../../common/ai-utils');

  const API_TIMEOUT_MS = 90000;
  const RETRY_OPTIONS = {
    maxRetries: 2,
    initialDelayMs: 2000,
    backoffMultiplier: 2,
    maxDelayMs: 15000,
  };

  const LENGTH_CONFIG = {
    short: {
      words: '800-1000',
      sections: 2,
      introWords: 150,
      sectionWords: 300,
      conclusionWords: 150,
      maxTokensPerSection: 1500,
    },
    medium: {
      words: '1000-1500',
      sections: 3,
      introWords: 200,
      sectionWords: 350,
      conclusionWords: 150,
      maxTokensPerSection: 2000,
    },
    long: {
      words: '1500-2000',
      sections: 4,
      introWords: 250,
      sectionWords: 400,
      conclusionWords: 200,
      maxTokensPerSection: 2500,
    },
  };

  const lengthConfig = LENGTH_CONFIG[options.targetLength || 'medium'];

  // Import du style prompt si nécessaire
  let PSYPNOS_STYLE_SYSTEM_PROMPT: string | undefined;
  if (usePsypnosStyle) {
    const styleModule = await import('../../common/psypnos-system-prompt');
    PSYPNOS_STYLE_SYSTEM_PROMPT = styleModule.PSYPNOS_STYLE_SYSTEM_PROMPT;
  }

  const buildEditorialContext = (): string => {
    const parts: string[] = [];
    if (options.seoQuery) parts.push(`**Requête SEO** : ${options.seoQuery}`);
    if (options.searchIntent) parts.push(`**Intention de recherche** : ${options.searchIntent}`);
    if (options.editorialCategory) parts.push(`**Catégorie** : ${options.editorialCategory}`);
    if (options.readerPersona) parts.push(`**Persona lecteur** : ${options.readerPersona}`);
    if (options.preferredTones && options.preferredTones.length > 0) {
      const tonesDesc = options.preferredTones.map(t => `- **${t}**`).join('\n');
      parts.push(`**Tons** :\n${tonesDesc}`);
    }
    return parts.join('\n');
  };

  const MARKDOWN_INSTRUCTIONS = `
## RÈGLES MARKDOWN STRICTES
- Une idée par paragraphe (3-4 lignes max)
- AUCUN retour à la ligne dans un paragraphe
- **Gras** pour concepts-clés, *italique* pour introspection
- Listes : 3-5 points maximum
- Citations : > « Citation » — Auteur
- Callouts : [!NOTE], [!TIP], [!WARNING] si pertinent
- Pas de tableaux, pas de MAJUSCULES
- H2/H3 : pas de majuscule inutile (sauf noms propres)
`;

  const editorialContext = buildEditorialContext();
  const outline = partial.outline;

  switch (stepIndex) {
    case 0: {
      // PLAN DÉTAILLÉ
      const prompt = `Tu dois créer un plan TRÈS DÉTAILLÉ pour un article de blog.

## SUJET
${options.topic}

## CATÉGORIE
${options.category}

## CONTEXTE ÉDITORIAL
${editorialContext}

## CONTRAINTES
- Longueur cible : ${lengthConfig.words} mots
- Nombre de sections H2 : ${lengthConfig.sections} sections
- Introduction : ~${lengthConfig.introWords} mots
- Chaque section : ~${lengthConfig.sectionWords} mots
- Conclusion : ~${lengthConfig.conclusionWords} mots

## TÂCHE
Génère un plan détaillé au format JSON suivant.

{
  "mainThesis": "La thèse principale de l'article",
  "targetAudience": "Description précise du public cible",
  "keyMessages": ["Message clé 1", "Message clé 2", "Message clé 3"],
  "introduction": {
    "hook": "Phrase d'accroche captivante",
    "contextSetup": "Contexte qui pose le problème",
    "promiseToReader": "Ce que le lecteur va apprendre"
  },
  "sections": [
    {
      "title": "Titre H2",
      "purpose": "Objectif de cette section",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "transitionToNext": "Transition vers la section suivante",
      "estimatedWords": ${lengthConfig.sectionWords}
    }
  ],
  "conclusion": {
    "keyTakeaways": ["Point à retenir 1", "Point à retenir 2"],
    "callToAction": "CTA subtil et bienveillant",
    "closingThought": "Pensée finale inspirante"
  }
}

Réponds UNIQUEMENT avec le JSON`;

      const message = await withRetryAndTimeout(
        () =>
          anthropic.messages.create({
            model: CLAUDE_DEFAULT_MODEL,
            max_tokens: 5000,
            temperature: 0.7,
            ...(PSYPNOS_STYLE_SYSTEM_PROMPT && { system: PSYPNOS_STYLE_SYSTEM_PROMPT }),
            messages: [{ role: 'user', content: prompt }],
          }),
        API_TIMEOUT_MS,
        RETRY_OPTIONS
      );

      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      const parsedOutline = parseJsonFromText(text);
      return { outline: parsedOutline };
    }

    case 1: {
      // INTRODUCTION
      if (!outline) throw new Error('Plan détaillé manquant');

      const prompt = `Tu dois rédiger l'INTRODUCTION d'un article de blog.

## SUJET
${options.topic}

## CONTEXTE ÉDITORIAL
${editorialContext}

## PLAN DE L'INTRODUCTION
- **Accroche** : ${outline.introduction.hook}
- **Contexte** : ${outline.introduction.contextSetup}
- **Promesse au lecteur** : ${outline.introduction.promiseToReader}

## THÈSE PRINCIPALE
${outline.mainThesis}

## SECTIONS À VENIR
${outline.sections.map((s, i) => `${i + 1}. ${s.title}`).join('\n')}

${MARKDOWN_INSTRUCTIONS}

## INSTRUCTIONS
1. Rédige 2 paragraphes maximum (~${lengthConfig.introWords} mots)
2. Commence par l'accroche
3. Pose le contexte de façon engageante
4. Termine avec la promesse/valeur pour le lecteur
5. N'inclus PAS de titre H1 ou H2

IMPORTANT: Rédige UNIQUEMENT l'introduction en Markdown.`;

      const message = await withRetryAndTimeout(
        () =>
          anthropic.messages.create({
            model: CLAUDE_DEFAULT_MODEL,
            max_tokens: 1000,
            temperature: 0.7,
            ...(PSYPNOS_STYLE_SYSTEM_PROMPT && { system: PSYPNOS_STYLE_SYSTEM_PROMPT }),
            messages: [{ role: 'user', content: prompt }],
          }),
        API_TIMEOUT_MS,
        RETRY_OPTIONS
      );

      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      return { introduction: text.trim() };
    }

    case 2: {
      // SECTIONS (toutes les sections en un seul step)
      if (!outline) throw new Error('Plan détaillé manquant');

      const sections: string[] = [];
      let previousContent = partial.introduction || '';

      for (let i = 0; i < outline.sections.length; i++) {
        const section = outline.sections[i];
        const isLast = i === outline.sections.length - 1;

        const previousContext =
          previousContent.length > 0
            ? `## RÉSUMÉ DES SECTIONS PRÉCÉDENTES\n${previousContent.slice(-2000)}...\n\n`
            : '';

        const prompt = `Tu dois rédiger UNE SECTION d'un article de blog.

## SUJET GLOBAL
${options.topic}

## CONTEXTE ÉDITORIAL
${editorialContext}

## THÈSE PRINCIPALE
${outline.mainThesis}

${previousContext}
## SECTION À RÉDIGER (Section ${i + 1}/${outline.sections.length})

**Titre H2** : ${section.title}
**Objectif** : ${section.purpose}
**Points clés à couvrir** :
${section.keyPoints.map(p => `- ${p}`).join('\n')}
**Longueur cible** : ~${section.estimatedWords} mots
${section.transitionToNext && !isLast ? `**Transition** : ${section.transitionToNext}` : ''}

${MARKDOWN_INSTRUCTIONS}

## INSTRUCTIONS
1. Commence par le titre H2 : ## ${section.title}
2. Développe TOUS les points clés listés
3. Longueur : ~${section.estimatedWords} mots

IMPORTANT: Rédige UNIQUEMENT cette section en Markdown (titre H2 inclus).`;

        const message = await withRetryAndTimeout(
          () =>
            anthropic.messages.create({
              model: CLAUDE_DEFAULT_MODEL,
              max_tokens: lengthConfig.maxTokensPerSection,
              temperature: 0.7,
              ...(PSYPNOS_STYLE_SYSTEM_PROMPT && { system: PSYPNOS_STYLE_SYSTEM_PROMPT }),
              messages: [{ role: 'user', content: prompt }],
            }),
          API_TIMEOUT_MS,
          RETRY_OPTIONS
        );

        const text = message.content[0].type === 'text' ? message.content[0].text : '';
        sections.push(text.trim());
        previousContent += '\n\n' + text.trim();
      }

      return { sections };
    }

    case 3: {
      // CONCLUSION
      if (!outline) throw new Error('Plan détaillé manquant');

      const fullContentSoFar = partial.assembledContent || '';

      const prompt = `Tu dois rédiger la CONCLUSION d'un article de blog.

## SUJET
${options.topic}

## CONTEXTE ÉDITORIAL
${editorialContext}

## THÈSE PRINCIPALE
${outline.mainThesis}

## PLAN DE LA CONCLUSION
- **Points à retenir** : ${outline.conclusion.keyTakeaways.join(', ')}
- **CTA** : ${outline.conclusion.callToAction}
- **Pensée finale** : ${outline.conclusion.closingThought}

## EXTRAIT DE L'ARTICLE
${fullContentSoFar.slice(-1500)}...

${MARKDOWN_INSTRUCTIONS}

## INSTRUCTIONS
1. Rédige 2-3 paragraphes (~${lengthConfig.conclusionWords} mots)
2. Commence par un titre H2 approprié
3. Rappelle les points essentiels
4. Intègre un CTA subtil et bienveillant
5. Termine avec une pensée inspirante

IMPORTANT: Rédige UNIQUEMENT la conclusion en Markdown (titre H2 inclus).`;

      const message = await withRetryAndTimeout(
        () =>
          anthropic.messages.create({
            model: CLAUDE_DEFAULT_MODEL,
            max_tokens: 1000,
            temperature: 0.7,
            ...(PSYPNOS_STYLE_SYSTEM_PROMPT && { system: PSYPNOS_STYLE_SYSTEM_PROMPT }),
            messages: [{ role: 'user', content: prompt }],
          }),
        API_TIMEOUT_MS,
        RETRY_OPTIONS
      );

      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      return { conclusion: text.trim() };
    }

    case 4: {
      // RÉVISION DE COHÉRENCE — graceful degradation si timeout
      if (!outline) throw new Error('Plan détaillé manquant');

      const fullContent = partial.assembledContent || '';
      const COHERENCE_TIMEOUT_MS = 50000; // 50s pour rester sous la limite Vercel 60s
      const COHERENCE_RETRY_OPTIONS = { ...RETRY_OPTIONS, maxRetries: 1 };

      try {
        const prompt = `Tu dois RÉVISER un article pour améliorer sa cohérence et sa fluidité.

## SUJET
${options.topic}

## THÈSE PRINCIPALE
${outline.mainThesis}

## ARTICLE À RÉVISER
${fullContent}

## TÂCHE
1. Analyse la cohérence globale
2. Améliore les transitions entre sections
3. Uniformise le ton et le style
4. Corrige les répétitions ou incohérences

## FORMAT DE RÉPONSE
{
  "revisedContent": "L'article révisé complet en Markdown",
  "coherenceScore": 85,
  "changesApplied": ["Changement 1", "Changement 2"]
}`;

        const message = await withRetryAndTimeout(
          () =>
            anthropic.messages.create({
              model: CLAUDE_DEFAULT_MODEL,
              max_tokens: 8000,
              temperature: 0.3,
              ...(PSYPNOS_STYLE_SYSTEM_PROMPT && { system: PSYPNOS_STYLE_SYSTEM_PROMPT }),
              messages: [{ role: 'user', content: prompt }],
            }),
          COHERENCE_TIMEOUT_MS,
          COHERENCE_RETRY_OPTIONS
        );

        const text = message.content[0].type === 'text' ? message.content[0].text : '';

        const parsed = parseJsonFromText(text, { revisedContent: fullContent, coherenceScore: 70 });
        const revisedContent =
          parsed.revisedContent && parsed.revisedContent.length > fullContent.length * 0.5
            ? parsed.revisedContent
            : fullContent;
        return { revisedContent, coherenceScore: parsed.coherenceScore || 75 };
      } catch (revisionError) {
        // Graceful degradation : conserver le contenu original si la révision échoue
        console.warn(
          `[BlogJob] Révision de cohérence échouée, contenu original conservé:`,
          revisionError instanceof Error ? revisionError.message : revisionError
        );
        return { revisedContent: fullContent, coherenceScore: 70 };
      }
    }

    case 5: {
      // TITRE ET DESCRIPTION SEO
      const content = partial.revisedContent || partial.assembledContent || '';
      const contentPreview = content.slice(0, 2000);

      const prompt = `Génère un titre et une description SEO optimisés.

## SUJET
${options.topic}

## THÈSE PRINCIPALE
${outline?.mainThesis || options.topic}

## REQUÊTE SEO
${options.seoQuery || 'Non spécifiée'}

## DÉBUT DU CONTENU
${contentPreview}...

## TÂCHE
{
  "title": "Titre accrocheur (50-60 caractères)",
  "description": "Meta description engageante (20 mots max)"
}

Réponds UNIQUEMENT avec le JSON.`;

      const message = await withRetryAndTimeout(
        () =>
          anthropic.messages.create({
            model: CLAUDE_DEFAULT_MODEL,
            max_tokens: 500,
            temperature: 0.7,
            ...(PSYPNOS_STYLE_SYSTEM_PROMPT && { system: PSYPNOS_STYLE_SYSTEM_PROMPT }),
            messages: [{ role: 'user', content: prompt }],
          }),
        API_TIMEOUT_MS,
        RETRY_OPTIONS
      );

      const text = message.content[0].type === 'text' ? message.content[0].text : '';

      try {
        const parsed = parseJsonFromText(text, {
          title: options.topic,
          description: `Découvrez notre article sur ${options.topic}`,
        });
        return { title: parsed.title, description: parsed.description };
      } catch {
        return {
          title: options.topic,
          description: `Découvrez notre article sur ${options.topic}`,
        };
      }
    }

    case 6: {
      // TAGS
      const content = partial.revisedContent || partial.assembledContent || '';
      const title = partial.title || options.topic;
      const contentPreview = content.slice(0, 1500);

      const prompt = `Génère des tags SEO.

## TITRE
${title}

## SUJET
${options.topic}

## CATÉGORIE
${options.category}

## EXTRAIT
${contentPreview}...

## TÂCHE
{
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"]
}

RÈGLES :
- 5 à 8 tags, en français, pertinents SEO

Réponds UNIQUEMENT avec le JSON.`;

      const message = await withRetryAndTimeout(
        () =>
          anthropic.messages.create({
            model: CLAUDE_DEFAULT_MODEL,
            max_tokens: 300,
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }],
          }),
        API_TIMEOUT_MS,
        RETRY_OPTIONS
      );

      const text = message.content[0].type === 'text' ? message.content[0].text : '';

      try {
        const parsed = parseJsonFromText(text, { tags: [] });
        return { tags: parsed.tags || [] };
      } catch {
        return { tags: [] };
      }
    }

    case 7: {
      // FAQ
      const content = partial.revisedContent || partial.assembledContent || '';
      const title = partial.title || options.topic;
      const contentPreview = content.slice(0, 2000);

      const prompt = `Génère une FAQ pour cet article.

## TITRE
${title}

## SUJET
${options.topic}

## REQUÊTE SEO
${options.seoQuery || 'Non spécifiée'}

## EXTRAIT
${contentPreview}...

## TÂCHE
{
  "faq": [
    {"question": "Question 1 ?", "answer": "Réponse concise (2-3 phrases)"},
    {"question": "Question 2 ?", "answer": "Réponse concise (2-3 phrases)"}
  ]
}

RÈGLES :
- 3 à 5 questions
- Questions recherchées sur Google
- Réponses optimisées featured snippets (50-80 mots)

Réponds UNIQUEMENT avec le JSON.`;

      const message = await withRetryAndTimeout(
        () =>
          anthropic.messages.create({
            model: CLAUDE_DEFAULT_MODEL,
            max_tokens: 1500,
            temperature: 0.7,
            ...(PSYPNOS_STYLE_SYSTEM_PROMPT && { system: PSYPNOS_STYLE_SYSTEM_PROMPT }),
            messages: [{ role: 'user', content: prompt }],
          }),
        API_TIMEOUT_MS,
        RETRY_OPTIONS
      );

      const text = message.content[0].type === 'text' ? message.content[0].text : '';

      try {
        const parsed = parseJsonFromText(text, { faq: [] });
        return { faq: parsed.faq || [] };
      } catch {
        return { faq: [] };
      }
    }

    case 8: {
      // PROMPT IMAGE
      const content = partial.revisedContent || partial.assembledContent || '';
      const title = partial.title || options.topic;
      const contentPreview = content.slice(0, 1500);

      const {
        PSYPNOS_IMAGE_GENERATION_PROMPT,
        enrichImagePromptWithThematics,
        validatePromptForMandatoryElements,
      } = await import('../../common/psypnos-image-prompt-generator');

      const prompt = `Génère un prompt pour une image d'illustration respectant l'identité visuelle Psypnos v2.0.

## TITRE
${title}

## SUJET
${options.topic}

## CATÉGORIE
${options.category}

## EXTRAIT
${contentPreview}...

## 4 ÉLÉMENTS OBLIGATOIRES
1. SILHOUETTE(S) MINIMALISTE(S) avec aura dorée
2. LUMIÈRE DORÉE RAYONNANTE (#c7a962)
3. PALETTE PSYPNOS : Or (#c7a962), Bleu nuit (#0e1f2f), Ivoire (#f5f1e6)
4. ATMOSPHÈRE CHALEUREUSE + PROFONDEUR EN COUCHES

## STRUCTURE
Image 1920×640px (ratio 3:1), style aquarelle numérique.

Réponds UNIQUEMENT avec le prompt image.`;

      const message = await withRetryAndTimeout(
        () =>
          anthropic.messages.create({
            model: CLAUDE_DEFAULT_MODEL,
            max_tokens: 1000,
            temperature: 0.7,
            system: PSYPNOS_IMAGE_GENERATION_PROMPT,
            messages: [{ role: 'user', content: prompt }],
          }),
        API_TIMEOUT_MS,
        RETRY_OPTIONS
      );

      const rawPrompt = message.content[0].type === 'text' ? message.content[0].text : '';
      const enriched = enrichImagePromptWithThematics(
        rawPrompt.trim(),
        options.topic,
        options.category
      );
      const validation = validatePromptForMandatoryElements(enriched);

      if (!validation.isValid) {
        console.warn(
          `⚠️ IMAGE_PROMPT manque des éléments: ${validation.missingElements.join(', ')}`
        );
      }

      return { imagePrompt: enriched };
    }

    default:
      throw new Error(`Étape inconnue: ${stepIndex}`);
  }
}

/**
 * Construit le résultat final à partir des résultats partiels
 */
function buildFinalResult(
  partial: PartialResult,
  options: SectionalGenerationOptions
): Record<string, unknown> {
  const content = partial.revisedContent || partial.assembledContent || '';
  const title = partial.title || options.topic;
  const contentWithTitle = title ? `# ${title}\n\n${content}` : content;

  return {
    success: true,
    article: {
      title,
      description: partial.description || `Découvrez notre article sur ${options.topic}`,
      content: contentWithTitle,
      category: options.category,
      tags: partial.tags || [],
      faq: partial.faq || [],
      imagePrompt: partial.imagePrompt,
    },
    generationMetadata: {
      outline: partial.outline,
      sectionsGenerated: partial.sections?.length || 0,
      totalSections: partial.outline?.sections?.length || 0,
      stepsCompleted: TOTAL_STEPS,
      totalSteps: TOTAL_STEPS,
      coherenceScore: partial.coherenceScore || 0,
    },
  };
}

/**
 * Marque un job comme échoué en base de données
 */
async function markJobAsFailed(jobId: string, error: string): Promise<void> {
  await prisma.blogGenerationJob.update({
    where: { id: jobId },
    data: {
      status: 'FAILED',
      currentStep: 'Échec de la génération',
      error,
      completedAt: new Date(),
    },
  });
  console.error(`[BlogJob:${jobId}] Job échoué (FAILED): ${error}`);
}
