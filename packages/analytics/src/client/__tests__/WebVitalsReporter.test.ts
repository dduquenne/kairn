/**
 * WebVitalsReporter Tests
 *
 * Tests pour la fonction evaluateMetricRating.
 * Les tests du composant React sont dans vitest.ui.config.ts (jsdom).
 *
 * @module client/__tests__/WebVitalsReporter
 */

import { describe, it, expect } from 'vitest';

import { evaluateMetricRating } from '../WebVitalsReporter';

describe('evaluateMetricRating', () => {
  it('évalue LCP comme good quand <= 2500', () => {
    expect(evaluateMetricRating('LCP', 2000)).toBe('good');
    expect(evaluateMetricRating('LCP', 2500)).toBe('good');
  });

  it('évalue LCP comme needs-improvement quand entre 2500 et 4000', () => {
    expect(evaluateMetricRating('LCP', 3000)).toBe('needs-improvement');
    expect(evaluateMetricRating('LCP', 4000)).toBe('needs-improvement');
  });

  it('évalue LCP comme poor quand > 4000', () => {
    expect(evaluateMetricRating('LCP', 5000)).toBe('poor');
  });

  it('évalue CLS correctement', () => {
    expect(evaluateMetricRating('CLS', 0.05)).toBe('good');
    expect(evaluateMetricRating('CLS', 0.1)).toBe('good');
    expect(evaluateMetricRating('CLS', 0.15)).toBe('needs-improvement');
    expect(evaluateMetricRating('CLS', 0.3)).toBe('poor');
  });

  it('évalue INP correctement', () => {
    expect(evaluateMetricRating('INP', 100)).toBe('good');
    expect(evaluateMetricRating('INP', 300)).toBe('needs-improvement');
    expect(evaluateMetricRating('INP', 600)).toBe('poor');
  });

  it('évalue FCP correctement', () => {
    expect(evaluateMetricRating('FCP', 1000)).toBe('good');
    expect(evaluateMetricRating('FCP', 2000)).toBe('needs-improvement');
    expect(evaluateMetricRating('FCP', 4000)).toBe('poor');
  });

  it('évalue TTFB correctement', () => {
    expect(evaluateMetricRating('TTFB', 500)).toBe('good');
    expect(evaluateMetricRating('TTFB', 1000)).toBe('needs-improvement');
    expect(evaluateMetricRating('TTFB', 2000)).toBe('poor');
  });

  it('retourne good pour une métrique inconnue', () => {
    expect(evaluateMetricRating('UNKNOWN', 999)).toBe('good');
  });

  it('gère les valeurs aux limites exactes', () => {
    expect(evaluateMetricRating('LCP', 2500)).toBe('good');
    expect(evaluateMetricRating('LCP', 2501)).toBe('needs-improvement');
    expect(evaluateMetricRating('LCP', 4000)).toBe('needs-improvement');
    expect(evaluateMetricRating('LCP', 4001)).toBe('poor');
  });
});
