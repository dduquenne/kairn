/**
 * Forgot Password Handler
 *
 * Handles password reset requests.
 */

import type { ApiRequest } from '../../middleware/types';
import { getClientIP, withRateLimit } from '../../middleware/with-rate-limit';
import { withBodyValidation } from '../../middleware/with-validation';
import { error } from '../../utils/response';

import { forgotPasswordSchema, type ForgotPasswordResponse } from './types';

/**
 * Forgot password handler configuration
 */
export interface ForgotPasswordHandlerConfig {
  /** Rate limit configuration */
  rateLimit?: {
    windowMs?: number;
    maxRequests?: number;
  };
  /** Function to check if email exists */
  findUserByEmail: (email: string) => Promise<{ id: string; email: string } | null>;
  /** Function to generate reset token */
  generateResetToken: (userId: string) => Promise<string>;
  /** Function to send reset email */
  sendResetEmail: (email: string, resetToken: string, resetUrl: string) => Promise<void>;
  /** Base URL for reset link */
  resetBaseUrl?: string;
  /** Custom success message */
  successMessage?: string;
}

/**
 * Default configuration
 */
const defaultConfig: Partial<ForgotPasswordHandlerConfig> = {
  rateLimit: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 requests per hour
  },
  resetBaseUrl: '/reset-password',
  successMessage:
    'Si un compte existe avec cette adresse email, un lien de réinitialisation a été envoyé.',
};

/**
 * Forgot password result
 */
export interface ForgotPasswordResult {
  response:
    | ForgotPasswordResponse
    | { success: false; error: { code: string; message: string; details?: unknown } };
  statusCode: number;
  headers: Record<string, string>;
}

/**
 * Handle forgot password request
 *
 * Note: This handler always returns a success message even if the email doesn't exist
 * to prevent email enumeration attacks.
 *
 * @param request - The incoming request
 * @param config - Handler configuration
 * @returns Forgot password result
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const result = await handleForgotPassword(request, {
 *     findUserByEmail: async (email) => {
 *       return prisma.user.findUnique({ where: { email } });
 *     },
 *     generateResetToken: async (userId) => {
 *       const token = crypto.randomUUID();
 *       await prisma.passwordReset.create({
 *         data: { userId, token, expiresAt: new Date(Date.now() + 3600000) },
 *       });
 *       return token;
 *     },
 *     sendResetEmail: async (email, token, resetUrl) => {
 *       await resend.emails.send({
 *         to: email,
 *         subject: 'Réinitialisation de mot de passe',
 *         html: `<a href="${resetUrl}">Réinitialiser mon mot de passe</a>`,
 *       });
 *     },
 *     resetBaseUrl: 'https://myapp.com/reset-password',
 *   });
 *
 *   return NextResponse.json(result.response, {
 *     status: result.statusCode,
 *     headers: result.headers,
 *   });
 * }
 * ```
 */
export async function handleForgotPassword(
  request: ApiRequest,
  config: ForgotPasswordHandlerConfig
): Promise<ForgotPasswordResult> {
  const {
    rateLimit,
    findUserByEmail,
    generateResetToken,
    sendResetEmail,
    resetBaseUrl,
    successMessage,
  } = { ...defaultConfig, ...config };

  const clientIP = getClientIP(request);
  const headers: Record<string, string> = {};

  // Check rate limiting
  const rateLimitResult = await withRateLimit(request, {
    windowMs: rateLimit?.windowMs || 3600000,
    maxRequests: rateLimit?.maxRequests || 5,
    keyGenerator: () => `forgot-password:${clientIP}`,
  });

  Object.assign(headers, rateLimitResult.headers);

  if (!rateLimitResult.success) {
    return {
      response: error('TOO_MANY_REQUESTS', 'Trop de demandes. Veuillez réessayer plus tard.', {
        retryAfter: rateLimitResult.error.details?.retryAfter,
      }),
      statusCode: 429,
      headers: {
        ...headers,
        'Retry-After': String(rateLimitResult.error.details?.retryAfter || 3600),
      },
    };
  }

  // Validate request body
  const validationResult = await withBodyValidation(request, forgotPasswordSchema);

  if (!validationResult.success) {
    return {
      response: error('INVALID_INPUT', 'Adresse email invalide'),
      statusCode: 400,
      headers,
    };
  }

  const { email } = validationResult.body;
  const normalizedEmail = email.toLowerCase();

  // Always return success to prevent email enumeration
  // Process the request in the background
  void (async () => {
    try {
      const user = await findUserByEmail(normalizedEmail);

      if (user) {
        const resetToken = await generateResetToken(user.id);
        const resetUrl = `${resetBaseUrl}?token=${resetToken}`;
        await sendResetEmail(user.email, resetToken, resetUrl);
      }
    } catch (e) {
      // Log error but don't expose to user
      console.error('Error processing forgot password request:', e);
    }
  })();

  const responseMessage =
    successMessage ??
    defaultConfig.successMessage ??
    'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.';

  return {
    response: {
      success: true,
      message: responseMessage,
    },
    statusCode: 200,
    headers,
  };
}

/**
 * Create a forgot password handler with preset configuration
 */
export function createForgotPasswordHandler(config: ForgotPasswordHandlerConfig) {
  return (request: ApiRequest) => handleForgotPassword(request, config);
}
