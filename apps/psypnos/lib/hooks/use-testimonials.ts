/**
 * SWR hook for fetching testimonials
 *
 * Provides automatic caching, revalidation, and error handling
 * for testimonials data across the application.
 */

import useSWR, { SWRConfiguration } from 'swr';

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UseTestimonialsOptions {
  limit?: number;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  refreshInterval?: number;
  initialData?: Testimonial[];
}

const fetcher = async (url: string): Promise<Testimonial[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch testimonials');
  }
  return response.json();
};

const DEFAULT_SWR_CONFIG: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // 1 minute
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  focusThrottleInterval: 60000,
};

export function useTestimonials(options: UseTestimonialsOptions = {}) {
  const { limit = 10, initialData, ...swrOptions } = options;

  const { data, error, isLoading, isValidating, mutate } = useSWR<Testimonial[]>(
    `/api/testimonials?limit=${limit}`,
    fetcher,
    {
      ...DEFAULT_SWR_CONFIG,
      ...swrOptions,
      fallbackData: initialData,
    }
  );

  return {
    testimonials: data ?? [],
    isLoading,
    isValidating,
    isError: !!error,
    error,
    refresh: mutate,
  };
}
