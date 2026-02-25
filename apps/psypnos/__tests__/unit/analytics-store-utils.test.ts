/**
 * Unit tests for analytics store utility functions.
 *
 * Verifies that the data builder functions produce the correct structure
 * for PAGE_EXIT and SCROLL_DEPTH events, and that the event type mapping
 * covers the newly corrected event types.
 */

import { describe, it, expect } from 'vitest';

import {
  buildPageExitData,
  buildCustomEventData,
  buildSectionTimeData,
  toEventType,
  fromEventType,
} from '../../app/api/analytics/store-postgres/utils';

describe('analytics store-postgres/utils', () => {
  describe('buildPageExitData', () => {
    it('should include timeOnPage and scrollDepthPercent', () => {
      const result = buildPageExitData({
        timeOnPage: 45000,
        scrollDepthPercent: 82,
      });

      expect(result).toEqual({
        timeOnPage: 45000,
        scrollDepthPercent: 82,
      });
    });

    it('should include engagementScore when provided', () => {
      const result = buildPageExitData({
        timeOnPage: 60000,
        scrollDepthPercent: 95,
        engagementScore: 78,
      });

      expect(result).toEqual({
        timeOnPage: 60000,
        scrollDepthPercent: 95,
        engagementScore: 78,
      });
    });

    it('should omit engagementScore when undefined', () => {
      const result = buildPageExitData({
        timeOnPage: 5000,
        scrollDepthPercent: 20,
      });

      expect(result).not.toHaveProperty('engagementScore');
    });
  });

  describe('toEventType', () => {
    it('should map page_exit to PAGE_EXIT', () => {
      expect(toEventType('page_exit')).toBe('PAGE_EXIT');
    });

    it('should map scroll_depth to SCROLL_DEPTH', () => {
      expect(toEventType('scroll_depth')).toBe('SCROLL_DEPTH');
    });

    it('should map page_view to PAGE_VIEW', () => {
      expect(toEventType('page_view')).toBe('PAGE_VIEW');
    });

    it('should map section_time to SECTION_TIME', () => {
      expect(toEventType('section_time')).toBe('SECTION_TIME');
    });

    it('should map conversion to CONVERSION', () => {
      expect(toEventType('conversion')).toBe('CONVERSION');
    });

    it('should map custom_event to CUSTOM', () => {
      expect(toEventType('custom_event')).toBe('CUSTOM');
    });

    it('should fallback to CUSTOM for unknown types', () => {
      expect(toEventType('unknown_type')).toBe('CUSTOM');
    });
  });

  describe('fromEventType', () => {
    it('should map PAGE_EXIT back to page_exit', () => {
      expect(fromEventType('PAGE_EXIT' as never)).toBe('page_exit');
    });

    it('should map SCROLL_DEPTH back to scroll_depth', () => {
      expect(fromEventType('SCROLL_DEPTH' as never)).toBe('scroll_depth');
    });

    it('should map SECTION_TIME back to section_time', () => {
      expect(fromEventType('SECTION_TIME' as never)).toBe('section_time');
    });
  });

  describe('buildCustomEventData', () => {
    it('should build event with category and action', () => {
      const result = buildCustomEventData({
        category: 'Session',
        action: 'end',
      });

      expect(result).toEqual({
        category: 'Session',
        action: 'end',
      });
    });

    it('should include optional fields when provided', () => {
      const result = buildCustomEventData({
        category: 'CTA',
        action: 'click',
        label: 'book-appointment',
        value: 1,
        metadata: { location: 'hero' },
      });

      expect(result).toEqual({
        category: 'CTA',
        action: 'click',
        label: 'book-appointment',
        value: 1,
        metadata: { location: 'hero' },
      });
    });
  });

  describe('buildSectionTimeData', () => {
    it('should build section time data with name and timeSpent', () => {
      const result = buildSectionTimeData({
        sectionName: 'Approche',
        timeSpent: 12500,
      });

      expect(result).toEqual({
        sectionId: undefined,
        sectionName: 'Approche',
        timeSpent: 12500,
      });
    });
  });
});
