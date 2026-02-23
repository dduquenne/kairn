/**
 * Phone number validation utilities.
 *
 * Accepts common French and international formats:
 *  - 0612345678, 06 12 34 56 78, 06.12.34.56.78, 06-12-34-56-78
 *  - +33612345678, +33 6 12 34 56 78, +33 (0)6 12 34 56 78
 *  - 0033612345678, 00 33 6 12 34 56 78
 *  - Any international number with 7-15 digits after '+'
 */

/**
 * Strip all formatting characters from a phone number,
 * keeping only digits and the leading '+'.
 */
export function normalizePhone(value: string): string {
  return value.replace(/[^+\d]/g, '');
}

/**
 * Regex applied **after** {@link normalizePhone}:
 *  - `\+\d{7,15}` – international with '+' prefix (7 to 15 digits)
 *  - `\d{10,15}` – national (e.g. 0612345678) or '00' international prefix
 */
const PHONE_REGEX = /^(?:\+\d{7,15}|\d{10,15})$/;

/**
 * Return `true` when the raw (user-typed) phone string is a plausible number.
 * The value is normalised internally before testing.
 */
export function isValidPhone(value: string): boolean {
  const normalized = normalizePhone(value);
  return PHONE_REGEX.test(normalized);
}

/** Hint text to display next to phone fields. */
export const PHONE_HINT =
  'Formats acceptés : 06 12 34 56 78, +33 6 12 34 56 78, 06.12.34.56.78, 06-12-34-56-78';

/** Short error message for invalid phone format. */
export const PHONE_ERROR = 'Format de téléphone invalide.';

/** Detailed error message with examples. */
export const PHONE_ERROR_DETAILED =
  'Format de téléphone invalide. Exemples : 06 12 34 56 78 ou +33 6 12 34 56 78';
