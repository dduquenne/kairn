/**
 * Contact Form Handler
 *
 * Handles contact form submissions with CSRF, rate limiting, and honeypot protection.
 */

import { z } from 'zod';

import type { ApiRequest } from '../../middleware/types';
import { withCSRF } from '../../middleware/with-csrf';
import { getClientIP, withRateLimit } from '../../middleware/with-rate-limit';
import { withBodyValidation } from '../../middleware/with-validation';
import { error } from '../../utils/response';

/**
 * Contact form schema
 */
export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  email: z.string().email('Email invalide').max(255),
  message: z.string().trim().min(10, 'Le message doit contenir au moins 10 caractères').max(5000),
  phone: z.string().max(20).optional(),
  subject: z.string().max(200).optional(),
  meta: z
    .object({
      honeypot: z
        .string()
        .optional()
        .transform(value => value?.trim() ?? ''),
      submitted_at: z.string().optional(),
      source_page: z.string().optional(),
    })
    .default({ honeypot: '', submitted_at: undefined, source_page: undefined }),
});

export type ContactInput = z.infer<typeof contactSchema>;

/**
 * Contact handler configuration
 */
export interface ContactHandlerConfig {
  /** Enable CSRF protection */
  csrfEnabled?: boolean;
  /** Rate limit (requests per hour) */
  rateLimitPerHour?: number;
  /** Function to send email to recipient */
  sendEmail: (data: {
    to: string;
    subject: string;
    text: string;
    html: string;
    replyTo?: string;
  }) => Promise<void>;
  /** Recipient email */
  recipient: string;
  /** From email address */
  fromAddress?: string;
  /** Send confirmation to user */
  sendConfirmation?: boolean;
  /** Custom confirmation message */
  confirmationSubject?: string;
  confirmationText?: string;
  confirmationHtml?: string;
  /** Site name for emails */
  siteName?: string;
}

/**
 * Contact handler result
 */
export interface ContactResult {
  response:
    | { success: true }
    | { success: false; error: { code: string; message: string; details?: unknown } };
  statusCode: number;
  headers: Record<string, string>;
}

/**
 * Escape HTML for XSS prevention
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format email content
 */
function formatEmailContent(
  payload: ContactInput,
  siteName: string
): { subject: string; text: string; html: string } {
  const submittedAtRaw = payload.meta.submitted_at ? new Date(payload.meta.submitted_at) : null;
  const submittedAtIso =
    submittedAtRaw && !Number.isNaN(submittedAtRaw.getTime())
      ? submittedAtRaw.toISOString()
      : 'Non précisé';

  const text =
    `Nouveau message via le formulaire de contact ${siteName}\n\n` +
    `Nom : ${payload.name}\n` +
    `Email : ${payload.email}\n` +
    (payload.phone ? `Téléphone : ${payload.phone}\n` : '') +
    (payload.subject ? `Sujet : ${payload.subject}\n` : '') +
    `Message :\n${payload.message}\n\n` +
    `Soumis le : ${submittedAtIso}\n`;

  const escapedName = escapeHtml(payload.name);
  const escapedEmail = escapeHtml(payload.email);
  const escapedMessage = escapeHtml(payload.message).replace(/\n/g, '<br />');
  const escapedSubmittedAt = escapeHtml(submittedAtIso);
  const escapedPhone = payload.phone ? escapeHtml(payload.phone) : null;
  const escapedSubject = payload.subject ? escapeHtml(payload.subject) : null;

  const html =
    `<!doctype html><html lang="fr"><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0b0b0d;">` +
    `<h2>Nouveau message via le formulaire de contact ${siteName}</h2>` +
    `<p><strong>Nom :</strong> ${escapedName}</p>` +
    `<p><strong>Email :</strong> ${escapedEmail}</p>` +
    (escapedPhone ? `<p><strong>Téléphone :</strong> ${escapedPhone}</p>` : '') +
    (escapedSubject ? `<p><strong>Sujet :</strong> ${escapedSubject}</p>` : '') +
    `<p><strong>Message :</strong><br />${escapedMessage}</p>` +
    `<p><strong>Soumis le :</strong> ${escapedSubmittedAt}</p>` +
    `</body></html>`;

  return {
    subject: payload.subject
      ? `[${siteName}] ${payload.subject}`
      : `Nouveau message de contact ${siteName}`,
    text,
    html,
  };
}

/**
 * Handle contact form submission
 *
 * @param request - The incoming request
 * @param config - Handler configuration
 * @returns Contact result
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const result = await handleContact(request, {
 *     recipient: 'contact@mysite.com',
 *     siteName: 'My Site',
 *     sendEmail: async ({ to, subject, text, html, replyTo }) => {
 *       await resend.emails.send({
 *         from: 'My Site <no-reply@mysite.com>',
 *         to: [to],
 *         reply_to: replyTo ? [replyTo] : undefined,
 *         subject,
 *         text,
 *         html,
 *       });
 *     },
 *   });
 *
 *   return NextResponse.json(result.response, {
 *     status: result.statusCode,
 *     headers: result.headers,
 *   });
 * }
 * ```
 */
export async function handleContact(
  request: ApiRequest,
  config: ContactHandlerConfig
): Promise<ContactResult> {
  const {
    csrfEnabled = true,
    rateLimitPerHour = 5,
    sendEmail,
    recipient,
    sendConfirmation = true,
    confirmationSubject,
    confirmationText,
    confirmationHtml,
    siteName = 'Site',
  } = config;

  const clientIP = getClientIP(request);
  const headers: Record<string, string> = {};

  // Rate limiting
  const rateLimitResult = await withRateLimit(request, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: rateLimitPerHour,
    keyGenerator: () => `contact:${clientIP}`,
  });

  Object.assign(headers, rateLimitResult.headers);

  if (!rateLimitResult.success) {
    return {
      response: error(
        'TOO_MANY_REQUESTS',
        'Trop de tentatives. Veuillez réessayer dans quelques instants.',
        {
          retryAfter: rateLimitResult.error.details?.retryAfter,
        }
      ),
      statusCode: 429,
      headers: {
        ...headers,
        'Retry-After': String(rateLimitResult.error.details?.retryAfter || 3600),
      },
    };
  }

  // CSRF validation
  if (csrfEnabled) {
    const csrfResult = await withCSRF(request);
    if (!csrfResult.success) {
      return {
        response: error(csrfResult.error.code, csrfResult.error.message),
        statusCode: csrfResult.error.statusCode,
        headers,
      };
    }
  }

  // Validate body
  const bodyResult = await withBodyValidation(request, contactSchema);

  if (!bodyResult.success) {
    // Generic error message to not reveal validation details
    return {
      response: error('VALIDATION_ERROR', 'Données invalides.'),
      statusCode: 400,
      headers,
    };
  }

  const payload = bodyResult.body;

  // Check honeypot (bot detection)
  if (payload.meta.honeypot) {
    // Silently succeed for bots
    return {
      response: { success: true },
      statusCode: 200,
      headers,
    };
  }

  // Format email content
  const emailContent = formatEmailContent(payload, siteName);

  try {
    // Send main email
    await sendEmail({
      to: recipient,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
      replyTo: payload.email,
    });

    // Send confirmation to user
    if (sendConfirmation) {
      try {
        await sendEmail({
          to: payload.email,
          subject: confirmationSubject || 'Votre message a bien été reçu',
          text:
            confirmationText ||
            `Bonjour,\n\nMerci pour votre message. Nous vous répondons dans les plus brefs délais.\n\nBien à vous,\n${siteName}`,
          html:
            confirmationHtml ||
            `<!doctype html><html lang="fr"><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0b0b0d;"><p>Bonjour,</p><p>Merci pour votre message. Nous vous répondons dans les plus brefs délais.</p><p>Bien à vous,<br />${siteName}</p></body></html>`,
        });
      } catch (confirmationError) {
        console.error('Failed to send confirmation email:', confirmationError);
        // Don't fail the main request if confirmation fails
      }
    }

    return {
      response: { success: true },
      statusCode: 200,
      headers,
    };
  } catch (e) {
    console.error('Failed to send contact email:', e);
    return {
      response: error(
        'INTERNAL_ERROR',
        'Une erreur est survenue. Veuillez réessayer dans quelques instants.'
      ),
      statusCode: 500,
      headers,
    };
  }
}

/**
 * Create contact handler with preset configuration
 */
export function createContactHandler(config: ContactHandlerConfig) {
  return (request: ApiRequest) => handleContact(request, config);
}
