/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { useEffect, useState, useCallback, useRef } from 'react';

interface RealTimeUpdate {
  type: 'visitors' | 'visit' | 'conversion' | 'anomaly';
  data: {
    count?: number;
    today?: {
      visits: number;
      trend: number;
    };
    [key: string]: unknown;
  };
  timestamp: string;
}

interface UseRealTimeAnalyticsOptions {
  enabled?: boolean;
  onUpdate?: (update: RealTimeUpdate) => void;
  pollingInterval?: number; // in milliseconds
}

// Polling configuration
const POLLING_CONFIG = {
  defaultInterval: 30000,    // 30 seconds
  minInterval: 10000,        // 10 seconds minimum
  maxInterval: 120000,       // 2 minutes maximum
  retryDelay: 5000,          // 5 seconds on error
  maxRetries: 5,             // Max consecutive errors before backing off
};

export function useRealTimeAnalytics(options: UseRealTimeAnalyticsOptions = {}) {
  const {
    enabled = true,
    onUpdate,
    pollingInterval = POLLING_CONFIG.defaultInterval,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<RealTimeUpdate | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);

  // Refs for stable references — avoid putting state values in useCallback deps
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const consecutiveErrorsRef = useRef(0);

  // Keep ref in sync with state (ref is read inside callbacks for current value)
  useEffect(() => {
    consecutiveErrorsRef.current = consecutiveErrors;
  }, [consecutiveErrors]);

  // Calculate effective polling interval with backoff on errors.
  // Reads error count from ref so the callback identity stays stable.
  const getEffectiveInterval = useCallback(() => {
    const errors = consecutiveErrorsRef.current;
    if (errors === 0) {
      return Math.max(POLLING_CONFIG.minInterval, Math.min(pollingInterval, POLLING_CONFIG.maxInterval));
    }
    // Exponential backoff on errors
    const backoffInterval = POLLING_CONFIG.retryDelay * Math.pow(2, errors - 1);
    return Math.min(backoffInterval, POLLING_CONFIG.maxInterval);
  }, [pollingInterval]);

  // Fetch real-time data — stable callback that reads error count from ref
  const fetchRealTimeData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const response = await fetch('/api/analytics/realtime', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!isMountedRef.current) return;

      // Successfully fetched - reset error state
      setIsConnected(true);
      setConnectionError(null);
      setConsecutiveErrors(0);

      // Create update object
      const update: RealTimeUpdate = {
        type: 'visitors',
        data: {
          count: data.activeVisitors,
          today: data.today,
        },
        timestamp: data.timestamp,
      };

      setLastUpdate(update);
      setUpdateCount(prev => prev + 1);
      onUpdateRef.current?.(update);

    } catch (error) {
      if (!isMountedRef.current) return;

      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion';
      console.error('[Polling] error:', errorMessage);

      const currentErrors = consecutiveErrorsRef.current + 1;
      setConsecutiveErrors(currentErrors);

      // Only mark as disconnected after multiple consecutive errors
      if (currentErrors >= POLLING_CONFIG.maxRetries) {
        setIsConnected(false);
        setConnectionError('Connexion instable. Nouvelle tentative...');
      } else {
        // Keep connected status during temporary errors
        setConnectionError(`Erreur temporaire (${currentErrors}/${POLLING_CONFIG.maxRetries})`);
      }

      // Adjust polling interval for next tick (exponential backoff)
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        const backoffInterval = getEffectiveInterval();
        pollingIntervalRef.current = setInterval(() => {
          fetchRealTimeDataRef.current();
        }, backoffInterval);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getEffectiveInterval]);

  // Keep a ref so the interval callback always calls the latest version
  const fetchRealTimeDataRef = useRef(fetchRealTimeData);
  fetchRealTimeDataRef.current = fetchRealTimeData;

  // Start/stop polling — depends only on `enabled` and `pollingInterval`
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      setIsConnected(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchRealTimeDataRef.current();

    // Set up polling interval
    const interval = getEffectiveInterval();

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(() => {
      fetchRealTimeDataRef.current();
    }, interval);

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [enabled, pollingInterval, getEffectiveInterval]);

  // Manual refresh function — stable identity thanks to ref
  const refresh = useCallback(() => {
    fetchRealTimeDataRef.current();
  }, []);

  // Reconnect function (reset error state and fetch)
  const reconnect = useCallback(() => {
    setConsecutiveErrors(0);
    setConnectionError(null);
    fetchRealTimeDataRef.current();
  }, []);

  return {
    isConnected,
    lastUpdate,
    updateCount,
    connectionError,
    reconnectAttempt: consecutiveErrors,
    refresh,
    reconnect,
    // Legacy compatibility - no socket in polling mode
    sendEvent: () => {},
    socket: null
  };
}
