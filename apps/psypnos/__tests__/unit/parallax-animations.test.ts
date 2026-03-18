/**
 * Tests de non-régression pour les animations parallax de la page d'accueil.
 *
 * Vérifie que le pattern hasMounted (anti-pattern empêchant les animations
 * de se jouer au rechargement) n'est pas réintroduit dans les composants animés.
 *
 * Contexte : Framer Motion v11 applique les styles `initial` pendant le SSR
 * via inline styles, garantissant que le rendu serveur et client matchent
 * sans nécessiter de guard hasMounted. Le guard empêchait les animations
 * de se déclencher au rechargement car `initial` ne se réapplique pas
 * après le montage et `whileInView` avec `once: true` enregistrait les
 * éléments comme déjà vus pendant l'hydratation.
 *
 * @see https://github.com/dduquenne/kairn/issues/419
 */

import { readFileSync } from 'fs';
import { join } from 'path';

import { describe, it, expect } from 'vitest';

const PSYPNOS_ROOT = join(__dirname, '..', '..');

/** Fichiers avec animations parallax / scroll-reveal */
const ANIMATED_COMPONENT_FILES = [
  'app/(pages)/sections/hero.tsx',
  'components/SectionTitle.tsx',
  'components/ApproachInfographic.tsx',
  'components/JourneyInfographic.tsx',
  'components/SessionFormatsInfographic.tsx',
  'app/(pages)/sections/pricing.tsx',
];

/**
 * Pattern anti-pattern hasMounted : un useState(false) suivi d'un useEffect
 * qui passe à true, utilisé pour conditionner les valeurs initial/animate.
 */
const HAS_MOUNTED_PATTERN = /const\s+\[hasMounted,\s*setHasMounted\]\s*=\s*useState\(false\)/;

/**
 * Pattern de conditionnement des animations sur hasMounted.
 * Ex: `hasMounted ? { opacity: 0 } : { opacity: 1 }`
 */
const CONDITIONAL_ANIMATION_PATTERN = /hasMounted\s*\?\s*\{[^}]*opacity/;

describe('Animations parallax — non-régression (#419)', () => {
  ANIMATED_COMPONENT_FILES.forEach(filePath => {
    const fullPath = join(PSYPNOS_ROOT, filePath);
    const fileName = filePath.split('/').pop();

    describe(fileName!, () => {
      const content = readFileSync(fullPath, 'utf-8');

      it('ne contient pas le pattern hasMounted anti-animation', () => {
        expect(content).not.toMatch(HAS_MOUNTED_PATTERN);
      });

      it('ne conditionne pas les valeurs initial/animate sur hasMounted', () => {
        expect(content).not.toMatch(CONDITIONAL_ANIMATION_PATTERN);
      });
    });
  });

  describe("hero.tsx — animations d'entrée", () => {
    const heroContent = readFileSync(join(PSYPNOS_ROOT, 'app/(pages)/sections/hero.tsx'), 'utf-8');

    it('utilise des valeurs initial statiques (pas conditionnelles)', () => {
      // Vérifie que initial={{ opacity: 0 }} ou initial={{ opacity: 0, y: ... }}
      // est utilisé directement, pas via une variable conditionnelle
      expect(heroContent).toMatch(/initial=\{\{\s*opacity:\s*0/);
    });

    it('utilise des transitions avec durée non-nulle', () => {
      // Vérifie qu'il n'y a pas de `{ duration: 0 }` (ancien fallback SSR)
      expect(heroContent).not.toMatch(/duration:\s*0\s*[,}]/);
    });

    it('conserve les effets parallax via useScroll/useTransform', () => {
      expect(heroContent).toMatch(/useScroll/);
      expect(heroContent).toMatch(/useTransform/);
      expect(heroContent).toMatch(/heroParallax/);
    });
  });

  describe('composants whileInView — animation au scroll', () => {
    const components = [
      'components/SectionTitle.tsx',
      'components/ApproachInfographic.tsx',
      'components/JourneyInfographic.tsx',
      'components/SessionFormatsInfographic.tsx',
    ];

    components.forEach(filePath => {
      const content = readFileSync(join(PSYPNOS_ROOT, filePath), 'utf-8');
      const fileName = filePath.split('/').pop();

      it(`${fileName} utilise whileInView avec once: true`, () => {
        expect(content).toMatch(/whileInView/);
        expect(content).toMatch(/once:\s*true/);
      });

      it(`${fileName} n'importe pas useState (plus nécessaire pour hasMounted)`, () => {
        // SectionTitle et les infographiques n'ont plus besoin de useState
        // après suppression du pattern hasMounted
        if (!content.includes('useState(0)') && !content.includes('useState(')) {
          expect(content).not.toMatch(/\buseState\b/);
        }
      });
    });
  });
});
