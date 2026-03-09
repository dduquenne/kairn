/**
 * GET/POST /api/admin/deployment/maintenance
 *
 * Manage maintenance mode status (DB-backed).
 * On Vercel, filesystem-based flags are not persistent across invocations,
 * so we rely exclusively on the database as source of truth.
 */

import { NextRequest, NextResponse } from 'next/server';

import { withAdminAuth } from '@/app/api/auth/middleware';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

const MAINTENANCE_ID = 'singleton';

/** GET — Get maintenance mode status */
export async function GET(): Promise<NextResponse> {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const maintenance = await prisma.maintenanceMode.findFirst();

    if (!maintenance) {
      return NextResponse.json({
        isActive: false,
        reason: null,
        message: null,
        activatedBy: null,
        activatedAt: null,
        estimatedEnd: null,
      });
    }

    return NextResponse.json({
      isActive: maintenance.isActive,
      reason: maintenance.reason,
      message: maintenance.message,
      activatedBy: maintenance.activatedBy,
      activatedAt: maintenance.activatedAt?.toISOString() ?? null,
      estimatedEnd: maintenance.estimatedEnd?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('[Maintenance] Get error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du statut de maintenance' },
      { status: 500 }
    );
  }
}

/** POST — Toggle maintenance mode */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;
  const adminUser = authResult.user!;

  try {
    const body = (await request.json()) as {
      active: boolean;
      reason?: string;
      message?: string;
      estimatedMinutes?: number;
    };
    const { active, reason, message, estimatedMinutes } = body;

    let estimatedEnd: Date | null = null;
    if (active && estimatedMinutes && estimatedMinutes > 0) {
      estimatedEnd = new Date(Date.now() + estimatedMinutes * 60 * 1000);
    }

    const maintenance = await prisma.maintenanceMode.upsert({
      where: { id: MAINTENANCE_ID },
      create: {
        id: MAINTENANCE_ID,
        isActive: active,
        reason: reason || (active ? 'manual' : null),
        message: message || null,
        activatedBy: active ? adminUser.email : null,
        activatedAt: active ? new Date() : null,
        estimatedEnd,
      },
      update: {
        isActive: active,
        reason: active ? reason || 'manual' : null,
        message: active ? message : null,
        activatedBy: active ? adminUser.email : null,
        activatedAt: active ? new Date() : null,
        estimatedEnd: active ? estimatedEnd : null,
      },
    });

    console.warn(
      `[Maintenance] Mode ${active ? 'activated' : 'deactivated'} by ${adminUser.email}`
    );

    return NextResponse.json({
      success: true,
      isActive: maintenance.isActive,
      message: active ? 'Mode maintenance activé' : 'Mode maintenance désactivé',
    });
  } catch (error) {
    console.error('[Maintenance] Toggle error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du changement de mode maintenance' },
      { status: 500 }
    );
  }
}
