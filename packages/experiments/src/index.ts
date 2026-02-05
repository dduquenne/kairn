/**
 * @kairn/experiments - A/B Testing Framework
 *
 * A lightweight, privacy-focused experimentation framework for the Kairn platform.
 *
 * Features:
 * - Deterministic assignment using MurmurHash3
 * - Server and client-side support
 * - React hooks for easy integration
 * - Traffic allocation and variant weighting
 * - Conversion tracking
 * - Feature flags
 *
 * @example
 * ```tsx
 * // Client-side with React hooks
 * import { useABTest, ExperimentProvider } from '@kairn/experiments';
 *
 * function App() {
 *   return (
 *     <ExperimentProvider>
 *       <MyComponent />
 *     </ExperimentProvider>
 *   );
 * }
 *
 * function MyComponent() {
 *   const { config, isControl, track } = useABTest(
 *     'cta-button-test',
 *     { buttonColor: 'blue', buttonText: 'Submit' },
 *     { buttonColor: 'green', buttonText: 'Get Started' }
 *   );
 *
 *   const handleClick = () => {
 *     track('click');
 *   };
 *
 *   return (
 *     <button
 *       style={{ backgroundColor: config.buttonColor }}
 *       onClick={handleClick}
 *     >
 *       {config.buttonText}
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * ```ts
 * // Server-side with Prisma
 * import { createExperimentServer } from '@kairn/experiments/server';
 * import { prisma } from './db';
 *
 * const experiments = createExperimentServer(prisma);
 *
 * // Create an experiment
 * await experiments.createExperiment('homepage-hero', [
 *   { name: 'Control', config: { headline: 'Welcome' }, isControl: true },
 *   { name: 'Variant A', config: { headline: 'Discover' } },
 * ]);
 *
 * // Start the experiment
 * await experiments.startExperiment('homepage-hero');
 *
 * // Get variant for a user
 * const variant = await experiments.getVariant('homepage-hero', {
 *   sessionId: 'user-123',
 * });
 *
 * // Track conversion
 * await experiments.track({
 *   experimentId: variant.experimentId,
 *   variantId: variant.variantId,
 *   sessionId: 'user-123',
 *   metric: 'signup',
 * });
 * ```
 *
 * @packageDocumentation
 */

// Types
export type {
  Experiment,
  ExperimentVariant,
  ExperimentAssignment,
  ExperimentContext,
  ExperimentConfig,
  ExperimentResults,
  VariantResults,
  MetricResults,
  TrackEventParams,
  ExperimentStatus,
  ExperimentClient,
} from './types';

// Client exports
export { ExperimentClientImpl, getExperimentClient, createExperimentClient } from './client';

// React hooks exports
export {
  ExperimentProvider,
  useExperimentClient,
  useExperiment,
  useABTest,
  useFeatureFlag,
  ExperimentRenderer,
  type ExperimentProviderProps,
} from './hooks';
