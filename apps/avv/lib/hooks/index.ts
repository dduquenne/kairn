/**
 * SWR hooks for data fetching
 *
 * These hooks provide optimized data fetching with:
 * - Automatic caching and deduplication
 * - Stale-while-revalidate strategy
 * - Error handling and retry logic
 * - Optimistic updates support
 */

export { useTestimonials, type Testimonial } from './use-testimonials';
export { useSeminars, type Seminar, type Speaker } from './use-seminars';
