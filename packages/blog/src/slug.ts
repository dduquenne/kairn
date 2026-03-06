/**
 * Slug Generation Utilities
 *
 * Generates SEO-friendly slugs from titles and categories.
 * Handles French stop words, accents, and special characters.
 */

/**
 * Nettoyage standardisé d'un string en slug.
 * Minuscules, sans accents, espaces remplacés par tirets.
 *
 * @param str - Chaîne à convertir en slug
 * @returns Slug nettoyé
 */
export function cleanStringToSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
    .replace(/[\u0027\u0060\u00B4\u2018\u2019\u201C\u201D\u275B\u275C]/g, ' ') // Remplacer les variantes d'apostrophes
    .replace(/[^a-z0-9\s-]/g, '') // Retirer les caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
    .replace(/-+/g, '-') // Remplacer les tirets multiples par un seul
    .replace(/^-|-$/g, ''); // Retirer les tirets au début et à la fin
}

/**
 * Extrait les termes SEO clés du titre.
 * Supprime les stop words français courants.
 *
 * @param title - Titre de l'article
 * @param additionalStopWords - Mots supplémentaires à filtrer (ex. noms de catégories)
 * @returns Liste des termes SEO extraits
 */
export function extractSeoTermsFromTitle(
  title: string,
  additionalStopWords: string[] = []
): string[] {
  const stopWords = new Set([
    'le',
    'la',
    'les',
    'l',
    'un',
    'une',
    'des',
    'du',
    'de',
    'd',
    'et',
    'ou',
    'mais',
    'donc',
    'car',
    'pour',
    'par',
    'avec',
    'sans',
    'sous',
    'dans',
    'sur',
    'à',
    'au',
    'aux',
    'entre',
    'vers',
    'pendant',
    'est',
    'son',
    'sa',
    'ses',
    'mon',
    'ma',
    'mes',
    'ton',
    'ta',
    'tes',
    'notre',
    'votre',
    'leur',
    'leurs',
    'que',
    'qui',
    'quoi',
    'où',
    'comment',
    'pourquoi',
    'quand',
    'quel',
    'quelle',
    'ce',
    'cet',
    'cette',
    'ces',
    'ceux',
    'celle',
    'celui',
    'se',
    's',
    'il',
    'elle',
    'nous',
    'vous',
    'je',
    'tu',
    'moi',
    'toi',
    'lui',
    'eux',
    'leur',
    'très',
    'plus',
    'moins',
    'assez',
    'trop',
    'si',
    'pas',
    'ne',
    'ni',
    'soit',
    'ait',
    'soit',
    'faire',
    'pouvoir',
    'vouloir',
    'devoir',
    'aller',
    'venir',
    'savoir',
    'avoir',
    'être',
    'mieux',
    'meilleur',
    'meme',
    'aussi',
    'ainsi',
    ...additionalStopWords.map(w =>
      w
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    ),
  ]);

  const words = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0027\u0060\u00B4\u2018\u2019\u201C\u201D\u275B\u275C]/g, ' ')
    .split(/[\s\-/.,;:?!()]+/)
    .filter(word => word.length > 0 && !stopWords.has(word));

  return words;
}

/**
 * Génère un slug SEO-friendly à partir du titre et de la catégorie.
 *
 * Le slug est composé de :
 * 1. Catégorie (abrégée via la map fournie)
 * 2. Termes SEO clés du titre (3 mots max)
 *
 * Garantit toujours un slug valide, même en cas de problème.
 *
 * @param title - Titre de l'article
 * @param category - Catégorie de l'article
 * @param categorySlugMap - Map catégorie → slug (ex. { "Comprendre": "comprendre" })
 * @returns Slug valide garanti
 */
export function generateSlugFromTitleAndCategory(
  title: string,
  category: string,
  categorySlugMap: Record<string, string> = {}
): string {
  // Récupérer l'abréviation de la catégorie
  const categorySlug = categorySlugMap[category] || cleanStringToSlug(category);

  // Si catégorie invalide ET titre vide/nul → utiliser timestamp comme fallback
  if (!categorySlug || !categorySlug.trim()) {
    if (!title || !title.trim()) {
      return `article-${Date.now()}`;
    }
    const titleSlug = cleanStringToSlug(title);
    return titleSlug || `article-${Date.now()}`;
  }

  // Si pas de titre, retourner la catégorie (valide)
  if (!title || !title.trim()) {
    return categorySlug;
  }

  // Extraire les termes SEO du titre, en filtrant les noms de catégories
  const categoryNames = Object.keys(categorySlugMap).map(k =>
    k
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  );
  const seoTerms = extractSeoTermsFromTitle(title, categoryNames);

  // Limiter à 3 termes pour un slug concis mais descriptif
  const selectedTerms = seoTerms.slice(0, 3);

  // Si aucun terme valide trouvé, utiliser le titre entier
  if (selectedTerms.length === 0) {
    const titleSlug = cleanStringToSlug(title);

    if (titleSlug) {
      return `${categorySlug}-${titleSlug}`;
    }

    return categorySlug;
  }

  // Combiner catégorie + termes SEO
  const slug = `${categorySlug}-${selectedTerms.join('-')}`;

  return slug.trim() || categorySlug;
}

/**
 * Génère un slug à partir du titre seul (sans catégorie).
 * Fallback si la génération avec catégorie échoue.
 *
 * Garantit toujours un slug valide.
 *
 * @param title - Titre de l'article
 * @returns Slug valide garanti
 */
export function generateSlugFromTitle(title: string): string {
  if (!title || !title.trim()) {
    return `article-${Date.now()}`;
  }

  const slug = cleanStringToSlug(title);

  return slug || `article-${Date.now()}`;
}

/**
 * Valide un slug.
 *
 * @param slug - Slug à valider
 * @returns Objet avec valid (boolean) et error optionnel
 */
export function validateSlug(slug: string): {
  valid: boolean;
  error?: string;
} {
  if (!slug || !slug.trim()) {
    return { valid: false, error: 'Le slug ne peut pas être vide' };
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return {
      valid: false,
      error:
        "Le slug doit contenir uniquement des lettres minuscules, des chiffres et des traits d'union",
    };
  }

  if (slug.length > 200) {
    return {
      valid: false,
      error: 'Le slug ne doit pas dépasser 200 caractères',
    };
  }

  return { valid: true };
}
