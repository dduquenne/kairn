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

  // Refs for stable references
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Calculate effective polling interval with backoff on errors
  const getEffectiveInterval = useCallback(() => {
    if (consecutiveErrors === 0) {
      return Math.max(POLLING_CONFIG.minInterval, Math.min(pollingInterval, POLLING_CONFIG.maxInterval));
    }
    // Exponential backoff on errors
    const backoffInterval = POLLING_CONFIG.retryDelay * Math.pow(2, consecutiveErrors - 1);
    return Math.min(backoffInterval, POLLING_CONFIG.maxInterval);
  }, [consecutiveErrors, pollingInterval]);

  // Fetch real-time data
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
      console.error('❌ Polling error:', errorMessage);

      setConsecutiveErrors(prev => prev + 1);

      // Only mark as disconnected after multiple consecutive errors
      if (consecutiveErrors >= POLLING_CONFIG.maxRetries) {
        setIsConnected(false);
        setConnectionError('Connexion instable. Nouvelle tentative...');
      } else {
        // Keep connected status during temporary errors
        setConnectionError(`Erreur temporaire (${consecutiveErrors + 1}/${POLLING_CONFIG.maxRetries})`);
      }
    }
  }, [consecutiveErrors]);

  // Start/stop polling
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      setIsConnected(false);
      return;
    }

    // Initial fetch
    fetchRealTimeData();

    // Set up polling interval
    const startPolling = () => {
      const interval = getEffectiveInterval();

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      pollingIntervalRef.current = setInterval(() => {
        fetchRealTimeData();
      }, interval);

      return interval;
    };

    const initialInterval = startPolling();
    console.log(`📊 Real-time polling started (interval: ${initialInterval}ms)`);

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      console.log('📊 Real-time polling stopped');
    };
  }, [enabled, fetchRealTimeData, getEffectiveInterval]);

  // Update polling interval when error state changes
  useEffect(() => {
    if (!enabled || !pollingIntervalRef.current) return;

    const newInterval = getEffectiveInterval();

    // Clear and restart with new interval
    clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = setInterval(() => {
      fetchRealTimeData();
    }, newInterval);

  }, [consecutiveErrors, enabled, fetchRealTimeData, getEffectiveInterval]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchRealTimeData();
  }, [fetchRealTimeData]);

  // Reconnect function (reset error state and fetch)
  const reconnect = useCallback(() => {
    setConsecutiveErrors(0);
    setConnectionError(null);
    fetchRealTimeData();
  }, [fetchRealTimeData]);

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
