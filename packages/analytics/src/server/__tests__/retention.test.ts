import { describe, it, expect, vi, afterEach } from 'vitest';

import { DEFAULT_RETENTION_CONFIG, computeCutoffDate, mergeRetentionConfig } from '../retention';

describe('retention', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('DEFAULT_RETENTION_CONFIG', () => {
    it('should define retention for all event groups', () => {
      const groups = Object.keys(DEFAULT_RETENTION_CONFIG.events);
      expect(groups).toContain('pageEvents');
      expect(groups).toContain('engagementEvents');
      expect(groups).toContain('conversionEvents');
      expect(groups).toContain('interactionEvents');
      expect(groups).toContain('otherEvents');
    });

    it('should retain conversions longer than other events', () => {
      const conversionDays = DEFAULT_RETENTION_CONFIG.events.conversionEvents?.days ?? 0;
      const pageDays = DEFAULT_RETENTION_CONFIG.events.pageEvents?.days ?? 0;
      const otherDays = DEFAULT_RETENTION_CONFIG.events.otherEvents?.days ?? 0;

      expect(conversionDays).toBeGreaterThan(pageDays);
      expect(conversionDays).toBeGreaterThan(otherDays);
    });

    it('should retain daily summaries for 2 years', () => {
      expect(DEFAULT_RETENTION_CONFIG.dailySummaryDays).toBe(730);
    });

    it('should define legacy table retention', () => {
      expect(DEFAULT_RETENTION_CONFIG.legacyTables.length).toBeGreaterThan(0);
      for (const table of DEFAULT_RETENTION_CONFIG.legacyTables) {
        expect(table.model).toBeTruthy();
        expect(table.dateField).toBeTruthy();
        expect(table.days).toBeGreaterThan(0);
      }
    });

    it('should define job cleanup configuration', () => {
      expect(DEFAULT_RETENTION_CONFIG.jobs.orphanTimeoutMinutes).toBe(30);
      expect(DEFAULT_RETENTION_CONFIG.jobs.jobRetentionDays).toBe(7);
      expect(DEFAULT_RETENTION_CONFIG.jobs.socialLogRetentionDays).toBe(30);
    });
  });

  describe('computeCutoffDate', () => {
    it('should compute correct cutoff date', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const cutoff = computeCutoffDate(90);
      const expected = new Date(now - 90 * 24 * 60 * 60 * 1000);

      expect(cutoff.getTime()).toBe(expected.getTime());
    });

    it('should return a date in the past', () => {
      const cutoff = computeCutoffDate(1);
      expect(cutoff.getTime()).toBeLessThan(Date.now());
    });

    it('should handle zero days', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const cutoff = computeCutoffDate(0);
      expect(cutoff.getTime()).toBe(now);
    });
  });

  describe('mergeRetentionConfig', () => {
    it('should return defaults when no overrides', () => {
      const config = mergeRetentionConfig({});
      expect(config).toEqual(DEFAULT_RETENTION_CONFIG);
    });

    it('should override specific event retention', () => {
      const config = mergeRetentionConfig({
        events: {
          ...DEFAULT_RETENTION_CONFIG.events,
          pageEvents: {
            types: ['PAGE_VIEW', 'PAGE_EXIT'],
            days: 180,
            description: 'Extended page retention',
          },
        },
      });

      expect(config.events.pageEvents?.days).toBe(180);
      expect(config.events.conversionEvents?.days).toBe(365);
    });

    it('should override visitor geolocation days', () => {
      const config = mergeRetentionConfig({ visitorGeolocationDays: 120 });
      expect(config.visitorGeolocationDays).toBe(120);
    });

    it('should override daily summary days', () => {
      const config = mergeRetentionConfig({ dailySummaryDays: 365 });
      expect(config.dailySummaryDays).toBe(365);
    });

    it('should override job cleanup config partially', () => {
      const config = mergeRetentionConfig({
        jobs: { ...DEFAULT_RETENTION_CONFIG.jobs, jobRetentionDays: 14 },
      });
      expect(config.jobs.jobRetentionDays).toBe(14);
      expect(config.jobs.orphanTimeoutMinutes).toBe(30);
    });
  });
});
