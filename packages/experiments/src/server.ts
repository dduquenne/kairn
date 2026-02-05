/**
 * @kairn/experiments - Server-side A/B Testing
 *
 * Server-side experiment management with Prisma integration.
 */

import type {
  Experiment,
  ExperimentAssignment,
  ExperimentContext,
  ExperimentResults,
  TrackEventParams,
  VariantResults,
} from './types';

export interface PrismaClient {
  experiment: {
    findUnique: (args: {
      where: { name: string };
      include?: { variants: boolean };
    }) => Promise<PrismaExperiment | null>;
    findMany: (args: {
      where?: { status?: string };
      include?: { variants: boolean };
    }) => Promise<PrismaExperiment[]>;
    create: (args: {
      data: CreateExperimentData;
      include?: { variants: boolean };
    }) => Promise<PrismaExperiment>;
    update: (args: {
      where: { id: string };
      data: UpdateExperimentData;
    }) => Promise<PrismaExperiment>;
  };
  experimentVariant: {
    create: (args: { data: CreateVariantData }) => Promise<PrismaVariant>;
  };
  experimentAssignment: {
    findUnique: (args: {
      where: { experimentId_sessionId: { experimentId: string; sessionId: string } };
    }) => Promise<PrismaAssignment | null>;
    create: (args: { data: CreateAssignmentData }) => Promise<PrismaAssignment>;
    findMany: (args: { where: { sessionId: string } }) => Promise<PrismaAssignment[]>;
    delete: (args: {
      where: { experimentId_sessionId: { experimentId: string; sessionId: string } };
    }) => Promise<void>;
  };
  experimentResult: {
    create: (args: { data: CreateResultData }) => Promise<void>;
    groupBy: (args: {
      by: string[];
      where: { variant: { experimentId: string } };
      _count: boolean;
      _sum: { value: boolean };
    }) => Promise<
      Array<{ variantId: string; metric: string; _count: number; _sum: { value: number | null } }>
    >;
  };
}

interface PrismaExperiment {
  id: string;
  name: string;
  description: string | null;
  status: string;
  trafficPercent: number;
  startedAt: Date | null;
  endedAt: Date | null;
  winningVariant: string | null;
  significanceReached: boolean;
  variants?: PrismaVariant[];
}

interface PrismaVariant {
  id: string;
  experimentId: string;
  name: string;
  weight: number;
  config: Record<string, unknown>;
  isControl: boolean;
}

interface PrismaAssignment {
  id: string;
  experimentId: string;
  variantId: string;
  sessionId: string;
  experiment?: PrismaExperiment;
  variant?: PrismaVariant;
}

interface CreateExperimentData {
  name: string;
  description?: string;
  status?: string;
  trafficPercent?: number;
}

interface UpdateExperimentData {
  status?: string;
  startedAt?: Date;
  endedAt?: Date;
  winningVariant?: string;
  significanceReached?: boolean;
}

interface CreateVariantData {
  experimentId: string;
  name: string;
  weight?: number;
  config: Record<string, unknown>;
  isControl?: boolean;
}

interface CreateAssignmentData {
  experimentId: string;
  variantId: string;
  sessionId: string;
  ipHash?: string;
}

interface CreateResultData {
  variantId: string;
  sessionId: string;
  metric: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Murmurhash3 for consistent hashing
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

function hashToPercent(experimentName: string, sessionId: string): number {
  const hash = murmurhash3(`${experimentName}:${sessionId}`);
  return (hash % 10000) / 100;
}

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

  return variants[variants.length - 1]!;
}

export class ExperimentServer {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get or assign a variant for an experiment
   */
  async getVariant(
    experimentName: string,
    context: ExperimentContext
  ): Promise<ExperimentAssignment | null> {
    // Get experiment
    const experiment = await this.prisma.experiment.findUnique({
      where: { name: experimentName },
      include: { variants: true },
    });

    if (!experiment || experiment.status !== 'running' || !experiment.variants?.length) {
      return null;
    }

    // Check for existing assignment
    const existingAssignment = await this.prisma.experimentAssignment.findUnique({
      where: {
        experimentId_sessionId: {
          experimentId: experiment.id,
          sessionId: context.sessionId,
        },
      },
    });

    if (existingAssignment) {
      const variant = experiment.variants.find(v => v.id === existingAssignment.variantId);
      if (variant) {
        return {
          experimentId: experiment.id,
          experimentName: experiment.name,
          variantId: variant.id,
          variantName: variant.name,
          config: variant.config as Record<string, unknown>,
          isControl: variant.isControl,
        };
      }
    }

    // Check if user is in traffic
    const trafficHash = hashToPercent(experimentName, context.sessionId);
    if (trafficHash >= experiment.trafficPercent) {
      return null;
    }

    // Select variant
    const variantHash = hashToPercent(`${experimentName}:variant`, context.sessionId);
    const selectedVariant = selectVariant(experiment.variants, variantHash);

    // Create assignment
    await this.prisma.experimentAssignment.create({
      data: {
        experimentId: experiment.id,
        variantId: selectedVariant.id,
        sessionId: context.sessionId,
        ipHash: context.ipHash,
      },
    });

    return {
      experimentId: experiment.id,
      experimentName: experiment.name,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      config: selectedVariant.config as Record<string, unknown>,
      isControl: selectedVariant.isControl,
    };
  }

  /**
   * Track a conversion or metric event
   */
  async track(params: TrackEventParams): Promise<void> {
    await this.prisma.experimentResult.create({
      data: {
        variantId: params.variantId,
        sessionId: params.sessionId,
        metric: params.metric,
        value: params.value ?? 1,
        metadata: params.metadata,
      },
    });
  }

  /**
   * Get experiment results
   */
  async getResults(experimentName: string): Promise<ExperimentResults | null> {
    const experiment = await this.prisma.experiment.findUnique({
      where: { name: experimentName },
      include: { variants: true },
    });

    if (!experiment || !experiment.variants) {
      return null;
    }

    // Get aggregated results
    const results = await this.prisma.experimentResult.groupBy({
      by: ['variantId', 'metric'],
      where: {
        variant: { experimentId: experiment.id },
      },
      _count: true,
      _sum: { value: true },
    });

    // Build variant results
    const variantResults: VariantResults[] = experiment.variants.map(variant => {
      const variantMetrics = results.filter(r => r.variantId === variant.id);
      const samples = variantMetrics.reduce((sum, r) => sum + r._count, 0);

      return {
        variantId: variant.id,
        variantName: variant.name,
        isControl: variant.isControl,
        samples,
        metrics: variantMetrics.map(r => ({
          name: r.metric,
          count: r._count,
          sum: r._sum.value ?? 0,
          mean: r._count > 0 ? (r._sum.value ?? 0) / r._count : 0,
        })),
      };
    });

    const totalSamples = variantResults.reduce((sum, v) => sum + v.samples, 0);

    return {
      experimentId: experiment.id,
      experimentName: experiment.name,
      totalSamples,
      variants: variantResults,
    };
  }

  /**
   * Create a new experiment
   */
  async createExperiment(
    name: string,
    variants: Array<{
      name: string;
      config: Record<string, unknown>;
      isControl?: boolean;
      weight?: number;
    }>,
    options: { description?: string; trafficPercent?: number } = {}
  ): Promise<Experiment> {
    const experiment = await this.prisma.experiment.create({
      data: {
        name,
        description: options.description,
        trafficPercent: options.trafficPercent ?? 100,
        status: 'draft',
      },
      include: { variants: true },
    });

    // Create variants
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i]!;
      await this.prisma.experimentVariant.create({
        data: {
          experimentId: experiment.id,
          name: v.name,
          config: v.config,
          isControl: v.isControl ?? i === 0,
          weight: v.weight ?? 1,
        },
      });
    }

    // Fetch with variants
    const result = await this.prisma.experiment.findUnique({
      where: { name },
      include: { variants: true },
    });

    return this.mapExperiment(result!);
  }

  /**
   * Start an experiment
   */
  async startExperiment(experimentName: string): Promise<void> {
    const experiment = await this.prisma.experiment.findUnique({
      where: { name: experimentName },
    });

    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentName}`);
    }

    await this.prisma.experiment.update({
      where: { id: experiment.id },
      data: {
        status: 'running',
        startedAt: new Date(),
      },
    });
  }

  /**
   * Stop an experiment
   */
  async stopExperiment(experimentName: string, winningVariant?: string): Promise<void> {
    const experiment = await this.prisma.experiment.findUnique({
      where: { name: experimentName },
    });

    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentName}`);
    }

    await this.prisma.experiment.update({
      where: { id: experiment.id },
      data: {
        status: 'completed',
        endedAt: new Date(),
        winningVariant,
        significanceReached: !!winningVariant,
      },
    });
  }

  /**
   * Get all experiments
   */
  async getExperiments(status?: string): Promise<Experiment[]> {
    const experiments = await this.prisma.experiment.findMany({
      where: status ? { status } : undefined,
      include: { variants: true },
    });

    return experiments.map(this.mapExperiment);
  }

  private mapExperiment(exp: PrismaExperiment): Experiment {
    return {
      id: exp.id,
      name: exp.name,
      description: exp.description ?? undefined,
      status: exp.status as Experiment['status'],
      trafficPercent: exp.trafficPercent,
      startedAt: exp.startedAt ?? undefined,
      endedAt: exp.endedAt ?? undefined,
      winningVariant: exp.winningVariant ?? undefined,
      significanceReached: exp.significanceReached,
      variants: (exp.variants ?? []).map(v => ({
        id: v.id,
        name: v.name,
        weight: v.weight,
        config: v.config as Record<string, unknown>,
        isControl: v.isControl,
      })),
    };
  }
}

/**
 * Create a server-side experiment manager
 */
export function createExperimentServer(prisma: PrismaClient): ExperimentServer {
  return new ExperimentServer(prisma);
}

// Re-export types
export type { Experiment, ExperimentAssignment, ExperimentContext, ExperimentResults };
