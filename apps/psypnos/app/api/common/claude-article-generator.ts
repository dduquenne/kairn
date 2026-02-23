/**
 * Utilitaire pour générer des articles de blog avec Claude (Anthropic)
 */

import Anthropic from '@anthropic-ai/sdk';

import { parseJsonFromText, validateXmlCompletion, withRetryAndTimeout } from './ai-utils';
import {
  PSYPNOS_IMAGE_GENERATION_PROMPT,
  enrichImagePromptWithThematics,
  validatePromptForMandatoryElements,
  PSYPNOS_BRAND_COLORS,
  getCategoryStyleModifier,
} from './psypnos-image-prompt-generator';
import { PSYPNOS_STYLE_SYSTEM_PROMPT } from './psypnos-system-prompt';

// Configuration des timeouts et retries
const API_TIMEOUT_MS = 120000; // 2 minutes par appel
const RETRY_OPTIONS = {
  maxRetries: 3,
  initialDelayMs: 2000,
  backoffMultiplier: 2,
  maxDelayMs: 30000,
};

export interface ArticleGenerationOptions {
  topic: string;
  category: string;
  tags?: string[];
  targetLength?: 'short' | 'medium' | 'long';
  tone?: 'professional' | 'empathetic' | 'educational';
  includeReferences?: boolean;
  // ✨ Nouveaux paramètres pour style PSYPNOS
  seoQuery?: string; // Requête SEO principale
  searchIntent?: string; // Intention de recherche
  editorialCategory?: 'Comprendre' | 'Traverser' | 'Découvrir' | 'Cheminer';
  readerPersona?: string; // Description du persona lecteur
  specificTone?:
    | 'analytique'
    | 'poétique'
    | 'pédagogique'
    | 'introspectif'
    | 'informatif'
    | 'inspirant'
    | 'narratif'
    | 'conversationnel'
    | 'professionnel'
    | 'provocateur'
    | 'humoristique'
    | 'engagé'
    | 'scientifique'
    | 'pragmatique';
  // Nouveaux tons préférés (multi-sélection)
  preferredTones?: string[];
  usePsypnosStyle?: boolean; // Activer le style rédactionnel PSYPNOS complet (default: true)
}

export interface GeneratedArticle {
  success: boolean;
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  tags?: string[];
  faq?: Array<{ question: string; answer: string }>;
  error?: string;
  imagePrompt?: string; // Prompt pour générer l'image 1920x640
}

/**
 * INSTRUCTIONS TECHNIQUES : Markdown, Structure, SEO (Sections B, C, D, F, G)
 */
const PSYPNOS_TECHNICAL_INSTRUCTIONS = `
## RECOMMANDATIONS MARKDOWN STRICTES

### Principes fondamentaux
* Une seule idée par paragraphe de 3-4 lignes maximum.
* **RÈGLE IMPÉRATIVE** : Aucune phrase d'un même paragraphe ne doit être séparée par un retour à la ligne. Un paragraphe = un seul bloc Markdown, séparé des autres par une ligne vide. Tous les retours à la ligne internes sont interdits.
* Évite le gras trop fréquent. Préfère l'italique pour l'introspection.
* Utilise les lignes vides pour aérer.
* Intègre des séparateurs --- pour marquer les transitions profondes.

### Structure et hiérarchie
* H1 : titre global (ne pas l'inclure dans l'article, déjà géré par la page)
* H2 : sections majeures (2-4 sections max pour concision)
* H3 : sous-sections (si nécessaire)
* Ajoute un paragraphe d'introduction après le H2.
* Maximal 2 niveaux de profondeur (H2/H3).

### Convention de casse pour les titres (H2/H3)
* **RÈGLE IMPÉRATIVE** : Pas de majuscule inutile au début des titres (sauf noms propres et débuts de phrase)
* Exemples corrects :
  - ✅ "Comprendre l'hypnose ericksonienne"
  - ✅ "Comment gérer l'anxiété au quotidien"
  - ✅ "Les bénéfices de la méditation"
  - ✅ "Introduction à la psychothérapie transpersonnelle" (noms propres gardent leur majuscule)
* Exemples à éviter :
  - ❌ "Comprendre L'Hypnose Ericksonienne" (majuscules inutiles)
  - ❌ "Comment Gérer L'Anxiété" (majuscules inutiles)
  - ❌ "Les Bénéfices De La Méditation" (majuscules inutiles)

### Listes
* 3-5 points par liste maximum.
* Utilise-les régulièrement pour casser la densité du texte.

### Citations (élément premium pour Psypnos)
Format obligatoire :
\`\`\`
> « Votre citation ici. »
> — Auteur
\`\`\`

### Images
Suggère l'intégration quand pertinent :
\`\`\`
![Texte alternatif inspirant](image.jpg)
\`\`\`

### Boîtes de mise en avant
Utilise les callouts Markdown :

**Points importants à retenir :**
\`\`\`
> [!NOTE]
> Votre texte mis en avant.
> Éventuellement sur plusieurs lignes.
\`\`\`

**Conseils pratiques :**
\`\`\`
> [!TIP]
> Votre conseil mis en avant.
> Éventuellement sur plusieurs lignes.
\`\`\`

**Avertissements :**
\`\`\`
> [!WARNING]
> Votre avertissement mis en avant.
> Éventuellement sur plusieurs lignes.
\`\`\`

### Lisibilité mobile (priorité absolue)
* Pas de tableaux (sauf cas exceptionnel).
* Pas de texte en capitales, jamais.

## STRUCTURE CONCISE D'UN ARTICLE

1. **Titre de l'article (H1)** : Accrocheur, informatif, optimisé SEO
2. **Description** : Une courte phrase de 20 mots maximum, en bloc de code
3. **Chapo introductif** : 2 paragraphes engageants (max)
4. **Corps** : 1000-2000 mots avec :
   - 2-4 sections H2 maximum
   - Exemples concrets ET pertinents
   - Métaphores appropriées au sujet
   - Pédagogie progressive mais concise
   - E-E-A-T visible dans la première section
5. **Encadrés** : [!TIP] et [!WARNING] uniquement si VRAIMENT nécessaires
6. **FAQ SEO** : 3-5 questions pertinentes en format numéroté
7. **Prompt image IA** : En bloc de code à la fin

## EXIGENCES SEO (CONCISES)

* Featured snippet dans premiers paragraphes (question + réponse courte)
* Mots-clés principaux dans titre, H2, et premiers 100 mots
* Paragraphes courts (2-4 phrases max)
* Expertise E-E-A-T visible rapidement
* FAQ optimisée pour recherche vocale`;

/**
 * Constantes pour les longueurs et tons
 */
const LENGTH_GUIDE = {
  short: '800-1000 mots',
  medium: '1000-1500 mots',
  long: '1500-2000 mots',
} as const;

const TONE_GUIDE = {
  professional: 'Adopte un ton professionnel et scientifique, tout en restant accessible.',
  empathetic:
    "Adopte un ton empathique et bienveillant, comme un thérapeute qui s'adresse à ses patients.",
  educational: 'Adopte un ton pédagogique et didactique, pour expliquer clairement les concepts.',
} as const;

const SPECIFIC_TONE_GUIDE: Record<string, string> = {
  informatif:
    'Présente les faits et informations avec clarté et objectivité, priorité à la transmission de connaissances utiles.',
  pédagogique:
    'Approche pédagogique progressive, guidant pas à pas vers la compréhension avec exemples et explications progressives.',
  inspirant:
    'Motivant et porteur, incitant le lecteur à croire en ses capacités de transformation et de croissance personnelle.',
  narratif:
    'Raconte des histoires engageantes, utilisant des anecdotes et récits pour illustrer les concepts.',
  conversationnel:
    'Adopte un ton amical et accessible, comme une conversation entre amis, décontracté mais informatif.',
  professionnel:
    'Formel et expert, adoptant un registre soutenu avec vocabulaire spécialisé et structure rigoureuse.',
  provocateur:
    'Défi les conventions établies, provoque la réflexion critique en soulevant des questions inconfortables.',
  humoristique:
    "Léger et amusant, utilise l'humour, l'ironie et la dérision pour rendre le sujet plus engageant.",
  poétique:
    "Approche poétique et métaphorique, utilisant la beauté du langage, les images et les symboles pour toucher l'âme.",
  introspectif:
    "Approche introspective et contemplative, invitant à l'exploration intérieure profonde et à l'auto-réflexion.",
  engagé:
    "Prend position, appelle à l'action ou au changement avec passion et conviction sur des enjeux importants.",
  scientifique:
    'Base sur les données et recherches, cite études et faits vérifiables, ton neutre et basé sur les preuves.',
  pragmatique:
    "Focalisé sur l'utilité pratique et les résultats concrets, conseils actionnables et solutions directes.",
  analytique:
    'Approche analytique et structurée, décortiquant les mécanismes avec précision logique et décomposition systématique.',
} as const;

/**
 * Extrait les FAQs du contenu généré au format Markdown
 * Supporte les formats:
 * - **1. Question?**
 * - **Question?**
 */
function extractFAQsFromContent(content: string): Array<{ question: string; answer: string }> {
  const faqList: Array<{ question: string; answer: string }> = [];

  // Chercher la section FAQ
  const faqSectionMatch = content.match(
    /##\s+(?:FAQ|Questions?\s+fr[eé]quentes|FAQ\s*[:)].*?)\s*\n([\s\S]*?)(?=##|---|\n\n```|$)/i
  );

  if (!faqSectionMatch) {
    return [];
  }

  const faqSection = faqSectionMatch[1] ?? '';
  const lines = faqSection.split('\n');

  let currentQuestion = '';
  let currentAnswer = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';

    // Détecte une question au format **1. Question?** ou **Question?**
    const questionMatch = line.match(/^\s*\*\*\d*\.?\s*([^*]+\?)\*\*\s*$/);

    if (questionMatch) {
      // Sauvegarder la question/réponse précédente si elle existe
      if (currentQuestion && currentAnswer.trim()) {
        faqList.push({
          question: currentQuestion.trim(),
          answer: currentAnswer.trim(),
        });
      }
      currentQuestion = (questionMatch[1] ?? '').replace(/^\d+\.\s*/, '').trim();
      currentAnswer = '';
    } else if (currentQuestion && line.trim() && !line.match(/^---/) && !line.match(/^##/)) {
      // Ajouter à la réponse courante si on a une question active
      currentAnswer += (currentAnswer ? '\n' : '') + line.trim();
    }
  }

  // Sauvegarder la dernière question/réponse
  if (currentQuestion && currentAnswer.trim()) {
    faqList.push({
      question: currentQuestion.trim(),
      answer: currentAnswer.trim(),
    });
  }

  return faqList;
}

/**
 * Retire la section FAQ du contenu
 */
function removeFAQSection(content: string): string {
  return content
    .replace(
      /##\s+(?:FAQ|Questions?\s+fr[eé]quentes|FAQ\s*[:)].*?)\s*\n[\s\S]*?(?=##|---|\n\n```|$)/i,
      ''
    )
    .trim();
}

/**
 * Génère un article de blog complet avec Claude
 *
 * @param options - Options de génération de l'article
 * @param apiKey - Clé API Anthropic
 * @returns L'article généré avec métadonnées
 */
export async function generateArticleWithClaude(
  options: ArticleGenerationOptions,
  apiKey: string
): Promise<GeneratedArticle> {
  try {
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Utiliser le style PSYPNOS par défaut (sauf désactivation explicite)
    const usePsypnosStyle = options.usePsypnosStyle !== false;

    // Construire le prompt selon les options
    const targetLength = options.targetLength || 'medium';
    const tone = options.tone || 'empathetic';
    const specificTone = options.specificTone;

    // Construire le contexte éditorial (Process H)
    let editorialContext = '';
    let tonInstructions = '';

    if (usePsypnosStyle) {
      // Formater les tons préférés et créer les instructions
      if (options.preferredTones && options.preferredTones.length > 0) {
        // Créer un contexte riche pour les tons multiples
        const tonesList = options.preferredTones
          .map(t => `- **${t}** : ${SPECIFIC_TONE_GUIDE[t] || t}`)
          .join('\n');

        editorialContext = `
## CONTEXTE ÉDITORIAL

${options.seoQuery ? `**Requête SEO principale** : ${options.seoQuery}` : ''}
${options.searchIntent ? `**Intention de recherche** : ${options.searchIntent}` : ''}
${options.editorialCategory ? `**Catégorie éditoriale** : ${options.editorialCategory}` : ''}
${options.readerPersona ? `**Persona lecteur** : ${options.readerPersona}` : ''}

**Tons préférés à intégrer dans cet article** :
${tonesList}
`;

        // Créer des instructions spéciales pour combiner les tons
        tonInstructions = `
## APPROCHE DES TONS

L'article doit intégrer UNE COMBINAISON HARMONIEUSE des tons préférés ci-dessus:
${options.preferredTones
  .map(
    tone => `
### ${tone.charAt(0).toUpperCase() + tone.slice(1)}
${SPECIFIC_TONE_GUIDE[tone] || tone}
`
  )
  .join('')}

**Conseil pour harmoniser les tons** :
- Utilise les tons comme différentes couches ou perspectives sur le même sujet
- Alterne entre les approches pour maintenir l'intérêt du lecteur
- Assure-toi que chaque ton renforce les autres et crée une expérience cohérente
- Le ton principal devrait être équilibré avec les autres sans les écraser
`;
      } else if (specificTone) {
        editorialContext = `
## CONTEXTE ÉDITORIAL

${options.seoQuery ? `**Requête SEO principale** : ${options.seoQuery}` : ''}
${options.searchIntent ? `**Intention de recherche** : ${options.searchIntent}` : ''}
${options.editorialCategory ? `**Catégorie éditoriale** : ${options.editorialCategory}` : ''}
${options.readerPersona ? `**Persona lecteur** : ${options.readerPersona}` : ''}
**Ton spécifique souhaité** : ${SPECIFIC_TONE_GUIDE[specificTone] || specificTone}
`;
      } else {
        editorialContext = `
## CONTEXTE ÉDITORIAL

${options.seoQuery ? `**Requête SEO principale** : ${options.seoQuery}` : ''}
${options.searchIntent ? `**Intention de recherche** : ${options.searchIntent}` : ''}
${options.editorialCategory ? `**Catégorie éditoriale** : ${options.editorialCategory}` : ''}
${options.readerPersona ? `**Persona lecteur** : ${options.readerPersona}` : ''}
`;
      }
    }

    // Construire le prompt utilisateur
    const prompt = usePsypnosStyle
      ? `${PSYPNOS_TECHNICAL_INSTRUCTIONS}

${editorialContext}

${tonInstructions}

## SUJET DE L'ARTICLE

**Sujet** : ${options.topic}
**Catégorie** : ${options.category}
${options.tags && options.tags.length > 0 ? `**Tags suggérés** : ${options.tags.join(', ')}` : ''}
**Longueur cible du corps** : ${LENGTH_GUIDE[targetLength]} (sans les FAQs - FAQ optionnelle séparée)
${!options.preferredTones || options.preferredTones.length === 0 ? `**Ton général** : ${TONE_GUIDE[tone]}` : ''}

---

**CRITÈRES IMPORTANTS** :
1. Style PSYPNOS + Markdown strict (défini dans ton système)
2. Listes régulières, **gras** pour concepts-clés, *italique* pour introspection
3. Conclusion avec CTA subtil
4. **TITRE PRINCIPAL** : Pas de majuscule inutile (sauf noms propres et débuts de phrase). Exemples : "Comprendre l'hypnose ericksonienne", "Comment gérer l'anxiété", "Les bénéfices de la méditation"
5. **TITRES H2/H3** : Même règle - pas de majuscule inutile sauf noms propres
6. **IMPORTANT** : La longueur cible (${LENGTH_GUIDE[targetLength]}) doit correspondre au CORPS DE L'ARTICLE UNIQUEMENT, SANS les FAQs
7. FAQ 3-5 questions optimisées SEO (comptées séparément de la longueur cible)
8. **TAGS** : Générer 3-10 tags pertinents et optimisés SEO pour cet article (au minimum 3, au maximum 10)

**RÉPONSE EN FORMAT XML** (OBLIGATOIRE) :
<TITLE>Titre SEO accrocheur</TITLE>
<DESCRIPTION>20 mots max pour SEO</DESCRIPTION>
<CATEGORY>Comprendre|Traverser|Découvrir|Cheminer</CATEGORY>
<CONTENT>Article complet avec sections H2/H3, paragraphes, listes, citations (pas de FAQ ici, elle va dans <FAQ>)</CONTENT>
<TAGS>3-10 tags optimisés SEO séparés par des virgules (ex: tag1, tag2, tag3, ...)</TAGS>
<FAQ>JSON: [{"question":"Q1?","answer":"A1"},{"question":"Q2?","answer":"A2"}] ou laisser vide si pas de FAQ</FAQ>
<IMAGE_PROMPT>Prompt image 1920×640px transpersonnel - style graphique conceptuel avec symbolique abstraite, cohérent avec l'identité visuelle Psypnos. Voir directives détaillées ci-dessous.</IMAGE_PROMPT>

---

## DIRECTIVES SPÉCIALES POUR <IMAGE_PROMPT>

Tu dois générer un prompt image qui respecte STRICTEMENT ces principes de l'identité visuelle Psypnos v2.0 :

### 🔴 4 ÉLÉMENTS OBLIGATOIRES (NON NÉGOCIABLE)

**CHAQUE prompt image DOIT inclure ces 4 éléments - aucune exception :**

1. ✅ **SILHOUETTE(S) MINIMALISTE(S)** (1-3 silhouettes)
   - Formes épurées et stylisées, NON réalistes
   - Illuminées d'une aura/halo doré
   - Postures contemplatives (assises, profil, méditation)
   - Intégrées organiquement à la composition abstraite

2. ✅ **LUMIÈRE DORÉE RAYONNANTE** (ÉLÉMENT CRUCIAL)
   - Halos de lumière dorée autour des silhouettes
   - Rayonnement centripète ou enveloppant
   - Lumière intérieure, chaleureuse, apaisante
   - DOIT être EXPLICITEMENT NOMMÉE dans le prompt

3. ✅ **PALETTE PSYPNOS OFFICIELLE** (codes hex OBLIGATOIRES)
   - **Or Psypnos** (#c7a962) : Couleur primaire dominante
   - **Bleu nuit** (#0e1f2f) : Base/fond principal
   - **Ivoire** (#f5f1e6) : Lumières douces et respiration
   - Accents selon contexte : pourpre (#9b7eaa), sauge (#7b9d8f), or clair (#f0d9a3)

4. ✅ **ATMOSPHÈRE CHALEUREUSE + PROFONDEUR EN COUCHES**
   - Voile translucide doux, qualité ACCUEILLANTE et RASSURANTE
   - Profondeur en couches : plan net → midground → arrière-plan estompé
   - Ambiance contemplative mais CHALEUREUSE, jamais froide ou distante
   - Message d'espoir implicite ("L'apaisement est possible")

### Structure du Prompt Image

Image 1920×640px (ratio 3:1), style [aquarelle numérique/illustration abstraite/art graphique contemplatif].

Composition : [Description avec silhouette(s) + formes + mouvement vers lumière/transformation]

Silhouette : [Description minimaliste illuminée - aura dorée (#c7a962), posture, intégration]

Lumière : [EXPLICITEMENT nommer la lumière dorée rayonnante avec codes hex]

Palette : [Or Psypnos (#c7a962), bleu nuit (#0e1f2f), ivoire (#f5f1e6) + accents]

Atmosphère : [Chaleureuse/accueillante + profondeur en couches (avant/milieu/arrière-plan)]

Message : L'image transmet : "[Message d'espoir adapté au sujet]"

Directive : Silhouettes minimalistes OK. Pas d'humains réalistes, visages détaillés, texte ou logo. Qualité haute.

### Exemples de BON Style d'Image (v2.0)
✅ "Silhouette minimaliste dont les lignes agitées s'apaisent en spirales douces. Illuminée d'un halo doré (#c7a962). Fond bleu nuit (#0e1f2f). Atmosphère chaleureuse. L'image transmet : L'apaisement est possible."
✅ "Silhouette translucide révélant un cœur lumineux or (#c7a962). Couches se dissolvant en particules dorées. Palette pourpre (#9b7eaa), ivoire (#f5f1e6). L'image transmet : Votre vraie nature est précieuse."
✅ "Deux silhouettes reliées par un pont de lumière dorée (#c7a962, #f0d9a3). Fond bleu nuit (#0e1f2f) profond. Atmosphère accueillante et enveloppante. L'image transmet : Les liens guérissent."

### Exemples de MAUVAIS Style d'Image
❌ "Une femme en consultation avec un thérapeute dans un cabinet chaud avec des fauteuils"
❌ "Des gens qui méditent, assis en cercle, ambiance cosy"
❌ "Femme à la fenêtre regardant le coucher de soleil"
❌ "Bougie allumée dans un salon zen"
❌ Prompts sans silhouettes minimalistes illuminées
❌ Prompts sans lumière dorée explicitement mentionnée
❌ Prompts sans les codes hex de la palette Psypnos

---

Génère maintenant l'article.`
      : // Mode simple (legacy) si PSYPNOS désactivé
        `Tu es un rédacteur spécialisé en psychothérapie, hypnose et thérapies alternatives pour le blog Psypnos.

SUJET : ${options.topic}
CATÉGORIE : ${options.category}
${options.tags && options.tags.length > 0 ? `TAGS : ${options.tags.join(', ')}` : ''}
LONGUEUR CIBLE DU CORPS : ${LENGTH_GUIDE[targetLength]} (sans les FAQs - FAQ optionnelle séparée)
TON : ${TONE_GUIDE[tone]}

CONSIGNES :
1. Génère un article de blog complet et structuré
2. Assure-toi que le contenu soit précis, bienveillant et fondé sur des bases scientifiques
3. Utilise un langage accessible au grand public
4. Structure l'article avec des titres et sous-titres clairs (utilise Markdown)
5. Évite les promesses irréalistes ou les affirmations non prouvées
6. Reste sensible aux enjeux de santé mentale
7. **IMPORTANT** : La longueur cible (${LENGTH_GUIDE[targetLength]}) doit correspondre au CORPS DE L'ARTICLE UNIQUEMENT, SANS les FAQs
8. **TITRES** : Pas de majuscule inutile dans le titre principal ni les H2/H3 (sauf noms propres et débuts de phrase). Exemples : "Comprendre l'hypnose ericksonienne", "Comment gérer l'anxiété", "Les bénéfices de la méditation"

FORMAT DE RÉPONSE (utilise exactement ces balises) :
<TITLE>
[Titre accrocheur et informatif de l'article]
</TITLE>

<DESCRIPTION>
[Description courte de 150-200 caractères pour le SEO]
</DESCRIPTION>

<CONTENT>
[Contenu complet de l'article en Markdown, avec titres ## et ###, paragraphes bien structurés, listes si pertinent]
</CONTENT>

<TAGS>
[3-10 tags pertinents et optimisés SEO, séparés par des virgules]
</TAGS>

Génère maintenant l'article complet.`;

    // Adapter max_tokens selon la longueur cible
    // ~1 token ≈ 4 caractères. Un mot ≈ 1.3 tokens en français.
    // Articles long = 1500-2000 mots (~2000-2600 tokens) + metadata + TAGS + FAQ + IMAGE_PROMPT
    // Total estimé: contenu + ~2000 tokens pour balises XML, metadata, FAQ JSON et IMAGE_PROMPT détaillé
    // IMPORTANT: Valeurs augmentées pour éviter la troncation récurrente
    const maxTokensByLength = {
      short: 6000, // 800-1000 mots + metadata complet + FAQ + IMAGE_PROMPT
      medium: 10000, // 1000-1500 mots + metadata complet + FAQ détaillée + IMAGE_PROMPT
      long: 16000, // 1500-2000 mots + TAGS + FAQ complète + IMAGE_PROMPT détaillé
    };

    // Appel API avec retry et timeout
    const message = await withRetryAndTimeout(
      () =>
        anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: maxTokensByLength[targetLength],
          temperature: 0.7,
          // ✨ Utiliser le system prompt PSYPNOS si activé
          ...(usePsypnosStyle && { system: PSYPNOS_STYLE_SYSTEM_PROMPT }),
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

    // Extraire le contenu de la réponse
    const firstBlock = message.content[0];
    const responseContent = firstBlock?.type === 'text' ? firstBlock.text : '';

    if (!responseContent) {
      throw new Error('Aucun contenu dans la réponse de Claude');
    }

    // Vérifier si la réponse a été tronquée (toutes les balises XML requises)
    const requiredTags = usePsypnosStyle
      ? ['TITLE', 'DESCRIPTION', 'CONTENT', 'TAGS', 'FAQ', 'IMAGE_PROMPT']
      : ['TITLE', 'DESCRIPTION', 'CONTENT', 'TAGS'];

    const xmlValidation = validateXmlCompletion(responseContent, requiredTags);

    if (!xmlValidation.isComplete) {
      const issues: string[] = [];
      if (xmlValidation.missingTags.length > 0) {
        issues.push(`Balises manquantes: ${xmlValidation.missingTags.join(', ')}`);
      }
      if (xmlValidation.truncatedTags.length > 0) {
        issues.push(`Balises tronquées: ${xmlValidation.truncatedTags.join(', ')}`);
      }

      console.warn(
        `⚠️ ATTENTION: La réponse est incomplète! max_tokens=${maxTokensByLength[targetLength]}. ${issues.join('. ')}`
      );
      console.warn('Derniers 500 caractères:', responseContent.slice(-500));

      // Si seules les balises non-critiques sont manquantes/tronquées, on continue
      const criticalTags = ['TITLE', 'CONTENT'];
      const hasCriticalIssue = criticalTags.some(
        tag => xmlValidation.missingTags.includes(tag) || xmlValidation.truncatedTags.includes(tag)
      );

      if (hasCriticalIssue) {
        throw new Error(
          `Génération tronquée: ${issues.join('. ')}. Augmentez max_tokens pour "${targetLength}".`
        );
      }
      // Log l'avertissement mais continue pour les balises non-critiques
      console.warn('⚠️ Balises non-critiques incomplètes, continuation avec données partielles...');
    }

    // Parser la réponse structurée
    const titleMatch = responseContent.match(/<TITLE>([\s\S]*?)<\/TITLE>/);
    const descriptionMatch = responseContent.match(/<DESCRIPTION>([\s\S]*?)<\/DESCRIPTION>/);
    const categoryMatch = responseContent.match(/<CATEGORY>([\s\S]*?)<\/CATEGORY>/);
    const contentMatch = responseContent.match(/<CONTENT>([\s\S]*?)<\/CONTENT>/);
    const tagsMatch = responseContent.match(/<TAGS>([\s\S]*?)<\/TAGS>/);
    const faqMatch = responseContent.match(/<FAQ>([\s\S]*?)<\/FAQ>/);
    const imagePromptMatch = responseContent.match(/<IMAGE_PROMPT>([\s\S]*?)<\/IMAGE_PROMPT>/);

    // FALLBACK ROBUSTE: Si pas de balises XML complètes, on ne fallback PAS
    // Car cela signifie que la génération a échoué (réponse tronquée, format invalide, etc)
    if (!titleMatch || !contentMatch) {
      console.error('❌ Format XML invalide - balises manquantes');
      console.error('Titre trouvé:', !!titleMatch);
      console.error('Contenu trouvé:', !!contentMatch);
      console.error('Premiers 500 caractères:', responseContent.slice(0, 500));

      return {
        success: false,
        error: 'La génération AI a échoué: format XML invalide ou incomplète. Réessayez.',
      };
    }

    // Parser les tags
    const tags = tagsMatch?.[1]
      ? tagsMatch[1]
          .split(',')
          .map((t: string) => t.trim())
          .filter((t: string) => t.length > 0)
      : options.tags || [];

    // Parser la catégorie
    const category = categoryMatch?.[1] ? categoryMatch[1].trim() : options.category;

    // Parser la FAQ avec l'utilitaire robuste
    let faq: Array<{ question: string; answer: string }> = [];
    if (faqMatch) {
      try {
        const faqText = (faqMatch[1] ?? '').trim();

        // Utiliser le parsing robuste qui gère les cas edge (JSON tronqué, texte autour, etc.)
        const parsed = parseJsonFromText<Array<{ question: string; answer: string }>>(
          faqText,
          [] // Fallback vers tableau vide en cas d'échec
        );

        // Valider que c'est bien un tableau d'objets avec question/answer
        if (Array.isArray(parsed) && parsed.every(item => item.question && item.answer)) {
          faq = parsed;
        } else if (Array.isArray(parsed) && parsed.length > 0) {
          // Essayer de récupérer les éléments valides uniquement
          faq = parsed.filter(item => item && item.question && item.answer);
          if (faq.length > 0) {
            console.warn(
              `FAQ partiellement valide: ${faq.length}/${parsed.length} éléments récupérés`
            );
          }
        }
      } catch (error) {
        console.warn('Erreur lors du parsing de la FAQ JSON (non-bloquant):', error);
        // FAQ optionnelle, on continue sans
      }
    }

    // Extraire les FAQs du contenu généré (même si pas en balise XML)
    const fullContent = (contentMatch?.[1] ?? '').trim();
    const extractedFAQs = extractFAQsFromContent(fullContent);

    // Utiliser les FAQs extraites du contenu si les FAQs XML ne sont pas présentes
    const finalFaq = faq.length > 0 ? faq : extractedFAQs.length > 0 ? extractedFAQs : undefined;

    // Retirer la section FAQ du contenu si elle y est présente
    const contentWithoutFAQ = removeFAQSection(fullContent);

    // Traitement de l'IMAGE_PROMPT avec enrichissement et validation
    let finalImagePrompt: string | undefined = undefined;
    if (imagePromptMatch) {
      const rawImagePrompt = (imagePromptMatch[1] ?? '').trim();

      // Enrichir avec les données thématiques et la catégorie
      const enrichedPrompt = enrichImagePromptWithThematics(
        rawImagePrompt,
        options.topic,
        category
      );

      // Valider que le prompt contient les 4 éléments obligatoires
      const validation = validatePromptForMandatoryElements(enrichedPrompt);

      if (!validation.isValid) {
        console.warn(
          `⚠️ IMAGE_PROMPT généré manque des éléments obligatoires: ${validation.missingElements.join(', ')}`
        );
        console.warn('Suggestions de correction:', validation.suggestedCorrections);
      }

      finalImagePrompt = enrichedPrompt;
    }

    // Ajouter le titre H1 au début du contenu
    const titleText = (titleMatch?.[1] ?? '').trim();
    const contentWithTitle = `# ${titleText}\n\n${contentWithoutFAQ}`;

    return {
      success: true,
      title: titleText,
      description: descriptionMatch
        ? (descriptionMatch[1] ?? '').trim()
        : contentWithoutFAQ.slice(0, 200).trim() + '...',
      category: category,
      content: contentWithTitle,
      tags,
      faq: finalFaq,
      imagePrompt: finalImagePrompt,
    };
  } catch (error) {
    console.error('Erreur lors de la génération avec Claude:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Améliore ou réécrit un article existant avec Claude
 *
 * @param existingContent - Contenu existant de l'article
 * @param improvementPrompt - Instructions spécifiques pour l'amélioration
 * @param apiKey - Clé API Anthropic
 * @param usePsypnosStyle - Utiliser le style PSYPNOS complet (default: true)
 * @returns L'article amélioré
 */
export async function improveArticleWithClaude(
  existingContent: string,
  improvementPrompt: string,
  apiKey: string,
  usePsypnosStyle = true
): Promise<GeneratedArticle> {
  try {
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const prompt = usePsypnosStyle
      ? `${PSYPNOS_TECHNICAL_INSTRUCTIONS}

## CONTENU ACTUEL DE L'ARTICLE

${existingContent}

---

## INSTRUCTIONS D'AMÉLIORATION

${improvementPrompt}

---

Améliore l'article en suivant ces instructions, en respectant scrupuleusement :
1. Le style d'écriture PSYPNOS (défini dans ton système)
2. Les recommandations Markdown strictes ci-dessus
3. La structure obligatoire d'un article
4. Les exigences SEO

Conserve le même format Markdown et assure-toi que le contenu reste précis, bienveillant et fondé sur des bases scientifiques.

**Retourne uniquement le contenu amélioré en Markdown**, sans balises XML additionnelles.`
      : `Tu es un éditeur spécialisé en psychothérapie pour le blog Psypnos.

CONTENU ACTUEL DE L'ARTICLE :
${existingContent}

INSTRUCTIONS D'AMÉLIORATION :
${improvementPrompt}

Améliore l'article en suivant ces instructions. Conserve le même format Markdown et assure-toi que le contenu reste précis, bienveillant et fondé sur des bases scientifiques.

Retourne uniquement le contenu amélioré en Markdown, sans balises additionnelles.`;

    // Appel API avec retry et timeout
    const message = await withRetryAndTimeout(
      () =>
        anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 6000, // Même limite que la génération
          temperature: 0.7,
          // ✨ Utiliser le system prompt PSYPNOS si activé
          ...(usePsypnosStyle && { system: PSYPNOS_STYLE_SYSTEM_PROMPT }),
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

    const improvedBlock = message.content[0];
    const improvedContent = improvedBlock?.type === 'text' ? improvedBlock.text : '';

    if (!improvedContent) {
      throw new Error('Aucun contenu dans la réponse de Claude');
    }

    return {
      success: true,
      content: improvedContent.trim(),
    };
  } catch (error) {
    console.error("Erreur lors de l'amélioration avec Claude:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
