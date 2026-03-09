/**
 * Tests unitaires pour le constructeur de prompts de séminaires.
 *
 * Vérifie que les prompts générés contiennent :
 * - Les URLs du site (inscription et respiration holotropique)
 * - Le thumbnail du séminaire quand il est fourni
 * - Les informations essentielles du séminaire
 */

import { describe, it, expect } from 'vitest';

import {
  buildSeminarSystemPrompt,
  buildSeminarUserPrompt,
  buildSeminarMultiPlatformPrompt,
  type SeminarInput,
  type SeminarGenerationOptions,
} from '../../lib/social/prompts/seminar-builder';

// ─── Fixtures ────────────────────────────────────────────────────

type SocialPlatform = 'FACEBOOK' | 'LINKEDIN' | 'INSTAGRAM' | 'TWITTER' | 'THREADS';

const BASE_SEMINAR: SeminarInput = {
  id: 'test-seminar-1',
  title: "Séminaire Retrouver l'Essentiel",
  description: 'Un week-end immersif de respiration holotropique.',
  speakers: [
    { firstName: 'David', lastName: 'Duquenne' },
    { firstName: 'Marie', lastName: 'Dupont' },
  ],
  startAt: '2026-04-15T09:00:00Z',
  endAt: '2026-04-16T17:00:00Z',
  capacity: 18,
  price: 250,
  deposit: 125,
  tags: ['respiration', 'holotropique', 'lieu:Bourgogne'],
};

const SEMINAR_WITH_THUMBNAIL: SeminarInput = {
  ...BASE_SEMINAR,
  thumbnail: 'https://storage.appreciezvotrevie.fr/seminars/retrouver-essentiel.jpg',
};

const DEFAULT_OPTIONS: SeminarGenerationOptions = {
  tone: 'inspirant',
  angle: 'benefices',
};

const INSCRIPTION_URL = 'https://www.appreciezvotrevie.fr/inscription-seminaire';
const RESPIRATION_URL = 'https://www.appreciezvotrevie.fr/respiration-holotropique';

// ─── Tests du prompt système ─────────────────────────────────────

describe('buildSeminarSystemPrompt', () => {
  it('contient les URLs du site', () => {
    const prompt = buildSeminarSystemPrompt();

    expect(prompt).toContain(RESPIRATION_URL);
    expect(prompt).toContain(INSCRIPTION_URL);
  });

  it('contient le contexte Appréciez Votre Vie', () => {
    const prompt = buildSeminarSystemPrompt();

    expect(prompt).toContain('Appréciez Votre Vie');
    expect(prompt).toContain('Nathalie Duquenne');
  });
});

// ─── Tests des prompts par plateforme ────────────────────────────

describe('buildSeminarUserPrompt', () => {
  const PLATFORMS_WITH_LINKS: SocialPlatform[] = ['FACEBOOK', 'LINKEDIN', 'TWITTER'];

  describe.each(PLATFORMS_WITH_LINKS)('plateforme %s (liens inline)', platform => {
    it("contient l'URL d'inscription", () => {
      const prompt = buildSeminarUserPrompt(BASE_SEMINAR, platform, DEFAULT_OPTIONS);

      expect(prompt).toContain(INSCRIPTION_URL);
    });

    it("contient l'URL respiration holotropique", () => {
      const prompt = buildSeminarUserPrompt(BASE_SEMINAR, platform, DEFAULT_OPTIONS);

      expect(prompt).toContain(RESPIRATION_URL);
    });

    it('contient le thumbnail quand il est fourni', () => {
      const prompt = buildSeminarUserPrompt(SEMINAR_WITH_THUMBNAIL, platform, DEFAULT_OPTIONS);

      expect(prompt).toContain(SEMINAR_WITH_THUMBNAIL.thumbnail);
    });

    it('ne contient pas de référence au thumbnail quand il est absent', () => {
      const prompt = buildSeminarUserPrompt(BASE_SEMINAR, platform, DEFAULT_OPTIONS);

      expect(prompt).not.toContain('Image du séminaire: undefined');
      expect(prompt).not.toContain('Image du séminaire: null');
    });
  });

  describe.each(['INSTAGRAM', 'THREADS'] as SocialPlatform[])(
    'plateforme %s (lien en bio)',
    platform => {
      it("référence l'URL d'inscription dans le contexte", () => {
        const prompt = buildSeminarUserPrompt(BASE_SEMINAR, platform, DEFAULT_OPTIONS);

        expect(prompt).toContain(INSCRIPTION_URL);
      });

      it('contient le thumbnail quand il est fourni', () => {
        const prompt = buildSeminarUserPrompt(SEMINAR_WITH_THUMBNAIL, platform, DEFAULT_OPTIONS);

        expect(prompt).toContain(SEMINAR_WITH_THUMBNAIL.thumbnail);
      });
    }
  );

  it('contient les informations essentielles du séminaire', () => {
    const prompt = buildSeminarUserPrompt(BASE_SEMINAR, 'FACEBOOK', DEFAULT_OPTIONS);

    expect(prompt).toContain(BASE_SEMINAR.title);
    expect(prompt).toContain(BASE_SEMINAR.description);
    expect(prompt).toContain('18 places');
    expect(prompt).toContain('250€');
  });
});

// ─── Tests du prompt multi-plateforme ────────────────────────────

describe('buildSeminarMultiPlatformPrompt', () => {
  it('contient les URLs du site', () => {
    const platforms: SocialPlatform[] = ['FACEBOOK', 'LINKEDIN', 'INSTAGRAM'];
    const prompt = buildSeminarMultiPlatformPrompt(BASE_SEMINAR, platforms, DEFAULT_OPTIONS);

    expect(prompt).toContain(INSCRIPTION_URL);
    expect(prompt).toContain(RESPIRATION_URL);
  });

  it('contient le thumbnail quand il est fourni', () => {
    const platforms: SocialPlatform[] = ['FACEBOOK', 'LINKEDIN'];
    const prompt = buildSeminarMultiPlatformPrompt(
      SEMINAR_WITH_THUMBNAIL,
      platforms,
      DEFAULT_OPTIONS
    );

    expect(prompt).toContain(SEMINAR_WITH_THUMBNAIL.thumbnail);
  });

  it('contient les instructions de liens par type de plateforme', () => {
    const platforms: SocialPlatform[] = ['FACEBOOK', 'INSTAGRAM'];
    const prompt = buildSeminarMultiPlatformPrompt(BASE_SEMINAR, platforms, DEFAULT_OPTIONS);

    expect(prompt).toContain('Facebook/LinkedIn/Twitter: inclure les vrais liens');
    expect(prompt).toContain('Instagram/Threads: mentionner "lien en bio"');
  });

  it('contient les informations essentielles du séminaire', () => {
    const platforms: SocialPlatform[] = ['FACEBOOK'];
    const prompt = buildSeminarMultiPlatformPrompt(BASE_SEMINAR, platforms, DEFAULT_OPTIONS);

    expect(prompt).toContain(BASE_SEMINAR.title);
    expect(prompt).toContain('18 places');
  });
});
