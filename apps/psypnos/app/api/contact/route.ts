import { NextResponse } from 'next/server';
import { z } from 'zod';

import { siteConfig } from '@/config/site.config';

import { validateCSRFMiddleware } from '../common/csrf-middleware';
import {
  buildAdminEmailHtml,
  buildAdminEmailText,
  buildConfirmationEmailHtml,
  buildConfirmationEmailText,
  formatSubmittedAt,
  getEmailBranding,
} from '../common/email-templates';
import { recordAttempt, getClientIP } from '../common/rate-limiter';
import { sendEmailThroughResend, type EmailContent } from '../common/send-email';

const branding = getEmailBranding(siteConfig);

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().trim().min(10).max(5000),
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

type ContactPayload = z.infer<typeof contactSchema>;

const formatAdminEmail = (payload: ContactPayload): EmailContent => {
  const options = {
    heading: 'Nouveau message de contact',
    badge: 'Contact',
    sections: [
      {
        title: 'Coordonnées',
        fields: [
          { label: 'Nom', value: payload.name },
          { label: 'Email', value: payload.email, emailLink: true },
          ...(payload.phone ? [{ label: 'Téléphone', value: payload.phone }] : []),
        ],
      },
    ],
    ...(payload.subject ? { subject: payload.subject } : {}),
    messageBlock: {
      label: 'Message',
      content: payload.message,
    },
    metadata: {
      type: 'contact',
      name: payload.name,
      email: payload.email,
      message: payload.message,
      submitted_at: payload.meta.submitted_at ?? new Date().toISOString(),
      source_page: payload.meta.source_page ?? null,
    },
    submittedAt: payload.meta.submitted_at,
    sourcePage: payload.meta.source_page,
  };

  return {
    subject: payload.subject
      ? `[${branding.siteName}] ${payload.subject} — ${payload.name}`
      : `[${branding.siteName}] Message de contact — ${payload.name}`,
    text: buildAdminEmailText(options),
    html: buildAdminEmailHtml(options, branding),
  };
};

const formatConfirmationEmail = (payload: ContactPayload): EmailContent => {
  const options = {
    recipientName: payload.name,
    intro:
      "Merci d'avoir pris le temps de me contacter. Votre message a bien été reçu et je vous répondrai dans les meilleurs délais.",
    recap: {
      title: 'Récapitulatif de votre message',
      fields: [
        { label: 'Nom', value: payload.name },
        { label: 'Email', value: payload.email },
        {
          label: 'Envoyé le',
          value: formatSubmittedAt(payload.meta.submitted_at),
        },
      ],
    },
    closing: 'À très bientôt,',
    signer: `${branding.practitionerName} — ${branding.siteName}`,
  };

  return {
    subject: `Votre message a bien été reçu — ${branding.siteName}`,
    text: buildConfirmationEmailText(options, branding),
    html: buildConfirmationEmailHtml(options, branding),
  };
};

export async function POST(request: Request) {
  // PROTECTION : Rate limiting - 5 messages par minute par IP
  const clientIP = getClientIP(request);
  const rateLimitResult = recordAttempt('contact', clientIP);

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

  // Valider le token CSRF
  const csrfError = await validateCSRFMiddleware(request);
  if (csrfError) {
    return csrfError;
  }

  let payload: ContactPayload;

  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Données invalides.' }, { status: 400 });
    }

    payload = parsed.data;
  } catch {
    return NextResponse.json({ message: 'Données invalides.' }, { status: 400 });
  }

  if (payload.meta.honeypot) {
    return NextResponse.json({ success: true });
  }

  const recipient =
    process.env.CONTACT_FORM_RECIPIENT ??
    process.env.APPOINTMENT_REQUEST_RECIPIENT ??
    branding.contactEmail;
  const adminContent = formatAdminEmail(payload);

  try {
    await sendEmailThroughResend(adminContent, recipient, branding, { replyTo: payload.email });

    try {
      await sendEmailThroughResend(formatConfirmationEmail(payload), payload.email, branding);
    } catch (confirmationError) {
      console.error(
        "Échec de l'envoi de la confirmation du formulaire de contact",
        confirmationError
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Échec de l'envoi du formulaire de contact", error);
    return NextResponse.json(
      {
        message: 'Une erreur est survenue. Veuillez réessayer dans quelques instants.',
      },
      { status: 500 }
    );
  }
}
