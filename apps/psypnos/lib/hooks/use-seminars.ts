/**
 * SWR hook for fetching seminars
 *
 * Provides automatic caching, revalidation, and error handling
 * for seminars data across the application.
 */

import useSWR, { SWRConfiguration } from 'swr';

interface Speaker {
  firstName: string;
  lastName: string;
}

interface Seminar {
  id: string;
  title: string;
  description: string;
  speakers: Speaker[];
  startAt: string;
  endAt: string;
  capacity: number;
  price?: number;
  deposit?: number;
  tags: string[];
  thumbnail?: string;
  seminarType?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UseSeminarsOptions {
  upcoming?: boolean;
  limit?: number;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  refreshInterval?: number;
}

const fetcher = async (url: string): Promise<Seminar[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch seminars');
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

export function useSeminars(options: UseSeminarsOptions = {}) {
  const { upcoming = true, limit = 3, ...swrOptions } = options;

  const params = new URLSearchParams();
  if (upcoming) params.append('upcoming', 'true');
  if (limit) params.append('limit', String(limit));

  const { data, error, isLoading, isValidating, mutate } = useSWR<Seminar[]>(
    `/api/seminars?${params.toString()}`,
    fetcher,
    {
      ...DEFAULT_SWR_CONFIG,
      ...swrOptions,
    }
  );

  return {
    seminars: data ?? [],
    isLoading,
    isValidating,
    isError: !!error,
    error,
    refresh: mutate,
  };
}
