import { NextResponse } from 'next/server';
import { z } from 'zod';

import { validateCSRFMiddleware } from '../common/csrf-middleware';
import { recordAttempt, getClientIP } from '../common/rate-limiter';

const requestTypeValues = ['', 'premiere_consultation', 'question_generale', 'seminaire'] as const;

const phoneRegex = /^(\+33|0)[1-9](\d{2}){4}$|^\+?\d{10,15}$/;

const quickContactSchema = z.object({
  firstName: z.string().trim().min(2, 'Le prénom est requis').max(50),
  lastName: z.string().trim().min(2, 'Le nom est requis').max(50),
  email: z.string().email('Email invalide').max(255),
  phone: z
    .string()
    .optional()
    .transform(value => value?.trim().replace(/\s/g, '') ?? '')
    .refine(value => !value || phoneRegex.test(value), {
      message: 'Format de téléphone invalide',
    }),
  requestType: z.enum(requestTypeValues).refine(val => val !== '', {
    message: 'Veuillez sélectionner le type de demande',
  }),
  message: z.string().trim().min(10, 'Message trop court').max(5000),
  consent: z.boolean().refine(value => value === true, {
    message: 'Vous devez accepter la politique de confidentialité',
  }),
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

type QuickContactPayload = z.infer<typeof quickContactSchema>;

type EmailContent = {
  subject: string;
  text: string;
  html: string;
};

const requestTypeLabels: Record<(typeof requestTypeValues)[number], string> = {
  '': 'Non précisé',
  premiere_consultation: 'Première consultation',
  question_generale: 'Question générale',
  seminaire: 'Séminaire de respiration holotropique',
};

/**
 * Escape HTML characters to prevent XSS
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const formatEmailContent = (payload: QuickContactPayload): EmailContent => {
  const submittedAtRaw = payload.meta.submitted_at ? new Date(payload.meta.submitted_at) : null;
  const submittedAtIso =
    submittedAtRaw && !Number.isNaN(submittedAtRaw.getTime())
      ? submittedAtRaw.toISOString()
      : 'Non précisé';

  const fullName = `${payload.firstName} ${payload.lastName}`;

  const text =
    `Nouvelle demande via le formulaire rapide Psypnos\n\n` +
    `Nom complet : ${fullName}\n` +
    `Email : ${payload.email}\n` +
    `Téléphone : ${payload.phone || 'Non précisé'}\n` +
    `Type de demande : ${requestTypeLabels[payload.requestType]}\n` +
    `Message :\n${payload.message}\n\n` +
    `Consentement RGPD : ${payload.consent ? 'Oui' : 'Non'}\n` +
    `Page source : ${payload.meta.source_page || 'Non précisée'}\n` +
    `Soumis le : ${submittedAtIso}\n`;

  // Escape HTML content for security
  const escapedFullName = escapeHtml(fullName);
  const escapedEmail = escapeHtml(payload.email);
  const escapedPhone = escapeHtml(payload.phone || 'Non précisé');
  const escapedMessage = escapeHtml(payload.message).replace(/\n/g, '<br />');
  const escapedSourcePage = escapeHtml(payload.meta.source_page || 'Non précisée');
  const escapedSubmittedAt = escapeHtml(submittedAtIso);

  const html =
    `<!doctype html><html lang="fr"><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0b0b0d;">` +
    `<h2 style="color:#c7a962;">Nouvelle demande via le formulaire rapide Psypnos</h2>` +
    `<table style="border-collapse:collapse;width:100%;max-width:600px;">` +
    `<tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Nom complet :</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${escapedFullName}</td></tr>` +
    `<tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Email :</strong></td><td style="padding:8px;border-bottom:1px solid #eee;"><a href="mailto:${escapedEmail}">${escapedEmail}</a></td></tr>` +
    `<tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Téléphone :</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${escapedPhone}</td></tr>` +
    `<tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Type de demande :</strong></td><td style="padding:8px;border-bottom:1px solid #eee;"><span style="background:#c7a962;color:#0e1f2f;padding:2px 8px;border-radius:4px;">${requestTypeLabels[payload.requestType]}</span></td></tr>` +
    `</table>` +
    `<div style="margin-top:20px;padding:15px;background:#f5f5f5;border-radius:8px;">` +
    `<strong>Message :</strong><br /><br />${escapedMessage}` +
    `</div>` +
    `<p style="margin-top:20px;font-size:12px;color:#666;">` +
    `Consentement RGPD : ${payload.consent ? 'Oui' : 'Non'}<br />` +
    `Page source : ${escapedSourcePage}<br />` +
    `Soumis le : ${escapedSubmittedAt}` +
    `</p>` +
    `</body></html>`;

  return {
    subject: `[Psypnos] ${requestTypeLabels[payload.requestType]} - ${fullName}`,
    text,
    html,
  };
};

const sendEmailThroughResend = async (content: EmailContent, to: string, replyTo?: string) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress =
    process.env.CONTACT_FORM_FROM ??
    process.env.APPOINTMENT_REQUEST_FROM ??
    'Psypnos <no-reply@psypnos.fr>';

  if (!apiKey) {
    throw new Error("Le service d'envoi d'e-mails n'est pas configuré.");
  }

  // Timeout of 10 seconds to prevent indefinite blocking
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

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
        reply_to: replyTo ? [replyTo] : undefined,
        subject: content.subject,
        text: content.text,
        html: content.html,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message = body?.message || "L'envoi du message a échoué.";
      throw new Error(message);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("Le service d'envoi d'e-mails a mis trop de temps à répondre.");
    }
    throw error;
  }
};

export async function POST(request: Request) {
  // Rate limiting - 5 requests per minute per IP
  const clientIP = getClientIP(request);
  const rateLimitResult = recordAttempt('quick-contact', clientIP);

  if (rateLimitResult.limited) {
    return NextResponse.json(
      {
        message: 'Trop de tentatives. Veuillez réessayer dans quelques instants.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  // Validate CSRF token
  const csrfError = await validateCSRFMiddleware(request);
  if (csrfError) {
    return csrfError;
  }

  let payload: QuickContactPayload;

  try {
    const body = await request.json();
    const parsed = quickContactSchema.safeParse(body);

    if (!parsed.success) {
      // Generic error message for security
      return NextResponse.json({ message: 'Données invalides.' }, { status: 400 });
    }

    payload = parsed.data;
  } catch {
    return NextResponse.json({ message: 'Données invalides.' }, { status: 400 });
  }

  // Honeypot check - silently succeed for bots
  if (payload.meta.honeypot) {
    return NextResponse.json({ success: true });
  }

  const recipient =
    process.env.CONTACT_FORM_RECIPIENT ??
    process.env.APPOINTMENT_REQUEST_RECIPIENT ??
    'contact@psypnos.fr';
  const content = formatEmailContent(payload);

  try {
    // Send email to recipient
    await sendEmailThroughResend(content, recipient, payload.email);

    // Send confirmation to user
    try {
      const fullName = `${payload.firstName} ${payload.lastName}`;
      await sendEmailThroughResend(
        {
          subject: 'Votre message a bien été reçu - Psypnos',
          text: `Bonjour ${fullName},\n\nMerci pour votre message. Je vous répondrai sous 48h.\n\nBien à vous,\nDavid Duquenne\nPsypnos`,
          html: `<!doctype html><html lang="fr"><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0b0b0d;">
            <div style="max-width:600px;margin:0 auto;padding:20px;">
              <h2 style="color:#c7a962;">Message reçu</h2>
              <p>Bonjour ${escapeHtml(fullName)},</p>
              <p>Merci pour votre message. Je vous répondrai sous 48h.</p>
              <p>Bien à vous,<br /><strong>David Duquenne</strong><br />Psypnos</p>
              <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
              <p style="font-size:12px;color:#666;">
                <a href="https://psypnos.fr" style="color:#c7a962;">psypnos.fr</a>
              </p>
            </div>
          </body></html>`,
        },
        payload.email
      );
    } catch (confirmationError) {
      console.error("Échec de l'envoi de la confirmation du formulaire rapide", confirmationError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Échec de l'envoi du formulaire rapide", error);
    return NextResponse.json(
      {
        message: 'Une erreur est survenue. Veuillez réessayer dans quelques instants.',
      },
      { status: 500 }
    );
  }
}
