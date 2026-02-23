import { describe, it, expect } from 'vitest';

import { normalizePhone, isValidPhone } from '../utils/phone';

describe('normalizePhone', () => {
  it('should strip spaces', () => {
    expect(normalizePhone('06 12 34 56 78')).toBe('0612345678');
  });

  it('should strip dots', () => {
    expect(normalizePhone('06.12.34.56.78')).toBe('0612345678');
  });

  it('should strip hyphens', () => {
    expect(normalizePhone('06-12-34-56-78')).toBe('0612345678');
  });

  it('should strip parentheses', () => {
    expect(normalizePhone('+33(0)612345678')).toBe('+330612345678');
  });

  it('should strip slashes', () => {
    expect(normalizePhone('06/12/34/56/78')).toBe('0612345678');
  });

  it('should keep the leading +', () => {
    expect(normalizePhone('+33 6 12 34 56 78')).toBe('+33612345678');
  });

  it('should handle already clean input', () => {
    expect(normalizePhone('0612345678')).toBe('0612345678');
  });

  it('should handle mixed formatting', () => {
    expect(normalizePhone('+33 (0)6.12-34 56.78')).toBe('+330612345678');
  });
});

describe('isValidPhone', () => {
  describe('French national formats', () => {
    it('should accept compact format: 0612345678', () => {
      expect(isValidPhone('0612345678')).toBe(true);
    });

    it('should accept spaced format: 06 12 34 56 78', () => {
      expect(isValidPhone('06 12 34 56 78')).toBe(true);
    });

    it('should accept dotted format: 06.12.34.56.78', () => {
      expect(isValidPhone('06.12.34.56.78')).toBe(true);
    });

    it('should accept hyphenated format: 06-12-34-56-78', () => {
      expect(isValidPhone('06-12-34-56-78')).toBe(true);
    });

    it('should accept landline numbers: 01 23 45 67 89', () => {
      expect(isValidPhone('01 23 45 67 89')).toBe(true);
    });
  });

  describe('French international formats', () => {
    it('should accept +33 format: +33612345678', () => {
      expect(isValidPhone('+33612345678')).toBe(true);
    });

    it('should accept +33 spaced: +33 6 12 34 56 78', () => {
      expect(isValidPhone('+33 6 12 34 56 78')).toBe(true);
    });

    it('should accept +33(0) format: +33(0)612345678', () => {
      expect(isValidPhone('+33(0)612345678')).toBe(true);
    });

    it('should accept +33 (0) spaced: +33 (0)6 12 34 56 78', () => {
      expect(isValidPhone('+33 (0)6 12 34 56 78')).toBe(true);
    });

    it('should accept 0033 format: 0033612345678', () => {
      expect(isValidPhone('0033612345678')).toBe(true);
    });

    it('should accept 00 33 spaced: 00 33 6 12 34 56 78', () => {
      expect(isValidPhone('00 33 6 12 34 56 78')).toBe(true);
    });
  });

  describe('other international formats', () => {
    it('should accept Belgian number: +32 470 12 34 56', () => {
      expect(isValidPhone('+32 470 12 34 56')).toBe(true);
    });

    it('should accept Swiss number: +41 79 123 45 67', () => {
      expect(isValidPhone('+41 79 123 45 67')).toBe(true);
    });

    it('should accept US number: +1 555 123 4567', () => {
      expect(isValidPhone('+1 555 123 4567')).toBe(true);
    });

    it('should accept UK number: +44 7911 123456', () => {
      expect(isValidPhone('+44 7911 123456')).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should reject empty string', () => {
      expect(isValidPhone('')).toBe(false);
    });

    it('should reject too-short number', () => {
      expect(isValidPhone('0612')).toBe(false);
    });

    it('should reject letters', () => {
      expect(isValidPhone('abcdefghij')).toBe(false);
    });

    it('should reject single digit', () => {
      expect(isValidPhone('5')).toBe(false);
    });

    it('should reject too-long number (16+ digits)', () => {
      expect(isValidPhone('+1234567890123456')).toBe(false);
    });
  });
});
