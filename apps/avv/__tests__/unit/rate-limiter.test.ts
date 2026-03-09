/**
 * Tests unitaires pour le rate limiter.
 *
 * Vérifie le fallback mémoire (sans Redis), les limites par type,
 * l'éviction LRU et l'extraction d'IP client.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Redis — toujours indisponible pour tester le fallback mémoire
vi.mock('@/lib/cache/redis', () => ({
  getRedisClient: vi.fn().mockReturnValue(null),
  isRedisConnected: vi.fn().mockReturnValue(false),
}));

import {
  recordAttemptAsync,
  recordAttempt,
  isRateLimited,
  clearAttempts,
  clearAttemptsAsync,
  cleanupExpiredEntries,
  getClientIP,
  RATE_LIMITS,
} from '../../app/api/common/rate-limiter';

describe('rate-limiter', () => {
  beforeEach(() => {
    // Nettoyer les stores en mémoire entre chaque test
    cleanupExpiredEntries();
  });

  describe('RATE_LIMITS config', () => {
    it('devrait définir une config pour le type "chat"', () => {
      const chatConfig = RATE_LIMITS['chat'];
      expect(chatConfig).toBeDefined();
      expect(chatConfig?.maxAttempts).toBe(20);
      expect(chatConfig?.windowMs).toBe(60 * 60 * 1000);
    });

    it('devrait définir une config pour le type "login"', () => {
      const loginConfig = RATE_LIMITS['login'];
      expect(loginConfig).toBeDefined();
      expect(loginConfig?.maxAttempts).toBe(5);
    });
  });

  describe('recordAttempt (mémoire)', () => {
    it('devrait autoriser la première tentative', () => {
      const result = recordAttempt('chat', 'ip-1');
      expect(result.limited).toBe(false);
      expect(result.remaining).toBe(19); // 20 max - 1 attempt
    });

    it('devrait bloquer après maxAttempts+1 tentatives', () => {
      const ip = 'ip-flood';
      for (let i = 0; i < 20; i++) {
        recordAttempt('chat', ip);
      }
      // 21ème tentative devrait être bloquée
      const result = recordAttempt('chat', ip);
      expect(result.limited).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('devrait isoler les limites par type', () => {
      const ip = 'ip-multi';
      // Saturer le type login (5 max)
      for (let i = 0; i < 6; i++) {
        recordAttempt('login', ip);
      }
      // Le type chat devrait toujours être autorisé
      const chatResult = recordAttempt('chat', ip);
      expect(chatResult.limited).toBe(false);
    });

    it('devrait lever une erreur pour un type inconnu', () => {
      expect(() => recordAttempt('unknown-type', 'ip')).toThrow(
        'Unknown rate limit type: unknown-type'
      );
    });
  });

  describe('recordAttemptAsync (fallback mémoire quand Redis absent)', () => {
    it('devrait utiliser le fallback mémoire quand Redis est indisponible', async () => {
      const result = await recordAttemptAsync('chat', 'ip-async');
      expect(result.limited).toBe(false);
      expect(result.remaining).toBe(19);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });
  });

  describe('isRateLimited', () => {
    it('devrait retourner false pour un nouvel identifiant', () => {
      const result = isRateLimited('chat', 'ip-new');
      expect(result.limited).toBe(false);
    });

    it('devrait retourner true après saturation', () => {
      const ip = 'ip-saturated';
      for (let i = 0; i < 20; i++) {
        recordAttempt('chat', ip);
      }
      const result = isRateLimited('chat', ip);
      expect(result.limited).toBe(true);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });
  });

  describe('clearAttempts / clearAttemptsAsync', () => {
    it('devrait réinitialiser les tentatives (sync)', () => {
      const ip = 'ip-clear';
      for (let i = 0; i < 10; i++) {
        recordAttempt('chat', ip);
      }
      clearAttempts('chat', ip);

      const result = recordAttempt('chat', ip);
      expect(result.limited).toBe(false);
      expect(result.remaining).toBe(19);
    });

    it('devrait réinitialiser les tentatives (async)', async () => {
      const ip = 'ip-clear-async';
      for (let i = 0; i < 10; i++) {
        await recordAttemptAsync('chat', ip);
      }
      await clearAttemptsAsync('chat', ip);

      const result = await recordAttemptAsync('chat', ip);
      expect(result.limited).toBe(false);
    });
  });

  describe('getClientIP', () => {
    it("devrait extraire l'IP depuis x-forwarded-for", () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
      });
      expect(getClientIP(request)).toBe('1.2.3.4');
    });

    it("devrait extraire l'IP depuis x-real-ip", () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '10.0.0.1' },
      });
      expect(getClientIP(request)).toBe('10.0.0.1');
    });

    it('devrait retourner "unknown" si aucun header IP', () => {
      const request = new Request('http://localhost');
      expect(getClientIP(request)).toBe('unknown');
    });

    it('devrait préférer x-forwarded-for à x-real-ip', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '1.1.1.1',
          'x-real-ip': '2.2.2.2',
        },
      });
      expect(getClientIP(request)).toBe('1.1.1.1');
    });
  });
});
