/**
 * Vérification de signature pour les requêtes QStash
 *
 * Supporte la vérification des signatures QStash en production
 * et le fallback sur CRON_SECRET pour le développement local
 */

import { Receiver } from '@upstash/qstash';

export interface VerifyQStashConfig {
  currentSigningKey?: string;
  nextSigningKey?: string;
  cronSecret?: string;
}

export interface VerifyResult {
  valid: boolean;
  source: 'qstash' | 'cron_secret' | 'development';
  error?: string;
}

// Singleton pour le Receiver QStash
let receiver: Receiver | null = null;

/**
 * Obtient ou crée l'instance du Receiver QStash
 */
function getReceiver(config?: VerifyQStashConfig): Receiver | null {
  const currentSigningKey = config?.currentSigningKey || process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = config?.nextSigningKey || process.env.QSTASH_NEXT_SIGNING_KEY;

  if (!currentSigningKey || !nextSigningKey) {
    return null;
  }

  if (!receiver) {
    receiver = new Receiver({
      currentSigningKey,
      nextSigningKey,
    });
  }

  return receiver;
}

/**
 * Réinitialise le Receiver (utile pour les tests)
 */
export function resetReceiver(): void {
  receiver = null;
}

/**
 * Vérifie la signature d'une requête QStash
 *
 * Ordre de vérification :
 * 1. Signature QStash (header upstash-signature)
 * 2. CRON_SECRET (header Authorization ou query param)
 * 3. Mode développement (autorisé sans auth si NODE_ENV !== 'production')
 *
 * @param request - La requête Next.js ou standard Request
 * @param config - Configuration optionnelle pour les clés
 * @returns Promise<VerifyResult> - Résultat de la vérification
 */
export async function verifyQStashSignature(
  request: Request,
  config?: VerifyQStashConfig
): Promise<VerifyResult> {
  const cronSecret = config?.cronSecret || process.env.CRON_SECRET;

  // 1. Essayer la vérification QStash d'abord
  const signature = request.headers.get('upstash-signature');

  if (signature) {
    const qstashReceiver = getReceiver(config);

    if (!qstashReceiver) {
      return {
        valid: false,
        source: 'qstash',
        error: 'QStash signing keys not configured',
      };
    }

    try {
      // Clone la requête pour pouvoir lire le body
      const clonedRequest = request.clone();
      const body = await clonedRequest.text();

      const isValid = await qstashReceiver.verify({
        signature,
        body,
        url: request.url,
      });

      return {
        valid: isValid,
        source: 'qstash',
        ...(isValid ? {} : { error: 'Invalid QStash signature' }),
      };
    } catch (error) {
      return {
        valid: false,
        source: 'qstash',
        error: error instanceof Error ? error.message : 'QStash verification failed',
      };
    }
  }

  // 2. Fallback sur CRON_SECRET
  if (cronSecret) {
    // Vérifier le header Authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader === `Bearer ${cronSecret}`) {
      return {
        valid: true,
        source: 'cron_secret',
      };
    }

    // Vérifier le query param
    const url = new URL(request.url);
    const secretParam = url.searchParams.get('secret');
    if (secretParam === cronSecret) {
      return {
        valid: true,
        source: 'cron_secret',
      };
    }
  }

  // 3. En développement, autoriser sans authentification
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[QStash Verify] Running without authentication in development');
    return {
      valid: true,
      source: 'development',
    };
  }

  return {
    valid: false,
    source: 'cron_secret',
    error: 'No valid authentication provided',
  };
}

/**
 * Middleware helper pour les routes API Next.js
 *
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await verifyCronAuth(request);
 *   if (!authResult.valid) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   // ... rest of handler
 * }
 * ```
 */
export async function verifyCronAuth(
  request: Request,
  config?: VerifyQStashConfig
): Promise<VerifyResult> {
  return verifyQStashSignature(request, config);
}

/**
 * Fonction simple de vérification retournant un boolean
 * Préserve la rétrocompatibilité avec l'ancien verifyCronSecret
 */
export async function isValidCronRequest(
  request: Request,
  config?: VerifyQStashConfig
): Promise<boolean> {
  const result = await verifyQStashSignature(request, config);
  return result.valid;
}

/**
 * Version synchrone pour la vérification CRON_SECRET uniquement
 * Utile pour les cas où la signature QStash n'est pas attendue
 */
export function verifyCronSecretSync(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // Vérifier le header Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Vérifier le query param
  const url = new URL(request.url);
  const secretParam = url.searchParams.get('secret');
  if (secretParam === cronSecret) {
    return true;
  }

  // En développement, autoriser sans secret
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[CRON Verify] Running without authentication in development');
    return true;
  }

  return false;
}
