'use client';

/**
 * @kairn/experiments - React Hooks
 *
 * React hooks for easy experiment integration.
 */

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

import { getExperimentClient, type ExperimentClientImpl } from './client';
import type { ExperimentAssignment, ExperimentContext } from './types';

// Context for experiment client
const ExperimentClientContext = createContext<ExperimentClientImpl | null>(null);

export interface ExperimentProviderProps {
  children: ReactNode;
  debug?: boolean;
  onAssignment?: (assignment: ExperimentAssignment) => void;
}

/**
 * Provider for experiment client
 */
export function ExperimentProvider({
  children,
  debug = false,
  onAssignment,
}: ExperimentProviderProps) {
  const [client] = useState(() =>
    getExperimentClient({
      debug,
      onAssignment,
    })
  );

  return (
    <ExperimentClientContext.Provider value={client}>{children}</ExperimentClientContext.Provider>
  );
}

/**
 * Get experiment client from context
 */
export function useExperimentClient(): ExperimentClientImpl {
  const client = useContext(ExperimentClientContext);
  if (!client) {
    // Return singleton if not in provider
    return getExperimentClient();
  }
  return client;
}

/**
 * Hook for getting an experiment variant
 */
export function useExperiment(
  experimentName: string,
  variants: Array<{
    id: string;
    name: string;
    weight?: number;
    config: Record<string, unknown>;
    isControl?: boolean;
  }>,
  options: {
    sessionId?: string;
    trafficPercent?: number;
    enabled?: boolean;
  } = {}
): {
  variant: ExperimentAssignment | null;
  isLoading: boolean;
  track: (metric: string, value?: number, metadata?: Record<string, unknown>) => Promise<void>;
} {
  const client = useExperimentClient();
  const [variant, setVariant] = useState<ExperimentAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { sessionId, trafficPercent = 100, enabled = true } = options;

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const fetchVariant = async () => {
      try {
        // Get or generate session ID
        let sid = sessionId;
        if (!sid && typeof window !== 'undefined') {
          sid = sessionStorage.getItem('psypnos_session_id') || '';
          if (!sid) {
            sid = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('psypnos_session_id', sid);
          }
        }

        if (!sid) {
          setIsLoading(false);
          return;
        }

        const context: ExperimentContext = {
          sessionId: sid,
        };

        // Normalize variants
        const normalizedVariants = variants.map((v, i) => ({
          id: v.id,
          name: v.name,
          weight: v.weight ?? 1,
          config: v.config,
          isControl: v.isControl ?? i === 0,
        }));

        const assignment = await client.getVariant(
          experimentName,
          context,
          normalizedVariants,
          trafficPercent
        );

        setVariant(assignment);
      } catch (error) {
        console.error('Experiment error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVariant();
  }, [client, experimentName, variants, sessionId, trafficPercent, enabled]);

  const track = useCallback(
    async (metric: string, value?: number, metadata?: Record<string, unknown>) => {
      if (!variant) return;

      await client.track({
        experimentId: variant.experimentId,
        variantId: variant.variantId,
        sessionId: sessionId || '',
        metric,
        value,
        metadata,
      });
    },
    [client, variant, sessionId]
  );

  return { variant, isLoading, track };
}

/**
 * Hook for A/B test with two variants
 */
export function useABTest(
  experimentName: string,
  controlConfig: Record<string, unknown>,
  variantConfig: Record<string, unknown>,
  options: {
    sessionId?: string;
    trafficPercent?: number;
    enabled?: boolean;
  } = {}
): {
  config: Record<string, unknown>;
  isControl: boolean;
  isLoading: boolean;
  track: (metric: string, value?: number, metadata?: Record<string, unknown>) => Promise<void>;
} {
  const { variant, isLoading, track } = useExperiment(
    experimentName,
    [
      { id: 'control', name: 'Control', config: controlConfig, isControl: true },
      { id: 'variant-a', name: 'Variant A', config: variantConfig, isControl: false },
    ],
    options
  );

  return {
    config: variant?.config ?? controlConfig,
    isControl: variant?.isControl ?? true,
    isLoading,
    track,
  };
}

/**
 * Hook for feature flags
 */
export function useFeatureFlag(
  flagName: string,
  defaultValue: boolean = false,
  options: {
    sessionId?: string;
    rolloutPercent?: number;
  } = {}
): {
  enabled: boolean;
  isLoading: boolean;
} {
  const { variant, isLoading } = useExperiment(
    `flag:${flagName}`,
    [
      { id: 'off', name: 'Disabled', config: { enabled: false }, isControl: true },
      { id: 'on', name: 'Enabled', config: { enabled: true }, isControl: false, weight: 1 },
    ],
    {
      ...options,
      trafficPercent: options.rolloutPercent ?? 100,
    }
  );

  return {
    enabled: variant ? (variant.config.enabled as boolean) : defaultValue,
    isLoading,
  };
}

/**
 * Component for conditional rendering based on experiment
 */
export function ExperimentRenderer({
  name,
  variants,
  children,
  fallback,
  trafficPercent,
}: {
  name: string;
  variants: Array<{
    id: string;
    name: string;
    weight?: number;
    config: Record<string, unknown>;
    isControl?: boolean;
  }>;
  children: (config: Record<string, unknown>, variantName: string) => ReactNode;
  fallback?: ReactNode;
  trafficPercent?: number;
}) {
  const { variant, isLoading } = useExperiment(name, variants, { trafficPercent });

  if (isLoading) {
    return fallback ?? null;
  }

  if (!variant) {
    // Not in experiment, render control
    const control = variants.find(v => v.isControl);
    const defaultVariant = control ?? variants[0];
    if (!defaultVariant) {
      return fallback ?? null;
    }
    return <>{children(defaultVariant.config, defaultVariant.name)}</>;
  }

  return <>{children(variant.config, variant.variantName)}</>;
}
