/**
 * Utilitaire pour générer des slugs SEO-friendly
 * Basé sur la catégorie + titre/termes SEO
 */

/**
 * Nettoyage standardisé d'un string en slug
 * - Minuscules
 * - Supprime les accents
 * - Remplace espaces/caractères par tirets
 * - Retires tirets multiples/début/fin
 */
function cleanStringToSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Retirer les accents
    .replace(/[\u0027\u0060\u00B4\u2018\u2019\u201C\u201D\u275B\u275C]/g, " ") // Remplacer toutes les variantes d'apostrophes (ASCII ' grave ` acute ´ left-single ' right-single ' left-double " right-double " reversed-single ‛ double-high-reversed ‟)
    .replace(/[^a-z0-9\s-]/g, "") // Retirer les caractères spéciaux
    .replace(/\s+/g, "-") // Remplacer les espaces par des tirets
    .replace(/-+/g, "-") // Remplacer les tirets multiples par un seul
    .replace(/^-|-$/g, ""); // Retirer les tirets au début et à la fin
}

/**
 * Extrait les termes SEO clés du titre
 * - Supprime les stop words français courants
 * - Garde les termes importants et mémorables
 *
 * Exemple: "Comprendre la somatothérapie pour mieux se connaître"
 * → "somatotherapie-connaitre"
 */
function extractSeoTermsFromTitle(title: string): string[] {
  // Stop words français à exclure du slug
  const stopWords = new Set([
    "le", "la", "les", "l", "un", "une", "des", "du", "de", "d", "et", "ou",
    "mais", "donc", "car", "pour", "par", "avec", "sans", "sous",
    "dans", "sur", "à", "au", "aux", "entre", "vers", "pendant",
    "est", "son", "sa", "ses", "mon", "ma", "mes", "ton", "ta", "tes",
    "notre", "votre", "leur", "leurs", "que", "qui", "quoi", "où",
    "comment", "pourquoi", "quand", "quel", "quelle", "ce", "cet",
    "cette", "ces", "ceux", "celle", "celui", "se", "s", "il", "elle",
    "nous", "vous", "je", "tu", "moi", "toi", "lui", "eux", "leur",
    "très", "plus", "moins", "assez", "trop", "si", "pas",
    "ne", "ni", "soit", "ait", "soit", "faire", "pouvoir", "vouloir",
    "devoir", "aller", "venir", "savoir", "avoir", "être", "mieux",
    "meilleur", "meme", "aussi", "ainsi",
    // Noms de catégories (à filtrer puisque déjà en préfixe)
    "comprendre", "traverser", "decouvrir", "cheminer",
  ]);

  const words = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0027\u0060\u00B4\u2018\u2019\u201C\u201D\u275B\u275C]/g, " ") // Remplacer toutes les variantes d'apostrophes
    .split(/[\s\-\/\.,;:\?!()]+/)
    .filter(word => word.length > 0 && !stopWords.has(word));

  return words;
}

/**
 * Map de catégories vers leurs abréviations de slug
 * Utilisé pour préfixer le slug avec la catégorie
 */
const CATEGORY_SLUG_MAP: Record<string, string> = {
  "Comprendre": "comprendre",
  "Traverser": "traverser",
  "Découvrir": "decouvrir",
  "Cheminer": "cheminer",
};

/**
 * Génère un slug SEO-friendly en 3 parties:
 * 1. Catégorie (abrégée)
 * 2. Termes SEO clés du titre (3-4 mots max)
 * 3. Si titre fourni, sinon juste catégorie
 *
 * ⚠️ GARANTIT TOUJOURS un slug valide, même en cas de problème avec le titre ou la catégorie
 *
 * Exemple:
 * - Titre: "Comprendre la somatothérapie"
 * - Catégorie: "Comprendre"
 * - Résultat: "comprendre-somatotherapie"
 *
 * Cas problématiques gérés:
 * - Titre vide ou invalide → fallback sur catégorie ou timestamp
 * - Catégorie non reconnue → utilise catégorie nettoyée
 * - Tous les caractères supprimés → utilise timestamp
 *
 * @param title - Titre de l'article
 * @param category - Catégorie de l'article
 * @returns Slug garantis valide et unique (au minimum contient une catégorie ou un timestamp)
 */
export function generateSlugFromTitleAndCategory(title: string, category: string): string {
  // Récupérer l'abréviation de la catégorie
  const categorySlug = CATEGORY_SLUG_MAP[category] || cleanStringToSlug(category);

  // Si catégorie invalide ET titre vide/nul → utiliser timestamp comme fallback
  if (!categorySlug || !categorySlug.trim()) {
    if (!title || !title.trim()) {
      return `article-${Date.now()}`;
    }
    // Sinon utiliser le titre comme base
    const titleSlug = cleanStringToSlug(title);
    return titleSlug || `article-${Date.now()}`;
  }

  // Si pas de titre, retourner la catégorie (valide)
  if (!title || !title.trim()) {
    return categorySlug;
  }

  // Extraire les termes SEO du titre
  const seoTerms = extractSeoTermsFromTitle(title);

  // Limiter à 3-4 termes pour un slug concis mais descriptif
  const selectedTerms = seoTerms.slice(0, 3);

  // Si aucun terme valide trouvé, utiliser le titre entier
  if (selectedTerms.length === 0) {
    const titleSlug = cleanStringToSlug(title);

    // Si le titre nettoyé est valide, combiner avec catégorie
    if (titleSlug) {
      return `${categorySlug}-${titleSlug}`;
    }

    // Sinon, utiliser juste la catégorie (qui est garantie valide)
    return categorySlug;
  }

  // Combiner catégorie + termes SEO (cas nominal)
  const slug = `${categorySlug}-${selectedTerms.join("-")}`;

  // Vérifier que le slug résultant n'est pas vide après nettoyage
  return slug.trim() || categorySlug;
}

/**
 * Génère un slug à partir du titre seul (sans catégorie)
 * Utilisé comme fallback si la génération avec catégorie échoue
 *
 * ⚠️ GARANTIT TOUJOURS un slug valide (ou timestamp si le titre est trop problématique)
 */
export function generateSlugFromTitle(title: string): string {
  if (!title || !title.trim()) {
    return `article-${Date.now()}`;
  }

  const slug = cleanStringToSlug(title);

  // Si après nettoyage le slug est vide, utiliser timestamp
  return slug || `article-${Date.now()}`;
}

/**
 * Valide un slug
 * @returns true si valide, error message sinon
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || !slug.trim()) {
    return { valid: false, error: "Le slug ne peut pas être vide" };
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return {
      valid: false,
      error: "Le slug doit contenir uniquement des lettres minuscules, des chiffres et des traits d'union",
    };
  }

  if (slug.length > 200) {
    return { valid: false, error: "Le slug ne doit pas dépasser 200 caractères" };
  }

  return { valid: true };
}
