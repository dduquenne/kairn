/**
 * Types for testimonial components
 * @package @kairn/ui
 */

/**
 * Testimonial data
 */
export interface Testimonial {
  /** Unique identifier */
  id: string;
  /** Testimonial text/quote */
  quote: string;
  /** Author name */
  author: string;
  /** Author role/title (optional) */
  role?: string;
  /** Author image URL (optional) */
  image?: string;
  /** Rating (1-5, optional) */
  rating?: number;
  /** Date of testimonial (ISO string, optional) */
  date?: string;
}
