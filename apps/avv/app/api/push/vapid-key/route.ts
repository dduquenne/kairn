import { NextResponse } from 'next/server';

/**
 * GET /api/push/vapid-key
 * Returns the public VAPID key for push notification subscription
 */
export async function GET() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    return NextResponse.json({ error: 'Push notifications not configured' }, { status: 503 });
  }

  return NextResponse.json({
    publicKey: vapidPublicKey,
  });
}
