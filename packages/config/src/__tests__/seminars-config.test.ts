/**
 * Seminars Configuration Schema Tests
 *
 * Tests for seminarsConfigSchema validation and SiteConfig integration.
 */

import { describe, it, expect } from 'vitest';

import { seminarsConfigSchema, seminarTypeOptionSchema, siteConfigSchema } from '../index';

describe('seminarTypeOptionSchema', () => {
  it('should validate a valid type option', () => {
    const result = seminarTypeOptionSchema.safeParse({
      value: 'respiration-holotropique',
      label: 'Respiration holotropique',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty value', () => {
    const result = seminarTypeOptionSchema.safeParse({
      value: '',
      label: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty label', () => {
    const result = seminarTypeOptionSchema.safeParse({
      value: 'test',
      label: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('seminarsConfigSchema', () => {
  it('should apply defaults for minimal config', () => {
    const result = seminarsConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.types).toEqual([]);
      expect(result.data.speakersCount).toBe(2);
      expect(result.data.defaultCapacity).toBe(24);
      expect(result.data.currency).toBe('EUR');
      expect(result.data.thumbnailUpload).toBe(true);
      expect(result.data.depositEnabled).toBe(false);
      expect(result.data.orderEnabled).toBe(false);
    }
  });

  it('should validate a full psypnos-like config', () => {
    const result = seminarsConfigSchema.safeParse({
      types: [
        { value: 'respiration-holotropique', label: 'Respiration holotropique' },
        { value: 'breathwork', label: 'Breathwork' },
        { value: 'meditation', label: 'Méditation' },
      ],
      speakersCount: 2,
      defaultCapacity: 24,
      currency: 'EUR',
      thumbnailUpload: true,
      depositEnabled: true,
      orderEnabled: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.types).toHaveLength(3);
      expect(result.data.depositEnabled).toBe(true);
      expect(result.data.orderEnabled).toBe(true);
    }
  });

  it('should reject invalid speakersCount', () => {
    const result = seminarsConfigSchema.safeParse({
      speakersCount: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid currency length', () => {
    const result = seminarsConfigSchema.safeParse({
      currency: 'EU',
    });
    expect(result.success).toBe(false);
  });
});

describe('siteConfigSchema with seminars', () => {
  it('should accept siteConfig without seminars field', () => {
    const minimalConfig = {
      id: 'test-site',
      name: 'Test Site',
      domain: 'test.fr',
      locale: 'fr',
      practitioner: {
        name: 'Dr. Test',
        title: 'Thérapeute',
        bio: 'Bio de test avec suffisamment de caractères pour passer la validation du schéma Zod qui nécessite au moins cent caractères dans ce champ.',
        image: '/images/test.webp',
        credentials: [],
      },
      contact: {
        email: 'contact@test.fr',
        address: { street: '1 rue test', city: 'Paris', postalCode: '75001', country: 'France' },
        coordinates: { lat: 48.8566, lng: 2.3522 },
        businessHours: {},
      },
      services: [],
      features: {},
      seo: {
        defaultTitle: 'Test',
        description: 'Description de test',
        keywords: [],
      },
      integrations: {
        database: { url: 'postgresql://test' },
        auth: { jwtSecret: 'test-secret-key-minimum-32-chars!!' },
        email: { fromAddress: 'test@test.fr', fromName: 'Test' },
      },
      theme: {
        colors: {
          primary: '#c7a962',
          secondary: '#0e1f2f',
          accent: '#f0d9a3',
          background: '#0e1f2f',
          foreground: '#f5f1e6',
        },
        fonts: { display: 'Playfair Display', body: 'Inter' },
      },
    };

    const result = siteConfigSchema.safeParse(minimalConfig);
    expect(result.success).toBe(true);
  });

  it('should accept siteConfig with seminars field', () => {
    const configWithSeminars = {
      id: 'test-site',
      name: 'Test Site',
      domain: 'test.fr',
      locale: 'fr',
      practitioner: {
        name: 'Dr. Test',
        title: 'Thérapeute',
        bio: 'Bio de test avec suffisamment de caractères pour passer la validation du schéma Zod qui nécessite au moins cent caractères dans ce champ.',
        image: '/images/test.webp',
        credentials: [],
      },
      contact: {
        email: 'contact@test.fr',
        address: { street: '1 rue test', city: 'Paris', postalCode: '75001', country: 'France' },
        coordinates: { lat: 48.8566, lng: 2.3522 },
        businessHours: {},
      },
      services: [],
      features: { seminars: true },
      seo: {
        defaultTitle: 'Test',
        description: 'Description de test',
        keywords: [],
      },
      integrations: {
        database: { url: 'postgresql://test' },
        auth: { jwtSecret: 'test-secret-key-minimum-32-chars!!' },
        email: { fromAddress: 'test@test.fr', fromName: 'Test' },
      },
      theme: {
        colors: {
          primary: '#c7a962',
          secondary: '#0e1f2f',
          accent: '#f0d9a3',
          background: '#0e1f2f',
          foreground: '#f5f1e6',
        },
        fonts: { display: 'Playfair Display', body: 'Inter' },
      },
      seminars: {
        types: [
          { value: 'yoga', label: 'Yoga' },
          { value: 'meditation', label: 'Méditation' },
        ],
        speakersCount: 1,
        defaultCapacity: 12,
      },
    };

    const result = siteConfigSchema.safeParse(configWithSeminars);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.seminars?.types).toHaveLength(2);
      expect(result.data.seminars?.speakersCount).toBe(1);
      expect(result.data.seminars?.defaultCapacity).toBe(12);
    }
  });
});
