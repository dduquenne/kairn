import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { computeSuggestedTimes } from '../../lib/social/suggested-times';

describe('computeSuggestedTimes', () => {
  beforeEach(() => {
    // Fixer la date courante au mercredi 11 mars 2026 a 10h00
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 11, 10, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retourne des suggestions basees sur la date article quand fournie dans le futur', () => {
    // Article publie le lundi 16 mars 2026
    const articleDate = '2026-03-16';
    const suggestions = computeSuggestedTimes('FACEBOOK', articleDate, 5);

    expect(suggestions.length).toBeGreaterThan(0);
    // Tous les creneaux doivent etre >= a la date article
    for (const s of suggestions) {
      expect(s.date.getTime()).toBeGreaterThanOrEqual(new Date(articleDate).getTime());
    }
  });

  it('utilise la date du jour comme fallback quand articleDate est null', () => {
    const now = new Date();
    const suggestions = computeSuggestedTimes('FACEBOOK', null, 5);

    expect(suggestions.length).toBeGreaterThan(0);
    // Tous les creneaux doivent etre apres maintenant
    for (const s of suggestions) {
      expect(s.date.getTime()).toBeGreaterThan(now.getTime());
    }
  });

  it('utilise la date du jour comme fallback quand articleDate est undefined', () => {
    const now = new Date();
    const suggestions = computeSuggestedTimes('FACEBOOK', undefined, 5);

    expect(suggestions.length).toBeGreaterThan(0);
    for (const s of suggestions) {
      expect(s.date.getTime()).toBeGreaterThan(now.getTime());
    }
  });

  it('utilise maintenant comme plancher quand la date article est passee', () => {
    const now = new Date();
    // Article publie il y a une semaine
    const pastArticleDate = '2026-03-04';
    const suggestions = computeSuggestedTimes('FACEBOOK', pastArticleDate, 5);

    expect(suggestions.length).toBeGreaterThan(0);
    // Tous les creneaux doivent etre apres maintenant (pas apres la date passee)
    for (const s of suggestions) {
      expect(s.date.getTime()).toBeGreaterThan(now.getTime());
    }
  });

  it('marque le premier creneau primary comme ideal', () => {
    const suggestions = computeSuggestedTimes('FACEBOOK', '2026-03-16', 8);
    const idealSlots = suggestions.filter(s => s.isIdeal);

    expect(idealSlots).toHaveLength(1);
    expect(idealSlots[0]!.isPrimary).toBe(true);
  });

  it('retourne des creneaux tries par date croissante', () => {
    const suggestions = computeSuggestedTimes('FACEBOOK', '2026-03-16', 8);

    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i]!.date.getTime()).toBeGreaterThanOrEqual(
        suggestions[i - 1]!.date.getTime()
      );
    }
  });

  it('respecte la limite maxCount', () => {
    const suggestions = computeSuggestedTimes('FACEBOOK', null, 3);
    expect(suggestions.length).toBeLessThanOrEqual(3);
  });

  it('retourne des creneaux specifiques a la plateforme LINKEDIN', () => {
    // LinkedIn a des creneaux a 7h et 12h
    const suggestions = computeSuggestedTimes('LINKEDIN', '2026-03-16', 8);

    expect(suggestions.length).toBeGreaterThan(0);
    const hours = suggestions.map(s => s.date.getHours());
    // LinkedIn utilise 7h, 12h, 17h
    for (const hour of hours) {
      expect([7, 12, 17]).toContain(hour);
    }
  });

  it('retourne des creneaux specifiques a la plateforme TWITTER', () => {
    const suggestions = computeSuggestedTimes('TWITTER', '2026-03-16', 5);

    expect(suggestions.length).toBeGreaterThan(0);
    // Twitter n'a que des creneaux a 8h
    const hours = suggestions.map(s => s.date.getHours());
    for (const hour of hours) {
      expect(hour).toBe(8);
    }
  });

  it('distingue creneaux primary et secondary pour Facebook', () => {
    const suggestions = computeSuggestedTimes('FACEBOOK', '2026-03-16', 8);

    const primaries = suggestions.filter(s => s.isPrimary);
    const secondaries = suggestions.filter(s => !s.isPrimary);

    // Facebook a des creneaux primary (9h) et secondary (13h, 10h weekend)
    expect(primaries.length).toBeGreaterThan(0);
    expect(secondaries.length).toBeGreaterThan(0);
  });

  it('genere des labels lisibles', () => {
    const suggestions = computeSuggestedTimes('FACEBOOK', '2026-03-16', 3);

    for (const s of suggestions) {
      // Le label doit contenir une heure au format HH:MM
      expect(s.label).toMatch(/\d{2}:\d{2}/);
      // Le label ne doit pas etre vide
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it('retourne un tableau vide si la plateforme n a pas de creneaux definis', () => {
    // Simuler une plateforme inconnue en castant
    const suggestions = computeSuggestedTimes('UNKNOWN' as never, null, 5);
    expect(suggestions).toHaveLength(0);
  });

  it('ne filtre jamais les creneaux futurs meme proches de maintenant', () => {
    // Fixer a mercredi 11 mars 2026 a 8h59 — le creneau Facebook 9h doit passer
    vi.setSystemTime(new Date(2026, 2, 11, 8, 59, 0));

    const suggestions = computeSuggestedTimes('FACEBOOK', null, 5);

    // Le creneau 9h du jour doit etre dans les suggestions
    const todayNine = suggestions.find(s => s.date.getDate() === 11 && s.date.getHours() === 9);
    expect(todayNine).toBeDefined();
  });
});
