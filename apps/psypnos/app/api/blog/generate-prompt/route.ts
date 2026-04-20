/**
 * API pour générer un prompt image basé sur le contenu de l'article
 * Utilise Claude avec les mêmes directives que la génération d'article
 *
 * PROTÉGÉ: Requiert une authentification admin
 */

import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_DEFAULT_MODEL } from '@kairn/ai';
import { NextRequest, NextResponse } from 'next/server';

import { formatAIErrorResponse } from '@/app/api/common/ai-error-handler';
import { withRetryAndTimeout } from '@/app/api/common/ai-utils';
import {
  PSYPNOS_IMAGE_GENERATION_PROMPT,
  enrichImagePromptWithThematics,
  validatePromptForMandatoryElements,
} from '@/app/api/common/psypnos-image-prompt-generator';

import { withAdminAuth } from '../../auth/middleware';

// Vercel serverless function timeout — call + correction loop
export const maxDuration = 180;

// Configuration timeout et retry
// Délais augmentés pour mieux gérer les erreurs 529 (overloaded) de l'API Anthropic
const API_TIMEOUT_MS = 60000; // 60 secondes
const RETRY_OPTIONS = {
  maxRetries: 5, // Plus de tentatives pour les surcharges API
  initialDelayMs: 2000, // 2 secondes - délai initial plus long
  backoffMultiplier: 2, // 2s -> 4s -> 8s -> 16s -> 32s
  maxDelayMs: 32000, // Maximum 32 secondes entre les tentatives
  onRetry: (attempt: number, error: unknown, delayMs: number) => {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(
      `⏳ Retry ${attempt}/5 pour generate-prompt après erreur: ${errorMsg.slice(0, 100)}. Prochaine tentative dans ${delayMs / 1000}s`
    );
  },
};
const MAX_VALIDATION_ATTEMPTS = 3; // Nombre max de tentatives de correction

export async function POST(request: NextRequest) {
  // Vérifier l'authentification admin - CRITIQUE pour protéger les crédits API
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'Clé API Anthropic non configurée' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { title, content, category, tags, seoIntent, persona, tones } = body;

    // Validation des paramètres
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Le titre et le contenu de l'article sont obligatoires",
        },
        { status: 400 }
      );
    }

    // Pré-analyser le titre pour identifier un mapping thématique (liste enrichie)
    const titleLower = title.toLowerCase();
    const themeKeywords: Record<string, string[]> = {
      anxiety: ['anxiété', 'anxieux', 'angoisse'],
      depression: ['dépression', 'déprime', 'tristesse'],
      authenticity: ['authenticité', 'authentique', 'vrai'],
      forgiveness: ['pardon', 'pardonner', 'culpabilité'],
      presence: ['présence', 'présent', 'ici et maintenant'],
      meditation: ['méditation', 'méditer', 'pleine conscience'],
      transformation: ['transformation', 'transformer', 'changer'],
      connection: ['connexion', 'lien'],
      relations: ['relation', 'couple', 'famille'],
      healing: ['guérison', 'guérir', 'cicatriser'],
      fear: ['peur', 'peurs', 'crainte'],
      intuition: ['intuition', 'intuitif', 'ressenti'],
      grief: ['deuil', 'perte', 'décès'],
      burnout: ['burn-out', 'burnout', 'épuisement'],
      stress: ['stress', 'stressé', 'tension'],
      confiance: ['confiance', 'confiant'],
      estime: ['estime', 'valeur'],
      separation: ['séparation', 'rupture', 'divorce'],
      travail: ['travail', 'professionnel', 'carrière'],
      sommeil: ['sommeil', 'insomnie', 'dormir'],
      hypnose: ['hypnose', 'hypnotique', 'transe'],
      respiration: ['respiration', 'souffle', 'holotropique'],
      therapie: ['thérapie', 'thérapeute'],
      accompagnement: ['accompagnement'],
      autonomie: ['autonomie', 'autonome', 'indépendance'],
    };

    const matchedTheme = Object.entries(themeKeywords).find(([, keywords]) =>
      keywords.some(keyword => titleLower.includes(keyword))
    )?.[0];

    // Créer le prompt pour Claude avec directives renforcées et orientation cible
    const thematicContext = matchedTheme
      ? `\n\n**Contexte Thématique Identifié** : "${matchedTheme}"\nCe sujet est fortement associé à des concepts spécifiques. Utilise le mapping thématique correspondant pour guider la composition visuelle.`
      : '';

    const prompt = `Tu es un expert en création de prompts image transpersonnels pour PSYPNOS.

## ARTICLE À ANALYSER

**Titre** : ${title}
**Catégorie** : ${category || 'Non spécifiée'}
${tags && tags.length > 0 ? `**Tags** : ${tags.join(', ')}` : ''}
${seoIntent ? `**Intention SEO** : ${seoIntent}` : ''}
${persona ? `**Persona Lecteur** : ${persona}` : ''}
${tones && tones.length > 0 ? `**Tons** : ${tones.join(', ')}` : ''}

**Contenu de l'article (premiers 2000 caractères)** :
${content.substring(0, 2000)}...
${thematicContext}

---

## DIRECTIVES OBLIGATOIRES

**CHAQUE prompt DOIT inclure les 4 éléments clés (NON NÉGOCIABLE) :**

1. ✅ **SILHOUETTE(S) MINIMALISTE(S)** : 1-3 silhouettes épurées, illuminées d'une aura dorée
2. ✅ **LUMIÈRE DORÉE RAYONNANTE** : Halos ou rayonnement enveloppant (EXPLICITEMENT mentionnée)
3. ✅ **PALETTE PSYPNOS OFFICIELLE** : Or (#c7a962), bleu nuit (#0e1f2f), ivoire (#f5f1e6) - DOIT être nommée
4. ✅ **ATMOSPHÈRE CHALEUREUSE + PROFONDEUR** : Voile translucide doux, couches de profondeur, ambiance accueillante

**PRIORITÉ ABSOLUE - CIBLE THÉRAPEUTIQUE** :
- L'image s'adresse à des personnes potentiellement en souffrance
- Elle doit transmettre : ACCUEIL, SÉCURITÉ, ESPOIR, CHALEUR HUMAINE
- Éviter le ton trop ésotérique ou mystique qui pourrait intimider
- Le sujet doit être identifiable en 2 secondes

AVANT de finaliser, vérifie que TOUS les 4 éléments sont présents ET que l'image inspire confiance.

---

## TÂCHE

Génère un prompt image ACCUEILLANT et CHALEUREUX qui est **CLAIREMENT REPRÉSENTATIF du contenu**.

**ANALYSE REQUISE** :
1. Identifie les CONCEPTS CLÉS du contenu (pas juste le titre)
2. Repère les ÉMOTIONS/ÉTATS décrits
3. Note les TRANSFORMATIONS suggérées (toujours montrer le chemin vers la lumière)
4. Détermine le MESSAGE D'ESPOIR à transmettre

**Le prompt doit** :
1. INCLURE TOUJOURS : silhouette minimaliste, lumière dorée, palette Psypnos, atmosphère chaleureuse
2. Respecter la structure (dimensions, style, composition, palette, ambiance, détails, message, directive)
3. Être SYMBOLIQUE mais IMMÉDIATEMENT COMPRÉHENSIBLE
4. Avoir un LIEN CONCEPTUEL CLAIR avec le contenu
5. Inclure un message d'espoir implicite (ex: "L'image transmet : L'apaisement est possible")

---

**RÉPONSE** : Le prompt image COMPLET respectant tous les critères, sans explications.`;

    // Appeler Claude avec le system prompt spécialisé
    const anthropic = new Anthropic({ apiKey });

    // Appel API avec retry et timeout
    const message = await withRetryAndTimeout(
      () =>
        anthropic.messages.create({
          model: CLAUDE_DEFAULT_MODEL,
          max_tokens: 1000,
          system: PSYPNOS_IMAGE_GENERATION_PROMPT,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      API_TIMEOUT_MS,
      RETRY_OPTIONS
    );

    // Extraire le texte généré
    const firstBlock = message.content[0];
    const generatedPrompt = firstBlock?.type === 'text' ? firstBlock.text : '';

    if (!generatedPrompt?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Impossible de générer le prompt image' },
        { status: 500 }
      );
    }

    // Enrichir avec les données thématiques ET la catégorie
    let currentPrompt = enrichImagePromptWithThematics(generatedPrompt, title, category);

    // Valider que le prompt contient les 4 éléments clés obligatoires
    let validation = validatePromptForMandatoryElements(currentPrompt);
    let validationAttempts = 1;

    // Boucle de correction avec vraies tentatives multiples
    while (!validation.isValid && validationAttempts < MAX_VALIDATION_ATTEMPTS) {
      console.log(
        `🔄 Tentative de correction ${validationAttempts}/${MAX_VALIDATION_ATTEMPTS - 1}: éléments manquants:`,
        validation.missingElements
      );

      const correctionPrompt = `Le prompt image généré manque les éléments suivants : ${validation.missingElements.join(', ')}.

Prompt actuel à corriger:
${currentPrompt}

Corrections nécessaires:
${validation.suggestedCorrections.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Réécris le prompt COMPLET en intégrant EXPLICITEMENT ces éléments manquants. Le prompt final doit être complet et respecter TOUS les 4 éléments clés obligatoires avec les COULEURS PSYPNOS OFFICIELLES:
1. Silhouette(s) minimaliste(s) illuminée(s)
2. Lumière dorée rayonnante enveloppante (#c7a962, #f0d9a3)
3. Palette Psypnos : or (#c7a962), bleu nuit (#0e1f2f), ivoire (#f5f1e6)
4. Atmosphère CHALEUREUSE et ACCUEILLANTE + profondeur en couches

IMPORTANT: L'image doit transmettre CHALEUR, ACCUEIL et ESPOIR pour des personnes en recherche d'aide thérapeutique.`;

      try {
        // Appel de correction avec retry et timeout
        const correctionMessage = await withRetryAndTimeout(
          () =>
            anthropic.messages.create({
              model: CLAUDE_DEFAULT_MODEL,
              max_tokens: 1000,
              system: PSYPNOS_IMAGE_GENERATION_PROMPT,
              messages: [
                {
                  role: 'user',
                  content: correctionPrompt,
                },
              ],
            }),
          API_TIMEOUT_MS,
          RETRY_OPTIONS
        );

        const correctionBlock = correctionMessage.content[0];
        const correctedPrompt =
          correctionBlock?.type === 'text' ? correctionBlock.text : currentPrompt;

        // Enrichir et valider le nouveau prompt avec la catégorie
        currentPrompt = enrichImagePromptWithThematics(correctedPrompt, title, category);
        validation = validatePromptForMandatoryElements(currentPrompt);
        validationAttempts++;

        if (validation.isValid) {
          console.log(`✅ Prompt validé après ${validationAttempts} tentative(s)`);
        }
      } catch (correctionError) {
        console.error(
          `Erreur lors de la correction (tentative ${validationAttempts}):`,
          correctionError
        );
        validationAttempts++;
        // Continuer avec le prompt actuel même si la correction échoue
      }
    }

    // Ré-valider après corrections
    const finalPrompt = currentPrompt;
    const finalValidation = validation;

    return NextResponse.json({
      success: true,
      imagePrompt: finalPrompt,
      rawPrompt: generatedPrompt,
      validation: {
        isValid: finalValidation.isValid,
        missingElements: finalValidation.missingElements,
        suggestedCorrections: !finalValidation.isValid ? finalValidation.suggestedCorrections : [],
        validationDetails: finalValidation,
      },
      correctionApplied: validationAttempts > 1,
      validationAttempts,
      maxAttempts: MAX_VALIDATION_ATTEMPTS,
    });
  } catch (error) {
    console.error('Erreur lors de la génération du prompt image :', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Erreur de parsing JSON' },
        { status: 400 }
      );
    }

    const { body, status } = formatAIErrorResponse(error);
    return NextResponse.json(
      { success: false, error: body.message, errorType: body.errorType },
      { status }
    );
  }
}
