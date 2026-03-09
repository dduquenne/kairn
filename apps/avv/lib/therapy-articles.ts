/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Filtrage d'articles pour les pages de thérapie
 *
 * Ce module implémente un système de scoring par pertinence pour filtrer
 * les articles du blog en fonction de leur lien avec chaque type de thérapie.
 *
 * PRINCIPE DE ROBUSTESSE :
 * - Logging détaillé à chaque étape pour faciliter le diagnostic
 * - Fallback qui garantit TOUJOURS un affichage d'articles
 * - Normalisation robuste pour le matching français (accents, casse)
 */

import type { BlogPostSummary } from "./blog";

/**
 * Normalise un texte pour le matching :
 * - Convertit en minuscules
 * - Supprime les accents
 * - Supprime les caractères spéciaux
 */
function normalizeForMatching(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[-_']/g, " ") // Remplace tirets et apostrophes par espaces
    .trim();
}

/**
 * Mots-clés pour la sophrologie
 * Liste étendue pour maximiser les correspondances
 */
export const PSYCHOTHERAPY_KEYWORDS = [
  // Termes principaux
  "psychotherapie",
  "therapie",
  "therapeute",
  "psychologue",
  "psy",
  "accompagnement",
  "soin",
  "consultation",
  "seance",
  // États émotionnels et troubles
  "anxiete",
  "angoisse",
  "burnout",
  "burn-out",
  "burn out",
  "epuisement",
  "depression",
  "deprime",
  "stress",
  "trauma",
  "traumatisme",
  "deuil",
  "phobie",
  "panique",
  "toc",
  // Émotions et états intérieurs
  "emotion",
  "emotionnel",
  "emotionnelle",
  "crise",
  "souffrance",
  "mal-etre",
  "malaise",
  "detresse",
  "tristesse",
  "colere",
  "peur",
  "honte",
  "culpabilite",
  // Bien-être et santé mentale
  "bien-etre",
  "bienetre",
  "sante mentale",
  "psychologique",
  "mental",
  "interieur",
  "interieure",
  "equilibre",
  "serenite",
  "apaisement",
  "paix",
  // Développement personnel
  "connaissance de soi",
  "developpement personnel",
  "introspection",
  "travail sur soi",
  "cheminement",
  "guerison",
  "transformation",
  "changement",
  "croissance",
  "evolution",
  // Relations et vie
  "relation",
  "relationnel",
  "conflit",
  "separation",
  "rupture",
  "couple",
  "famille",
  "travail",
  "sens",
  "existentiel",
  "existentielle",
  "crise de vie",
  "difficulte",
  // Estime et confiance
  "estime de soi",
  "estime",
  "confiance en soi",
  "confiance",
  // Approches thérapeutiques
  "transpersonnel",
  "transpersonnelle",
  "humaniste",
  "integrative",
  // Mots généraux pertinents
  "aide",
  "soutien",
  "ecoute",
  "parole",
  "dialogue",
  "comprendre",
  "traverser",
  "guérir",
  "guerir",
] as const;

/**
 * Mots-clés pour la somatothérapie
 */
export const HYPNOSIS_KEYWORDS = [
  // Termes principaux somatothérapie
  "somatothérapie",
  "hypnotherapie",
  "hypnotique",
  "erickson",
  "ericksonien",
  "ericksonienne",
  "auto-somatothérapie",
  "autosomatothérapie",
  // États de conscience
  "inconscient",
  "subconscient",
  "transe",
  "etat modifie",
  "etats modifies",
  "conscience modifiee",
  "conscience",
  "conscience elargie",
  // Techniques
  "suggestion",
  "visualisation",
  "imagination",
  "metaphore",
  "relaxation",
  "meditation",
  "detente",
  "calme",
  // Ressources internes
  "ressources",
  "ressource",
  "potentiel",
  "capacites",
  // Changement et transformation
  "changement",
  "transformation",
  "liberation",
  "deblocage",
  "blocage",
  // Applications thérapeutiques
  "phobie",
  "anxiete",
  "angoisse",
  "stress",
  "sommeil",
  "insomnie",
  "confiance",
  "estime de soi",
  "estime",
  "tabac",
  "addiction",
  "dependance",
  "douleur",
  "gestion",
  // États émotionnels
  "emotion",
  "emotionnel",
  "peur",
  "colere",
  "apaisement",
  "serenite",
  // Thèmes connexes
  "therapie",
  "accompagnement",
  "guerison",
  "bien-etre",
  "mental",
] as const;

/**
 * Mots-clés pour la breathwork & rebirth
 */
export const HOLOTROPIC_BREATHING_KEYWORDS = [
  // Termes principaux respiration
  "respiration",
  "holotropique",
  "breathwork",
  "breath work",
  "souffle",
  "souffles",
  "respiratoire",
  // Fondateurs et méthode
  "grof",
  "stanislav",
  "christina",
  "transpersonnel",
  "transpersonnelle",
  // États de conscience
  "conscience",
  "conscience elargie",
  "etats modifies",
  "etat modifie",
  "etats de conscience",
  "expansion",
  "expansion de conscience",
  // Transformation
  "transformation",
  "transformateur",
  "transformatrice",
  "liberation",
  "guerison",
  "catharsis",
  // Corps et énergie
  "corps",
  "corporel",
  "corporelle",
  "energie",
  "energetique",
  "somatique",
  // Spiritualité
  "spirituel",
  "spirituelle",
  "spiritualite",
  "eveil",
  "sacre",
  "mystique",
  // Voyage intérieur
  "voyage interieur",
  "voyage",
  "exploration",
  "interieur",
  "interieure",
  "profondeur",
  // Émotions et processus
  "emotion",
  "emotionnel",
  "processus",
  "experience",
  "vecu",
  // Pratique
  "seminaire",
  "atelier",
  "retraite",
  "groupe",
  "session",
  "facilitateur",
  // Thèmes connexes
  "meditation",
  "relaxation",
  "bien-etre",
  "sante",
  "therapie",
  "accompagnement",
  "cheminement",
  "psychologie transpersonnelle",
] as const;

/**
 * Type pour les types de thérapie supportés
 */
export type TherapyType = "psychotherapy" | "hypnosis" | "holotropic";

/**
 * Mapping des mots-clés par type de thérapie
 */
const KEYWORDS_BY_THERAPY: Record<TherapyType, readonly string[]> = {
  psychotherapy: PSYCHOTHERAPY_KEYWORDS,
  hypnosis: HYPNOSIS_KEYWORDS,
  holotropic: HOLOTROPIC_BREATHING_KEYWORDS,
};

/**
 * Noms affichables pour le logging
 */
const THERAPY_NAMES: Record<TherapyType, string> = {
  psychotherapy: "sophrologie",
  hypnosis: "somatothérapie",
  holotropic: "breathwork & rebirth",
};

/**
 * Interface pour un article avec son score de pertinence
 */
export interface ScoredPost {
  post: BlogPostSummary;
  score: number;
  matchDetails: {
    tagMatches: string[];
    titleMatches: string[];
    descriptionMatches: string[];
  };
}

/**
 * Vérifie si un texte contient un mot-clé (matching flexible)
 */
function textContainsKeyword(
  normalizedText: string,
  normalizedKeyword: string
): boolean {
  // Match exact ou partiel
  return normalizedText.includes(normalizedKeyword);
}

/**
 * Calcule le score de pertinence d'un article pour un ensemble de mots-clés
 *
 * Pondération des scores :
 * - Tag exact match : 25 points
 * - Tag contient le mot-clé : 15 points
 * - Mot-clé contient le tag (reverse match) : 10 points
 * - Titre match : 20 points par mot-clé
 * - Description match : 10 points par mot-clé
 * - Catégorie pertinente : 5 points bonus
 */
function calculatePostScore(
  post: BlogPostSummary,
  keywords: readonly string[]
): ScoredPost {
  let score = 0;
  const matchDetails = {
    tagMatches: [] as string[],
    titleMatches: [] as string[],
    descriptionMatches: [] as string[],
  };

  const normalizedTitle = normalizeForMatching(post.title);
  const normalizedDescription = normalizeForMatching(post.description || "");
  const normalizedExcerpt = normalizeForMatching(post.excerpt || "");

  // Ensemble pour éviter les doublons dans le scoring
  const matchedKeywordsInTags = new Set<string>();
  const matchedKeywordsInTitle = new Set<string>();
  const matchedKeywordsInDesc = new Set<string>();

  // Score pour les tags (priorité la plus haute)
  if (post.tags && post.tags.length > 0) {
    for (const tag of post.tags) {
      const normalizedTag = normalizeForMatching(tag);

      for (const keyword of keywords) {
        const normalizedKeyword = normalizeForMatching(keyword);

        // Éviter les doublons pour le même mot-clé
        const matchKey = `${normalizedTag}:${normalizedKeyword}`;
        if (matchedKeywordsInTags.has(matchKey)) continue;

        // Match exact du tag
        if (normalizedTag === normalizedKeyword) {
          score += 25;
          matchDetails.tagMatches.push(`"${tag}" = "${keyword}" (exact, +25)`);
          matchedKeywordsInTags.add(matchKey);
        }
        // Tag contient le mot-clé
        else if (textContainsKeyword(normalizedTag, normalizedKeyword)) {
          score += 15;
          matchDetails.tagMatches.push(
            `"${tag}" contient "${keyword}" (+15)`
          );
          matchedKeywordsInTags.add(matchKey);
        }
        // Mot-clé contient le tag (pour les tags courts comme "stress", "peur")
        else if (
          normalizedTag.length >= 4 &&
          textContainsKeyword(normalizedKeyword, normalizedTag)
        ) {
          score += 10;
          matchDetails.tagMatches.push(
            `"${keyword}" contient "${tag}" (reverse, +10)`
          );
          matchedKeywordsInTags.add(matchKey);
        }
      }
    }
  }

  // Score pour le titre
  for (const keyword of keywords) {
    const normalizedKeyword = normalizeForMatching(keyword);
    if (
      !matchedKeywordsInTitle.has(normalizedKeyword) &&
      textContainsKeyword(normalizedTitle, normalizedKeyword)
    ) {
      score += 20;
      matchDetails.titleMatches.push(`"${keyword}" dans titre (+20)`);
      matchedKeywordsInTitle.add(normalizedKeyword);
    }
  }

  // Score pour la description et l'excerpt
  for (const keyword of keywords) {
    const normalizedKeyword = normalizeForMatching(keyword);
    if (matchedKeywordsInDesc.has(normalizedKeyword)) continue;

    if (textContainsKeyword(normalizedDescription, normalizedKeyword)) {
      score += 10;
      matchDetails.descriptionMatches.push(`"${keyword}" dans description (+10)`);
      matchedKeywordsInDesc.add(normalizedKeyword);
    } else if (
      normalizedExcerpt !== normalizedDescription &&
      textContainsKeyword(normalizedExcerpt, normalizedKeyword)
    ) {
      score += 5;
      matchDetails.descriptionMatches.push(`"${keyword}" dans excerpt (+5)`);
      matchedKeywordsInDesc.add(normalizedKeyword);
    }
  }

  // Bonus pour les catégories pertinentes
  const normalizedCategory = normalizeForMatching(post.category);
  const relevantCategories = ["comprendre", "traverser", "decouvrir", "cheminer"];
  if (relevantCategories.some((cat) => normalizedCategory.includes(cat))) {
    score += 5;
  }

  return {
    post,
    score,
    matchDetails,
  };
}

/**
 * Filtre les articles pertinents pour un type de thérapie donné
 * en utilisant un système de scoring par pertinence.
 *
 * GARANTIE : Retourne TOUJOURS des articles si la base en contient.
 * Si aucun article ne matche les mots-clés, retourne les plus récents.
 *
 * @param posts - Liste des articles à filtrer
 * @param therapyType - Type de thérapie pour le filtrage
 * @param limit - Nombre maximum d'articles à retourner (défaut: 50)
 * @param minScore - Score minimum pour qu'un article soit considéré pertinent (défaut: 5)
 * @returns Liste des articles filtrés et triés par pertinence
 */
export function filterPostsByTherapy(
  posts: BlogPostSummary[],
  therapyType: TherapyType,
  limit = 50,
  minScore = 5
): BlogPostSummary[] {
  const therapyName = THERAPY_NAMES[therapyType];

  // Log initial pour le diagnostic
  console.log(
    `[therapy-articles] Filtrage pour ${therapyName} - ${posts?.length || 0} articles en entrée`
  );

  // Vérification de sécurité
  if (!posts || posts.length === 0) {
    console.warn(
      `[therapy-articles] ATTENTION: Aucun article reçu pour le filtrage ${therapyName}`
    );
    return [];
  }

  const keywords = KEYWORDS_BY_THERAPY[therapyType];
  console.log(
    `[therapy-articles] Utilisation de ${keywords.length} mots-clés pour ${therapyName}`
  );

  // Calculer le score pour chaque article
  const scoredPosts: ScoredPost[] = posts.map((post) =>
    calculatePostScore(post, keywords)
  );

  // Trier par score décroissant
  const sortedByScore = [...scoredPosts].sort((a, b) => b.score - a.score);

  // Filtrer les articles avec un score suffisant
  const relevantPosts = sortedByScore
    .filter((sp) => sp.score >= minScore)
    .slice(0, limit)
    .map((sp) => sp.post);

  // Log des résultats pour diagnostic
  console.log(
    `[therapy-articles] ${relevantPosts.length} articles pertinents trouvés pour ${therapyName} (score >= ${minScore})`
  );

  // Log des top 5 scores pour diagnostic
  const top5 = sortedByScore.slice(0, 5);
  console.log(`[therapy-articles] Top 5 scores pour ${therapyName}:`);
  top5.forEach((sp, i) => {
    console.log(
      `  ${i + 1}. "${sp.post.title}" - Score: ${sp.score} - Tags: [${sp.post.tags?.join(", ") || "aucun"}]`
    );
  });

  // FALLBACK GARANTI : Si aucun article pertinent, retourner les plus récents
  if (relevantPosts.length === 0) {
    console.warn(
      `[therapy-articles] FALLBACK ACTIVÉ pour ${therapyName} - Retour des ${Math.min(limit, posts.length)} articles les plus récents`
    );

    // Log des articles qui n'ont pas matché pour diagnostic
    console.log(`[therapy-articles] Exemple d'articles non matchés:`);
    posts.slice(0, 3).forEach((p) => {
      console.log(
        `  - "${p.title}" - Tags: [${p.tags?.join(", ") || "aucun"}]`
      );
    });

    return posts.slice(0, limit);
  }

  return relevantPosts;
}

/**
 * Filtre les articles pour la page sophrologie
 */
export function filterPsychotherapyPosts(
  posts: BlogPostSummary[],
  limit = 50
): BlogPostSummary[] {
  return filterPostsByTherapy(posts, "psychotherapy", limit);
}

/**
 * Filtre les articles pour la page somatothérapie
 */
export function filterHypnosisPosts(
  posts: BlogPostSummary[],
  limit = 50
): BlogPostSummary[] {
  return filterPostsByTherapy(posts, "hypnosis", limit);
}

/**
 * Filtre les articles pour la page breathwork & rebirth
 */
export function filterHolotropicPosts(
  posts: BlogPostSummary[],
  limit = 50
): BlogPostSummary[] {
  return filterPostsByTherapy(posts, "holotropic", limit);
}

/**
 * Fonction utilitaire pour obtenir le détail des scores
 * Utile pour le debugging et l'analyse
 */
export function getDetailedScores(
  posts: BlogPostSummary[],
  therapyType: TherapyType
): ScoredPost[] {
  if (!posts || posts.length === 0) {
    return [];
  }

  const keywords = KEYWORDS_BY_THERAPY[therapyType];
  return posts
    .map((post) => calculatePostScore(post, keywords))
    .sort((a, b) => b.score - a.score);
}
