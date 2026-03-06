/**
 * Email Sending Service
 *
 * Provides a centralized, provider-agnostic email sending abstraction.
 * Currently supports Resend as the email provider.
 * Falls back gracefully with clear error messages.
 */

/**
 * Email content to send
 */
export interface EmailContent {
  /** Email subject line */
  subject: string;
  /** Plain text body */
  text: string;
  /** HTML body */
  html: string;
}

/**
 * Email sending options
 */
export interface SendEmailOptions {
  /** Sender address (e.g. "Site Name <no-reply@example.com>") */
  from: string;
  /** Recipient email address */
  to: string;
  /** Reply-to address */
  replyTo?: string;
  /** Email content */
  content: EmailContent;
  /** Timeout in milliseconds (default: 10000) */
  timeoutMs?: number;
}

/**
 * Email service configuration
 */
export interface EmailServiceConfig {
  /** Resend API key */
  apiKey: string;
  /** Default sender address */
  defaultFrom?: string;
  /** Default timeout in milliseconds (default: 10000) */
  defaultTimeoutMs?: number;
}

/**
 * Result of an email send attempt
 */
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email through the Resend API.
 *
 * @param options - Email sending options
 * @param config - Email service configuration
 * @returns Result with success status and optional message ID
 *
 * @example
 * ```typescript
 * import { sendEmail } from '@kairn/core';
 *
 * const result = await sendEmail(
 *   {
 *     from: 'Site <no-reply@example.com>',
 *     to: 'user@example.com',
 *     content: {
 *       subject: 'Bienvenue',
 *       text: 'Bonjour !',
 *       html: '<p>Bonjour !</p>',
 *     },
 *   },
 *   { apiKey: process.env.RESEND_API_KEY! }
 * );
 * ```
 */
export async function sendEmail(
  options: SendEmailOptions,
  config: EmailServiceConfig
): Promise<SendEmailResult> {
  const timeoutMs = options.timeoutMs ?? config.defaultTimeoutMs ?? 10_000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from,
        to: [options.to],
        reply_to: options.replyTo ? [options.replyTo] : undefined,
        subject: options.content.subject,
        text: options.content.text,
        html: options.content.html,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message =
        (body as { message?: string } | null)?.message ?? "L'envoi du message a échoué.";
      return { success: false, error: message };
    }

    const data = (await response.json().catch(() => null)) as {
      id?: string;
    } | null;
    return { success: true, messageId: data?.id };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        error: "Le service d'envoi d'e-mails a mis trop de temps à répondre.",
      };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur inconnue lors de l'envoi.",
    };
  }
}

/**
 * Create a configured email sender function.
 * Binds the config so callers only need to provide SendEmailOptions.
 *
 * @param config - Email service configuration
 * @returns A bound sendEmail function
 *
 * @example
 * ```typescript
 * const send = createEmailSender({
 *   apiKey: process.env.RESEND_API_KEY!,
 *   defaultFrom: 'Site <no-reply@site.fr>',
 * });
 *
 * await send({
 *   from: 'Site <no-reply@site.fr>',
 *   to: 'user@example.com',
 *   content: { subject: 'Test', text: 'Hello', html: '<p>Hello</p>' },
 * });
 * ```
 */
export function createEmailSender(
  config: EmailServiceConfig
): (options: SendEmailOptions) => Promise<SendEmailResult> {
  return (options: SendEmailOptions) => sendEmail(options, config);
}
