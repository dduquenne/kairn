/**
 * Utilitaires de normalisation et nettoyage des hashtags
 *
 * Garantit que les hashtags sont propres, sans doublons,
 * et correctement formatés avant stockage et publication.
 */

/**
 * Normalise un tableau de hashtags :
 * - Supprime le préfixe `#` si présent
 * - Supprime les espaces en début/fin
 * - Remplace les espaces internes par rien (ex: "bien être" → "bienêtre")
 * - Supprime les caractères non valides pour un hashtag
 * - Supprime les doublons (comparaison insensible à la casse)
 * - Supprime les entrées vides
 *
 * @param hashtags - Tableau de hashtags bruts (avec ou sans #)
 * @returns Tableau de hashtags nettoyés, sans préfixe #
 */
export function normalizeHashtags(hashtags: unknown): string[] {
  if (!Array.isArray(hashtags)) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of hashtags) {
    if (typeof raw !== 'string') {
      continue;
    }

    const cleaned = cleanHashtag(raw);
    if (!cleaned) {
      continue;
    }

    const key = cleaned.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

/**
 * Nettoie un hashtag individuel :
 * - Supprime le(s) préfixe(s) `#`
 * - Supprime les espaces
 * - Ne conserve que les caractères valides (lettres, chiffres, underscores, caractères accentués)
 *
 * @param raw - Hashtag brut
 * @returns Hashtag nettoyé sans #, ou chaîne vide si invalide
 */
export function cleanHashtag(raw: string): string {
  let cleaned = raw.trim();

  // Supprimer tous les # en début
  while (cleaned.startsWith('#')) {
    cleaned = cleaned.slice(1);
  }

  // Supprimer les espaces internes
  cleaned = cleaned.replace(/\s+/g, '');

  // Ne garder que les caractères valides pour un hashtag
  // Lettres (y compris accentuées), chiffres, underscores
  cleaned = cleaned.replace(/[^\w\u00C0-\u024F\u1E00-\u1EFF]/g, '');

  return cleaned;
}

/**
 * Extrait les hashtags présents dans un texte de contenu
 *
 * @param content - Texte du post
 * @returns Tableau de hashtags trouvés dans le texte (sans #)
 */
export function extractHashtagsFromContent(content: string): string[] {
  const hashtagRegex = /#([\w\u00C0-\u024F\u1E00-\u1EFF]+)/g;
  const matches: string[] = [];
  let match;

  while ((match = hashtagRegex.exec(content)) !== null) {
    if (match[1]) {
      matches.push(match[1]);
    }
  }

  return matches;
}

/**
 * Déduplique les hashtags du champ `hashtags` avec ceux déjà
 * présents inline dans le `content`.
 * Retourne uniquement les hashtags qui ne sont pas déjà dans le content.
 *
 * @param hashtags - Hashtags du champ séparé (normalisés, sans #)
 * @param content - Texte du post
 * @returns Hashtags qui ne sont pas déjà inline dans le content
 */
export function deduplicateWithContent(hashtags: string[], content: string): string[] {
  const inlineHashtags = extractHashtagsFromContent(content);
  const inlineSet = new Set(inlineHashtags.map(h => h.toLowerCase()));

  return hashtags.filter(h => !inlineSet.has(h.toLowerCase()));
}
