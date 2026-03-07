import { describe, it, expect, vi } from 'vitest';

import {
  isAllowedRef,
  ALLOWED_REFS,
  VERSION_TAG_PATTERN,
  generateDeployToken,
  getTokenExpiration,
  isTokenValid,
  formatDuration,
  sanitizeLogs,
  getStatusColor,
  getPhaseDisplayName,
} from '../deployment';

// Mock fs for maintenance-flag tests
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
}));

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

describe('Deployment Module', () => {
  describe('isAllowedRef', () => {
    it('should allow whitelisted branches', () => {
      expect(isAllowedRef('main')).toBe(true);
      expect(isAllowedRef('master')).toBe(true);
      expect(isAllowedRef('develop')).toBe(true);
      expect(isAllowedRef('staging')).toBe(true);
      expect(isAllowedRef('production')).toBe(true);
    });

    it('should allow version tags', () => {
      expect(isAllowedRef('v1.0.0')).toBe(true);
      expect(isAllowedRef('v2.1.3')).toBe(true);
      expect(isAllowedRef('v1.0.0-beta')).toBe(true);
    });

    it('should allow release and hotfix prefixes', () => {
      expect(isAllowedRef('release/1.0.0')).toBe(true);
      expect(isAllowedRef('hotfix/fix-bug')).toBe(true);
    });

    it('should reject unknown refs', () => {
      expect(isAllowedRef('feature/something')).toBe(false);
      expect(isAllowedRef('random-branch')).toBe(false);
      expect(isAllowedRef('')).toBe(false);
    });
  });

  describe('ALLOWED_REFS', () => {
    it('should contain expected branches', () => {
      expect(ALLOWED_REFS).toContain('main');
      expect(ALLOWED_REFS).toContain('production');
    });
  });

  describe('VERSION_TAG_PATTERN', () => {
    it('should match version tags', () => {
      expect(VERSION_TAG_PATTERN.test('v1.0.0')).toBe(true);
      expect(VERSION_TAG_PATTERN.test('v10.20.30')).toBe(true);
      expect(VERSION_TAG_PATTERN.test('v1.0.0-alpha')).toBe(true);
    });

    it('should reject invalid tags', () => {
      expect(VERSION_TAG_PATTERN.test('1.0.0')).toBe(false);
      expect(VERSION_TAG_PATTERN.test('v1.0')).toBe(false);
    });
  });

  describe('generateDeployToken', () => {
    it('should generate a 64-char hex token', () => {
      const token = generateDeployToken();
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateDeployToken();
      const token2 = generateDeployToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('getTokenExpiration', () => {
    it('should return a date 10 minutes in the future', () => {
      const before = Date.now();
      const expiration = getTokenExpiration();
      const after = Date.now();

      const tenMinutes = 10 * 60 * 1000;
      expect(expiration.getTime()).toBeGreaterThanOrEqual(before + tenMinutes);
      expect(expiration.getTime()).toBeLessThanOrEqual(after + tenMinutes);
    });
  });

  describe('isTokenValid', () => {
    it('should return true for future dates', () => {
      expect(isTokenValid(new Date(Date.now() + 60000))).toBe(true);
    });

    it('should return false for past dates', () => {
      expect(isTokenValid(new Date(Date.now() - 60000))).toBe(false);
    });
  });

  describe('formatDuration', () => {
    it('should format seconds only', () => {
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(0)).toBe('0s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(90)).toBe('1m 30s');
      expect(formatDuration(125)).toBe('2m 5s');
    });
  });

  describe('sanitizeLogs', () => {
    it('should redact Bearer tokens', () => {
      expect(sanitizeLogs('Authorization: Bearer abc123')).toContain('[REDACTED]');
    });

    it('should redact passwords', () => {
      expect(sanitizeLogs('password=mysecret')).toContain('[REDACTED]');
    });

    it('should redact API keys', () => {
      expect(sanitizeLogs('api_key=sk-123abc')).toContain('[REDACTED]');
    });

    it('should leave non-sensitive data intact', () => {
      const safe = 'Build completed successfully';
      expect(sanitizeLogs(safe)).toBe(safe);
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors', () => {
      expect(getStatusColor('success')).toBe('green');
      expect(getStatusColor('failed')).toBe('red');
      expect(getStatusColor('rolled_back')).toBe('orange');
      expect(getStatusColor('in_progress')).toBe('blue');
      expect(getStatusColor('pending')).toBe('gray');
      expect(getStatusColor('unknown')).toBe('gray');
    });
  });

  describe('getPhaseDisplayName', () => {
    it('should return French phase names', () => {
      expect(getPhaseDisplayName('build')).toBe("Build de l'application");
      expect(getPhaseDisplayName('deploy')).toBe('Déploiement');
      expect(getPhaseDisplayName('complete')).toBe('Terminé');
    });

    it('should return default for null/unknown', () => {
      expect(getPhaseDisplayName(null)).toBe('En attente');
      expect(getPhaseDisplayName('custom')).toBe('custom');
    });
  });
});
