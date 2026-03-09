import type { EmailBranding } from './email-templates';

export type EmailContent = {
  subject: string;
  text: string;
  html: string;
};

/**
 * Envoie un email via l'API Resend avec un timeout de 10 secondes.
 *
 * @param content  — Sujet, corps texte et corps HTML de l'email
 * @param to       — Adresse du destinataire
 * @param branding — Branding du site (pour construire l'adresse "from" par défaut)
 * @param options  — Options supplémentaires (replyTo, fromAddress custom)
 */
export async function sendEmailThroughResend(
  content: EmailContent,
  to: string,
  branding: EmailBranding,
  options?: { replyTo?: string; fromAddress?: string }
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress =
    options?.fromAddress ??
    process.env.CONTACT_FORM_FROM ??
    process.env.APPOINTMENT_REQUEST_FROM ??
    `${branding.siteName} <no-reply@${branding.domain}>`;

  if (!apiKey) {
    throw new Error("Le service d'envoi d'e-mails n'est pas configuré.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        reply_to: options?.replyTo ? [options.replyTo] : undefined,
        subject: content.subject,
        text: content.text,
        html: content.html,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message =
        (body as { message?: string } | null)?.message ?? "L'envoi du message a échoué.";
      throw new Error(message);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("Le service d'envoi d'e-mails a mis trop de temps à répondre.");
    }
    throw error;
  }
}
