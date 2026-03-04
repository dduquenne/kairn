/**
 * Tests pour les utilitaires de normalisation des hashtags
 *
 * Couvre : normalizeHashtags, cleanHashtag, extractHashtagsFromContent,
 * deduplicateWithContent
 */

import { describe, it, expect } from 'vitest';

import {
  normalizeHashtags,
  cleanHashtag,
  extractHashtagsFromContent,
  deduplicateWithContent,
} from './hashtags';

// ===========================================
// cleanHashtag
// ===========================================

describe('cleanHashtag', () => {
  it('supprime le préfixe # simple', () => {
    expect(cleanHashtag('#hypnose')).toBe('hypnose');
  });

  it('supprime les préfixes # multiples', () => {
    expect(cleanHashtag('##hypnose')).toBe('hypnose');
    expect(cleanHashtag('###test')).toBe('test');
  });

  it('supprime les espaces en début et fin', () => {
    expect(cleanHashtag('  hypnose  ')).toBe('hypnose');
    expect(cleanHashtag(' #hypnose ')).toBe('hypnose');
  });

  it('supprime les espaces internes', () => {
    expect(cleanHashtag('bien être')).toBe('bienêtre');
    expect(cleanHashtag('self care')).toBe('selfcare');
  });

  it('conserve les caractères accentués', () => {
    expect(cleanHashtag('méditation')).toBe('méditation');
    expect(cleanHashtag('thérapie')).toBe('thérapie');
    expect(cleanHashtag('développement')).toBe('développement');
  });

  it('supprime les caractères spéciaux non valides', () => {
    expect(cleanHashtag('test!')).toBe('test');
    expect(cleanHashtag('hyp-nose')).toBe('hypnose');
    expect(cleanHashtag('bien.être')).toBe('bienêtre');
  });

  it('conserve les underscores', () => {
    expect(cleanHashtag('bien_etre')).toBe('bien_etre');
  });

  it('retourne une chaîne vide pour un input vide', () => {
    expect(cleanHashtag('')).toBe('');
    expect(cleanHashtag('#')).toBe('');
    expect(cleanHashtag('###')).toBe('');
  });
});

// ===========================================
// normalizeHashtags
// ===========================================

describe('normalizeHashtags', () => {
  it('nettoie et normalise un tableau de hashtags', () => {
    expect(normalizeHashtags(['#hypnose', '#bienetre', '#santé'])).toEqual([
      'hypnose',
      'bienetre',
      'santé',
    ]);
  });

  it('supprime les doublons (insensible à la casse)', () => {
    expect(normalizeHashtags(['Hypnose', 'hypnose', 'HYPNOSE'])).toEqual(['Hypnose']);
  });

  it('supprime les doublons après nettoyage du #', () => {
    expect(normalizeHashtags(['#hypnose', 'hypnose'])).toEqual(['hypnose']);
  });

  it('filtre les entrées vides et invalides', () => {
    expect(normalizeHashtags(['', '#', '  ', 'valid'])).toEqual(['valid']);
  });

  it('filtre les types non-string', () => {
    expect(normalizeHashtags([123, null, undefined, 'valid', true])).toEqual(['valid']);
  });

  it('retourne un tableau vide pour un input non-array', () => {
    expect(normalizeHashtags(null)).toEqual([]);
    expect(normalizeHashtags(undefined)).toEqual([]);
    expect(normalizeHashtags('string')).toEqual([]);
    expect(normalizeHashtags(42)).toEqual([]);
  });

  it('retourne un tableau vide pour un tableau vide', () => {
    expect(normalizeHashtags([])).toEqual([]);
  });

  it('gère un cas réaliste de réponse IA', () => {
    const aiResponse = [
      '#hypnose',
      '#BienÊtre',
      'développement personnel',
      '#santé_mentale',
      '#hypnose', // doublon
    ];
    const result = normalizeHashtags(aiResponse);
    expect(result).toEqual(['hypnose', 'BienÊtre', 'développementpersonnel', 'santé_mentale']);
  });
});

// ===========================================
// extractHashtagsFromContent
// ===========================================

describe('extractHashtagsFromContent', () => {
  it("extrait les hashtags d'un texte", () => {
    const content = 'Découvrez les bienfaits de #hypnose et #méditation';
    expect(extractHashtagsFromContent(content)).toEqual(['hypnose', 'méditation']);
  });

  it('retourne un tableau vide si pas de hashtags', () => {
    expect(extractHashtagsFromContent('Un texte sans hashtag')).toEqual([]);
  });

  it('gère les hashtags en début et fin de texte', () => {
    const content = '#debut du texte et #fin';
    expect(extractHashtagsFromContent(content)).toEqual(['debut', 'fin']);
  });

  it('gère les hashtags avec accents', () => {
    const content = 'Le #bienêtre et la #thérapie';
    expect(extractHashtagsFromContent(content)).toEqual(['bienêtre', 'thérapie']);
  });

  it('retourne un tableau vide pour une chaîne vide', () => {
    expect(extractHashtagsFromContent('')).toEqual([]);
  });
});

// ===========================================
// deduplicateWithContent
// ===========================================

describe('deduplicateWithContent', () => {
  it('supprime les hashtags déjà présents inline dans le content', () => {
    const hashtags = ['hypnose', 'bienetre', 'santé'];
    const content = 'Article sur #hypnose et le #bienetre';
    expect(deduplicateWithContent(hashtags, content)).toEqual(['santé']);
  });

  it('comparaison insensible à la casse', () => {
    const hashtags = ['Hypnose', 'MEDITATION'];
    const content = 'Découvrez #hypnose et #meditation';
    expect(deduplicateWithContent(hashtags, content)).toEqual([]);
  });

  it("retourne tous les hashtags si aucun n'est inline", () => {
    const hashtags = ['hypnose', 'santé'];
    const content = 'Un texte sans hashtag inline';
    expect(deduplicateWithContent(hashtags, content)).toEqual(['hypnose', 'santé']);
  });

  it('retourne un tableau vide si tous sont dupliqués', () => {
    const hashtags = ['test'];
    const content = 'Un post avec #test';
    expect(deduplicateWithContent(hashtags, content)).toEqual([]);
  });

  it('gère un content vide', () => {
    const hashtags = ['hypnose'];
    expect(deduplicateWithContent(hashtags, '')).toEqual(['hypnose']);
  });

  it('gère un tableau de hashtags vide', () => {
    expect(deduplicateWithContent([], 'Content avec #hypnose')).toEqual([]);
  });
});
