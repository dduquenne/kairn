/**
 * @kairn/experiments - Type Definitions
 */

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed';

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  status: ExperimentStatus;
  trafficPercent: number;
  startedAt?: Date;
  endedAt?: Date;
  winningVariant?: string;
  significanceReached: boolean;
  variants: ExperimentVariant[];
}

export interface ExperimentVariant {
  id: string;
  name: string;
  weight: number;
  config: Record<string, unknown>;
  isControl: boolean;
}

export interface ExperimentAssignment {
  experimentId: string;
  experimentName: string;
  variantId: string;
  variantName: string;
  config: Record<string, unknown>;
  isControl: boolean;
}

export interface ExperimentContext {
  sessionId: string;
  userId?: string;
  ipHash?: string;
  userAgent?: string;
  attributes?: Record<string, string | number | boolean>;
}

export interface TrackEventParams {
  experimentId: string;
  variantId: string;
  sessionId: string;
  metric: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

export interface ExperimentResults {
  experimentId: string;
  experimentName: string;
  totalSamples: number;
  variants: VariantResults[];
  winner?: {
    variantId: string;
    variantName: string;
    improvement: number;
    confidence: number;
  };
}

export interface VariantResults {
  variantId: string;
  variantName: string;
  isControl: boolean;
  samples: number;
  metrics: MetricResults[];
}

export interface MetricResults {
  name: string;
  count: number;
  sum: number;
  mean: number;
  conversionRate?: number;
}

export interface ExperimentConfig {
  /** Storage adapter for persistence */
  storage?: 'memory' | 'localStorage' | 'cookie';
  /** Cookie/storage key prefix */
  storagePrefix?: string;
  /** Default traffic percentage for new experiments */
  defaultTrafficPercent?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Callback when assignment is made */
  onAssignment?: (assignment: ExperimentAssignment) => void;
  /** Callback when event is tracked */
  onTrack?: (event: TrackEventParams) => void;
}

export interface ExperimentClient {
  /** Get or assign a variant for an experiment */
  getVariant(
    experimentName: string,
    context: ExperimentContext
  ): Promise<ExperimentAssignment | null>;
  /** Track a conversion or metric */
  track(params: TrackEventParams): Promise<void>;
  /** Get all active assignments for a session */
  getAssignments(sessionId: string): Promise<ExperimentAssignment[]>;
  /** Clear assignment for an experiment */
  clearAssignment(experimentName: string, sessionId: string): Promise<void>;
}
