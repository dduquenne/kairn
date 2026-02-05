/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Type incompatibilities to fix
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';

const assignSchema = z.object({
  assignment: z.object({
    experimentId: z.string(),
    experimentName: z.string(),
    variantId: z.string(),
    variantName: z.string(),
    config: z.record(z.unknown()),
    isControl: z.boolean(),
  }),
  context: z.object({
    sessionId: z.string(),
    userId: z.string().optional(),
    ipHash: z.string().optional(),
    userAgent: z.string().optional(),
    attributes: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  }),
});

/**
 * POST /api/experiments/assign
 * Record an experiment assignment from client
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = assignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const { assignment, context } = parsed.data;

    // Get experiment from DB
    const experiment = await prisma.experiment.findUnique({
      where: { name: assignment.experimentName },
    });

    if (!experiment) {
      // Experiment doesn't exist in DB, just acknowledge
      return NextResponse.json({ success: true, stored: false });
    }

    // Check if assignment already exists
    const existing = await prisma.experimentAssignment.findUnique({
      where: {
        experimentId_sessionId: {
          experimentId: experiment.id,
          sessionId: context.sessionId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, stored: false, existing: true });
    }

    // Get variant
    const variant = await prisma.experimentVariant.findFirst({
      where: {
        experimentId: experiment.id,
        name: assignment.variantName,
      },
    });

    if (!variant) {
      return NextResponse.json({ success: true, stored: false });
    }

    // Store assignment
    await prisma.experimentAssignment.create({
      data: {
        experimentId: experiment.id,
        variantId: variant.id,
        sessionId: context.sessionId,
        ipHash: context.ipHash,
      },
    });

    return NextResponse.json({ success: true, stored: true });
  } catch (error) {
    console.error('Experiment assign error:', error);
    return NextResponse.json({ error: 'Failed to record assignment' }, { status: 500 });
  }
}

/**
 * GET /api/experiments/assign
 * Get assignments for a session
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  try {
    const assignments = await prisma.experimentAssignment.findMany({
      where: { sessionId },
      include: {
        experiment: true,
        variant: true,
      },
    });

    return NextResponse.json({
      assignments: assignments.map(a => ({
        experimentId: a.experimentId,
        experimentName: a.experiment.name,
        variantId: a.variantId,
        variantName: a.variant.name,
        config: a.variant.config,
        isControl: a.variant.isControl,
      })),
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    return NextResponse.json({ error: 'Failed to get assignments' }, { status: 500 });
  }
}
