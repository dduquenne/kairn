/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Type incompatibilities to fix
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';

const trackSchema = z.object({
  experimentId: z.string(),
  variantId: z.string(),
  sessionId: z.string(),
  metric: z.string(),
  value: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * POST /api/experiments/track
 * Track a conversion or metric event
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = trackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const { experimentId, variantId, sessionId, metric, value, metadata } = parsed.data;

    // Verify assignment exists
    const assignment = await prisma.experimentAssignment.findFirst({
      where: {
        sessionId,
        OR: [{ experimentId }, { experiment: { name: experimentId } }],
      },
    });

    if (!assignment) {
      // No assignment found, but still record with provided variantId
      // This handles client-only experiments
    }

    // Find variant
    let actualVariantId = variantId;
    const variant = await prisma.experimentVariant.findFirst({
      where: {
        OR: [{ id: variantId }, { name: variantId }],
      },
    });

    if (variant) {
      actualVariantId = variant.id;
    } else {
      // Can't track without a valid variant
      return NextResponse.json({ success: true, recorded: false });
    }

    // Record the result
    await prisma.experimentResult.create({
      data: {
        variantId: actualVariantId,
        sessionId,
        metric,
        value: value ?? 1,
        metadata: metadata ?? undefined,
      },
    });

    return NextResponse.json({ success: true, recorded: true });
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}

/**
 * GET /api/experiments/track
 * Get experiment results summary
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const experimentName = searchParams.get('experiment');

  if (!experimentName) {
    return NextResponse.json({ error: 'Experiment name required' }, { status: 400 });
  }

  try {
    const experiment = await prisma.experiment.findUnique({
      where: { name: experimentName },
      include: {
        variants: true,
        assignments: true,
      },
    });

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }

    // Get results grouped by variant and metric
    const results = await prisma.experimentResult.groupBy({
      by: ['variantId', 'metric'],
      where: {
        variant: { experimentId: experiment.id },
      },
      _count: true,
      _sum: { value: true },
      _avg: { value: true },
    });

    // Build response
    const variantResults = experiment.variants.map(variant => {
      const assignments = experiment.assignments.filter(a => a.variantId === variant.id).length;

      const metrics = results
        .filter(r => r.variantId === variant.id)
        .map(r => ({
          name: r.metric,
          count: r._count,
          sum: r._sum.value ?? 0,
          average: r._avg.value ?? 0,
          conversionRate: assignments > 0 ? (r._count / assignments) * 100 : 0,
        }));

      return {
        variantId: variant.id,
        variantName: variant.name,
        isControl: variant.isControl,
        assignments,
        metrics,
      };
    });

    return NextResponse.json({
      experimentId: experiment.id,
      experimentName: experiment.name,
      status: experiment.status,
      totalAssignments: experiment.assignments.length,
      variants: variantResults,
    });
  } catch (error) {
    console.error('Get results error:', error);
    return NextResponse.json({ error: 'Failed to get results' }, { status: 500 });
  }
}
