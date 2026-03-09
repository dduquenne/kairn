/* eslint-disable @typescript-eslint/ban-ts-comment, import/no-named-as-default-member */
// @ts-nocheck
// TODO: Type incompatibilities to fix
import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';

// Configure VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:dduquenne@appreciezvotrevie.fr';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const sendNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  url: z.string().url().optional(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  tag: z.string().optional(),
  topic: z.string().default('all'),
  type: z.enum(['blog', 'seminar', 'offer', 'system']).default('system'),
  actions: z
    .array(
      z.object({
        action: z.string(),
        title: z.string(),
      })
    )
    .optional(),
  // Admin auth
  adminToken: z.string().optional(),
});

/**
 * POST /api/push/send
 * Send push notification to subscribers
 * Requires admin authentication
 */
export async function POST(request: Request) {
  try {
    // Check if VAPID keys are configured
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({ error: 'Push notifications not configured' }, { status: 503 });
    }

    const body = await request.json();
    const parsed = sendNotificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      title,
      body: notificationBody,
      url,
      icon,
      badge,
      tag,
      topic,
      type,
      actions,
      adminToken,
    } = parsed.data;

    // Simple admin token verification (in production, use proper auth)
    const expectedToken = process.env.PUSH_ADMIN_TOKEN;
    if (expectedToken && adminToken !== expectedToken) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get active subscriptions for the topic
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        isActive: true,
        OR: [{ topics: { has: topic } }, { topics: { has: 'all' } }],
      },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun abonné pour ce topic',
        stats: { targetCount: 0, successCount: 0, failCount: 0 },
      });
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body: notificationBody,
      url: url || '/',
      icon: icon || '/icon-192x192.png',
      badge: badge || '/favicon.svg',
      tag: tag || `avv-${type}-${Date.now()}`,
      actions: actions || [
        { action: 'open', title: 'Voir' },
        { action: 'close', title: 'Fermer' },
      ],
    });

    // Send notifications in parallel with batching
    const BATCH_SIZE = 100;
    let successCount = 0;
    let failCount = 0;
    const failedEndpoints: string[] = [];

    for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
      const batch = subscriptions.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async sub => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              payload,
              {
                TTL: 86400, // 24 hours
                urgency: type === 'system' ? 'high' : 'normal',
              }
            );

            // Update last push timestamp
            await prisma.pushSubscription.update({
              where: { id: sub.id },
              data: {
                lastPushAt: new Date(),
                failCount: 0,
              },
            });

            return { success: true, endpoint: sub.endpoint };
          } catch (error: unknown) {
            // Handle specific error codes
            const statusCode = (error as { statusCode?: number })?.statusCode;
            if (statusCode === 410 || statusCode === 404) {
              // Subscription expired or invalid - mark as inactive
              await prisma.pushSubscription.update({
                where: { id: sub.id },
                data: { isActive: false },
              });
            } else {
              // Increment fail count
              await prisma.pushSubscription.update({
                where: { id: sub.id },
                data: {
                  failCount: { increment: 1 },
                  // Deactivate after 5 failures
                  isActive: sub.failCount >= 4 ? false : true,
                },
              });
            }

            return { success: false, endpoint: sub.endpoint, error };
          }
        })
      );

      // Count results
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++;
        } else {
          failCount++;
          if (result.status === 'fulfilled') {
            failedEndpoints.push(result.value.endpoint);
          }
        }
      }
    }

    // Log the notification
    await prisma.pushNotificationLog.create({
      data: {
        title,
        body: notificationBody,
        url,
        type,
        topic,
        targetCount: subscriptions.length,
        successCount,
        failCount,
        triggeredBy: adminToken ? 'admin' : 'system',
        metadata:
          failedEndpoints.length > 0 ? { failedEndpoints: failedEndpoints.slice(0, 10) } : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Notification envoyée à ${successCount} abonné(s)`,
      stats: {
        targetCount: subscriptions.length,
        successCount,
        failCount,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi des notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des notifications" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/push/send
 * Get push notification statistics
 */
export async function GET() {
  try {
    const [totalSubscriptions, activeSubscriptions, recentLogs] = await Promise.all([
      prisma.pushSubscription.count(),
      prisma.pushSubscription.count({ where: { isActive: true } }),
      prisma.pushNotificationLog.findMany({
        take: 10,
        orderBy: { sentAt: 'desc' },
        select: {
          id: true,
          title: true,
          type: true,
          topic: true,
          targetCount: true,
          successCount: true,
          failCount: true,
          sentAt: true,
        },
      }),
    ]);

    // Topic breakdown
    const topicStats = await prisma.pushSubscription.groupBy({
      by: ['topics'],
      where: { isActive: true },
      _count: true,
    });

    return NextResponse.json({
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
      },
      topicStats,
      recentNotifications: recentLogs,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
