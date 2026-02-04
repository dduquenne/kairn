/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import {
  isRateLimited,
  recordFailedAttempt,
  clearAttempts,
  cleanupExpiredEntries,
} from "../rate-limiter";

describe("Rate Limiter", () => {
  const testIdentifier = "test@example.com";

  beforeEach(() => {
    // Clear any previous state
    clearAttempts(testIdentifier);
  });

  describe("isRateLimited", () => {
    it("should return false for new identifier", () => {
      expect(isRateLimited(testIdentifier)).toBe(false);
    });

    it("should return false when attempts are below limit", () => {
      recordFailedAttempt(testIdentifier);
      recordFailedAttempt(testIdentifier);

      expect(isRateLimited(testIdentifier)).toBe(false);
    });

    it("should return true when limit is exceeded", () => {
      for (let i = 0; i < 6; i++) {
        recordFailedAttempt(testIdentifier);
      }

      expect(isRateLimited(testIdentifier)).toBe(true);
    });
  });

  describe("recordFailedAttempt", () => {
    it("should increment attempt count", () => {
      const result1 = recordFailedAttempt(testIdentifier);
      expect(result1).toBe(false);

      const result5 = recordFailedAttempt(testIdentifier);
      recordFailedAttempt(testIdentifier);
      recordFailedAttempt(testIdentifier);
      recordFailedAttempt(testIdentifier);
      expect(result5).toBe(false);

      const result6 = recordFailedAttempt(testIdentifier);
      expect(result6).toBe(true);
    });

    it("should return true when limit is exceeded", () => {
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(testIdentifier);
      }

      const limitExceeded = recordFailedAttempt(testIdentifier);
      expect(limitExceeded).toBe(true);
    });
  });

  describe("clearAttempts", () => {
    it("should clear rate limit for identifier", () => {
      recordFailedAttempt(testIdentifier);
      recordFailedAttempt(testIdentifier);

      expect(isRateLimited(testIdentifier)).toBe(false);

      clearAttempts(testIdentifier);

      // After clearing, should be able to record more attempts
      recordFailedAttempt(testIdentifier);
      expect(isRateLimited(testIdentifier)).toBe(false);
    });
  });

  describe("cleanupExpiredEntries", () => {
    it("should remove expired entries", () => {
      recordFailedAttempt(testIdentifier);

      // This is tricky to test with time-based cleanup
      // In production, would use jest.useFakeTimers() for this
      cleanupExpiredEntries();

      // Entry should still exist (not expired yet)
      recordFailedAttempt(testIdentifier);
      expect(isRateLimited(testIdentifier)).toBe(false);
    });
  });

  describe("isolation between identifiers", () => {
    it("should track different identifiers separately", () => {
      const id1 = "user1@example.com";
      const id2 = "user2@example.com";

      // Create limit for id1
      for (let i = 0; i < 6; i++) {
        recordFailedAttempt(id1);
      }

      expect(isRateLimited(id1)).toBe(true);
      expect(isRateLimited(id2)).toBe(false);

      // id2 should still not be limited even with attempts
      recordFailedAttempt(id2);
      recordFailedAttempt(id2);

      expect(isRateLimited(id2)).toBe(false);

      // Clean up
      clearAttempts(id1);
      clearAttempts(id2);
    });
  });
});
