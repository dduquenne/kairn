/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Utilitaires de manipulation de texte
 * Fonctions pour la normalisation et la comparaison de textes en français
 */

/**
 * Normalise un texte en retirant les accents et en le passant en minuscules
 * Utilise la méthode NFD (Normalization Form Decomposition) pour séparer
 * les caractères de leurs diacritiques, puis retire ces derniers
 *
 * @example
 * normalizeText("Thérapie") // "therapie"
 * normalizeText("Émotions") // "emotions"
 * normalizeText("État modifié") // "etat modifie"
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Vérifie si un texte contient un mot-clé (insensible aux accents et à la casse)
 *
 * @example
 * containsKeyword("Psychothérapie transpersonnelle", "psychotherapie") // true
 * containsKeyword("État modifié de conscience", "etat") // true
 * containsKeyword("Hypnose ericksonienne", "thérapie") // false
 */
export function containsKeyword(text: string, keyword: string): boolean {
  if (!text || !keyword) return false;
  return normalizeText(text).includes(normalizeText(keyword));
}

/**
 * Vérifie si un texte contient au moins un des mots-clés fournis
 * (insensible aux accents et à la casse)
 *
 * @example
 * containsAnyKeyword("Anxiété et stress", ["anxiete", "depression"]) // true
 * containsAnyKeyword("Méditation guidée", ["hypnose", "yoga"]) // false
 */
export function containsAnyKeyword(text: string, keywords: string[]): boolean {
  if (!text || !keywords || keywords.length === 0) return false;
  const normalizedText = normalizeText(text);
  return keywords.some((keyword) =>
    normalizedText.includes(normalizeText(keyword))
  );
}

/**
 * Vérifie si un tableau de tags contient au moins un tag qui matche
 * avec l'un des mots-clés (match partiel, insensible aux accents)
 *
 * @example
 * tagsMatchKeywords(["psychothérapie", "stress"], ["therapie"]) // true (psychoTHERAPIE contient THERAPIE)
 * tagsMatchKeywords(["coaching", "sport"], ["hypnose", "anxiété"]) // false
 */
export function tagsMatchKeywords(tags: string[], keywords: string[]): boolean {
  if (!tags || tags.length === 0 || !keywords || keywords.length === 0) {
    return false;
  }

  return tags.some((tag) =>
    keywords.some((keyword) =>
      normalizeText(tag).includes(normalizeText(keyword))
    )
  );
}
