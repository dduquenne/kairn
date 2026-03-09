/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Type incompatibilities to fix
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  topics: z.array(z.string()).default(['all']),
  sessionId: z.string().optional(),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

/**
 * POST /api/push/subscribe
 * Subscribe to push notifications
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = subscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données de souscription invalides' }, { status: 400 });
    }

    const { endpoint, keys, topics, sessionId } = parsed.data;

    // Detect device type from user agent
    const userAgent = request.headers.get('user-agent') || '';
    let deviceType = 'desktop';
    if (/mobile/i.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      deviceType = 'tablet';
    }

    // Upsert subscription (update if exists, create if not)
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        auth: keys.auth,
        p256dh: keys.p256dh,
        topics,
        userAgent,
        deviceType,
        sessionId,
        isActive: true,
        failCount: 0,
        updatedAt: new Date(),
      },
      create: {
        endpoint,
        auth: keys.auth,
        p256dh: keys.p256dh,
        topics,
        userAgent,
        deviceType,
        sessionId,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      id: subscription.id,
      message: 'Souscription enregistrée avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la souscription push:', error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement de la souscription" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push/subscribe
 * Unsubscribe from push notifications
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const parsed = unsubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Endpoint invalide' }, { status: 400 });
    }

    const { endpoint } = parsed.data;

    // Soft delete - mark as inactive
    await prisma.pushSubscription.updateMany({
      where: { endpoint },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Désinscription effectuée',
    });
  } catch (error) {
    console.error('Erreur lors de la désinscription push:', error);
    return NextResponse.json({ error: 'Erreur lors de la désinscription' }, { status: 500 });
  }
}

/**
 * PATCH /api/push/subscribe
 * Update subscription topics
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const schema = z.object({
      endpoint: z.string().url(),
      topics: z.array(z.string()),
    });

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { endpoint, topics } = parsed.data;

    const subscription = await prisma.pushSubscription.update({
      where: { endpoint },
      data: { topics },
    });

    return NextResponse.json({
      success: true,
      topics: subscription.topics,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des topics:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}
