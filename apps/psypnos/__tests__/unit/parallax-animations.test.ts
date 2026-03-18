/**
 * Tests de non-régression pour les animations parallax de la page d'accueil.
 *
 * Vérifie que :
 * 1. Le pattern hasMounted conditionnel sur `initial` (cassé) n'est pas utilisé
 * 2. Les composants utilisent `useScrollReveal` pour un scroll-reveal SSR-safe
 * 3. Les composants utilisent `initial={false}` (pas de styles inline SSR)
 * 4. Le hero conserve ses effets parallax
 *
 * Contexte (#419) : L'ancien pattern conditionnait `initial` sur `hasMounted`,
 * ce qui ne fonctionne pas car `initial` ne se réapplique pas après le montage.
 * Le nouveau pattern utilise `useScrollReveal` (useInView + hasMounted) avec
 * `initial={false}` + `animate` contrôlé par `shouldShow`, garantissant :
 * - SSR : contenu visible (pas de styles inline)
 * - Après hydratation, hors viewport : masqué instantanément
 * - Au scroll dans le viewport : animation fluide
 *
 * @see https://github.com/dduquenne/kairn/issues/419
 */

import { readFileSync } from 'fs';
import { join } from 'path';

import { describe, it, expect } from 'vitest';

const PSYPNOS_ROOT = join(__dirname, '..', '..');

/**
 * Anti-pattern : conditionner `initial` sur hasMounted.
 * Ex: `const cardInitial = hasMounted ? { opacity: 0 } : { opacity: 1 }`
 * Ne fonctionne pas car `initial` ne se réapplique pas après le montage.
 */
const CONDITIONAL_INITIAL_PATTERN = /hasMounted\s*\?\s*\{[^}]*opacity/;

/**
 * Anti-pattern : `initial={{ opacity: 0 }}` direct (sans `initial={false}`).
 * Cause des éléments invisibles pendant le SSR car Framer Motion applique
 * `initial` en inline styles.
 *
 * Exception : hero.tsx utilise `initial` + `animate` (animation au montage).
 */
const STATIC_OPACITY_ZERO_INITIAL = /initial=\{\{\s*opacity:\s*0/;

describe('Animations parallax — non-régression (#419)', () => {
  describe('Anti-pattern hasMounted conditionnel sur initial', () => {
    const allFiles = [
      'app/(pages)/sections/hero.tsx',
      'components/SectionTitle.tsx',
      'components/ApproachInfographic.tsx',
      'components/JourneyInfographic.tsx',
      'components/SessionFormatsInfographic.tsx',
      'app/(pages)/sections/pricing.tsx',
    ];

    allFiles.forEach(filePath => {
      const fullPath = join(PSYPNOS_ROOT, filePath);
      const fileName = filePath.split('/').pop();

      it(`${fileName} ne conditionne pas initial sur hasMounted`, () => {
        const content = readFileSync(fullPath, 'utf-8');
        expect(content).not.toMatch(CONDITIONAL_INITIAL_PATTERN);
      });
    });
  });

  describe('Composants scroll-reveal — pattern useScrollReveal', () => {
    const scrollRevealComponents = [
      'components/SectionTitle.tsx',
      'components/ApproachInfographic.tsx',
      'components/JourneyInfographic.tsx',
      'components/SessionFormatsInfographic.tsx',
    ];

    scrollRevealComponents.forEach(filePath => {
      const content = readFileSync(join(PSYPNOS_ROOT, filePath), 'utf-8');
      const fileName = filePath.split('/').pop();

      it(`${fileName} utilise useScrollReveal`, () => {
        expect(content).toMatch(/useScrollReveal/);
      });

      it(`${fileName} utilise initial={false} (pas de styles inline SSR)`, () => {
        expect(content).toMatch(/initial=\{false\}/);
      });

      it(`${fileName} utilise shouldShow pour contrôler animate`, () => {
        expect(content).toMatch(/shouldShow/);
      });

      it(`${fileName} n'utilise pas initial={{ opacity: 0 }} direct`, () => {
        expect(content).not.toMatch(STATIC_OPACITY_ZERO_INITIAL);
      });
    });
  });

  describe("hero.tsx — animations d'entrée (montage)", () => {
    const heroContent = readFileSync(join(PSYPNOS_ROOT, 'app/(pages)/sections/hero.tsx'), 'utf-8');

    it('utilise initial + animate (animation au montage)', () => {
      // Le hero utilise initial={{ opacity: 0 }} + animate={{ opacity: 1 }}
      // C'est acceptable car c'est une animation de montage (above the fold)
      expect(heroContent).toMatch(/initial=\{\{\s*opacity:\s*0/);
      expect(heroContent).toMatch(/animate=\{\{\s*opacity:\s*1/);
    });

    it('conserve les effets parallax via useScroll/useTransform', () => {
      expect(heroContent).toMatch(/useScroll/);
      expect(heroContent).toMatch(/useTransform/);
      expect(heroContent).toMatch(/heroParallax/);
    });
  });

  describe('useScrollReveal hook', () => {
    const hookContent = readFileSync(join(PSYPNOS_ROOT, 'hooks/useScrollReveal.ts'), 'utf-8');

    it('utilise useInView de framer-motion', () => {
      expect(hookContent).toMatch(/useInView/);
    });

    it('utilise hasMounted pour la sécurité SSR', () => {
      expect(hookContent).toMatch(/hasMounted/);
    });

    it('exporte shouldShow qui combine hasMounted et isInView', () => {
      expect(hookContent).toMatch(/shouldShow/);
      expect(hookContent).toMatch(/!hasMounted\s*\|\|\s*isInView/);
    });

    it('configure once: true via useInView', () => {
      expect(hookContent).toMatch(/once:\s*true/);
    });
  });
});
