'use client';

/**
 * @kairn/experiments - Client-side A/B Testing
 *
 * Lightweight client for running experiments in the browser.
 */

import type {
  ExperimentAssignment,
  ExperimentContext,
  ExperimentConfig,
  TrackEventParams,
} from './types';

const DEFAULT_CONFIG: Required<ExperimentConfig> = {
  storage: 'localStorage',
  storagePrefix: 'exp_',
  defaultTrafficPercent: 100,
  debug: false,
  onAssignment: () => {},
  onTrack: () => {},
};

/**
 * Murmurhash3 implementation for consistent hashing
 */
function murmurhash3(str: string, seed: number = 0): number {
  let h1 = seed;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;

  for (let i = 0; i < str.length; i++) {
    let k1 = str.charCodeAt(i);
    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = Math.imul(h1, 5) + 0xe6546b64;
  }

  h1 ^= str.length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}

/**
 * Create a consistent hash between 0 and 100 for traffic allocation
 */
function hashToPercent(experimentName: string, sessionId: string): number {
  const hash = murmurhash3(`${experimentName}:${sessionId}`);
  return (hash % 10000) / 100;
}

/**
 * Select a variant based on weights
 */
function selectVariant<T extends { weight: number }>(variants: T[], hash: number): T {
  if (variants.length === 0) {
    throw new Error('No variants provided');
  }

  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  let threshold = 0;

  for (const variant of variants) {
    threshold += (variant.weight / totalWeight) * 100;
    if (hash < threshold) {
      return variant;
    }
  }

  // Return last variant (guaranteed to exist since we check length above)
  return variants[variants.length - 1]!;
}

export class ExperimentClientImpl {
  private config: Required<ExperimentConfig>;
  private assignments: Map<string, ExperimentAssignment> = new Map();

  constructor(config: ExperimentConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadAssignments();
  }

  private log(...args: unknown[]) {
    if (this.config.debug) {
      console.log('[Experiments]', ...args);
    }
  }

  private getStorageKey(key: string): string {
    return `${this.config.storagePrefix}${key}`;
  }

  private loadAssignments() {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.getStorageKey('assignments'));
      if (stored) {
        const parsed = JSON.parse(stored);
        for (const [key, value] of Object.entries(parsed)) {
          this.assignments.set(key, value as ExperimentAssignment);
        }
        this.log('Loaded assignments:', this.assignments.size);
      }
    } catch (error) {
      this.log('Failed to load assignments:', error);
    }
  }

  private saveAssignments() {
    if (typeof window === 'undefined') return;

    try {
      const obj = Object.fromEntries(this.assignments.entries());
      localStorage.setItem(this.getStorageKey('assignments'), JSON.stringify(obj));
    } catch (error) {
      this.log('Failed to save assignments:', error);
    }
  }

  /**
   * Get or assign a variant for an experiment
   */
  async getVariant(
    experimentName: string,
    context: ExperimentContext,
    variants: Array<{
      id: string;
      name: string;
      weight: number;
      config: Record<string, unknown>;
      isControl: boolean;
    }>,
    trafficPercent: number = 100
  ): Promise<ExperimentAssignment | null> {
    const assignmentKey = `${experimentName}:${context.sessionId}`;

    // Check for existing assignment
    const existingAssignment = this.assignments.get(assignmentKey);
    if (existingAssignment) {
      this.log('Returning existing assignment:', existingAssignment.variantName);
      return existingAssignment;
    }

    // Check if user is in traffic
    const trafficHash = hashToPercent(experimentName, context.sessionId);
    if (trafficHash >= trafficPercent) {
      this.log('User not in traffic:', trafficHash, '>=', trafficPercent);
      return null;
    }

    // Select variant
    const variantHash = hashToPercent(`${experimentName}:variant`, context.sessionId);
    const selectedVariant = selectVariant(variants, variantHash);

    const assignment: ExperimentAssignment = {
      experimentId: experimentName, // In client mode, use name as ID
      experimentName,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      config: selectedVariant.config,
      isControl: selectedVariant.isControl,
    };

    // Store assignment
    this.assignments.set(assignmentKey, assignment);
    this.saveAssignments();

    this.log('New assignment:', assignment.variantName);
    this.config.onAssignment(assignment);

    // Report to server
    this.reportAssignment(assignment, context);

    return assignment;
  }

  /**
   * Track a conversion or metric event
   */
  async track(params: TrackEventParams): Promise<void> {
    this.log('Track:', params.metric, params.value);
    this.config.onTrack(params);

    // Send to server
    try {
      await fetch('/api/experiments/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
    } catch (error) {
      this.log('Failed to track event:', error);
    }
  }

  /**
   * Get all active assignments for current session
   */
  getAssignments(sessionId: string): ExperimentAssignment[] {
    const results: ExperimentAssignment[] = [];
    for (const [key, assignment] of this.assignments.entries()) {
      if (key.endsWith(`:${sessionId}`)) {
        results.push(assignment);
      }
    }
    return results;
  }

  /**
   * Clear assignment for an experiment
   */
  clearAssignment(experimentName: string, sessionId: string): void {
    const key = `${experimentName}:${sessionId}`;
    this.assignments.delete(key);
    this.saveAssignments();
    this.log('Cleared assignment:', key);
  }

  /**
   * Clear all assignments
   */
  clearAllAssignments(): void {
    this.assignments.clear();
    this.saveAssignments();
    this.log('Cleared all assignments');
  }

  private async reportAssignment(
    assignment: ExperimentAssignment,
    context: ExperimentContext
  ): Promise<void> {
    try {
      await fetch('/api/experiments/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment, context }),
      });
    } catch (error) {
      this.log('Failed to report assignment:', error);
    }
  }
}

// Singleton instance
let clientInstance: ExperimentClientImpl | null = null;

/**
 * Get or create the experiment client instance
 */
export function getExperimentClient(config?: ExperimentConfig): ExperimentClientImpl {
  if (!clientInstance) {
    clientInstance = new ExperimentClientImpl(config);
  }
  return clientInstance;
}

/**
 * Create a new experiment client instance
 */
export function createExperimentClient(config?: ExperimentConfig): ExperimentClientImpl {
  return new ExperimentClientImpl(config);
}

// Re-export types
export type { ExperimentAssignment, ExperimentContext, ExperimentConfig, TrackEventParams };
