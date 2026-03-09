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
import { generatePreResponse } from '../common/generate-pre-response';
import { recordAttempt, getClientIP } from '../common/rate-limiter';
import { sendEmailThroughResend, type EmailContent } from '../common/send-email';

const branding = getEmailBranding(siteConfig);

const requestTypeValues = ['', 'premiere_consultation', 'question_generale', 'seminaire'] as const;

const phoneRegex = /^(\+33|0)[1-9](\d{2}){4}$|^\+?\d{10,15}$/;

// Supprime espaces, tirets, points et parenthèses pour normaliser un numéro de téléphone
const normalizePhone = (value: string) => value.replace(/[\s.\-()]/g, '');

const quickContactSchema = z.object({
  firstName: z.string().trim().min(2, 'Le prénom est requis').max(50),
  lastName: z.string().trim().min(2, 'Le nom est requis').max(50),
  email: z.string().email('Email invalide').max(255),
  phone: z
    .string()
    .optional()
    .transform(value => normalizePhone(value?.trim() ?? ''))
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

const requestTypeLabels: Record<(typeof requestTypeValues)[number], string> = {
  '': 'Non précisé',
  premiere_consultation: 'Première consultation',
  question_generale: 'Question générale',
  seminaire: 'Séminaire de breathwork & rebirth',
};

const formatAdminEmail = (
  payload: QuickContactPayload,
  preResponse?: { text: string; source: 'ai' | 'fallback' }
): EmailContent => {
  const fullName = `${payload.firstName} ${payload.lastName}`;

  const options = {
    heading: 'Nouvelle demande rapide',
    badge: requestTypeLabels[payload.requestType],
    sections: [
      {
        title: 'Coordonnées',
        fields: [
          { label: 'Nom complet', value: fullName },
          { label: 'Email', value: payload.email, emailLink: true },
          { label: 'Téléphone', value: payload.phone || 'Non précisé', phoneLink: !!payload.phone },
          { label: 'Type de demande', value: requestTypeLabels[payload.requestType], badge: true },
        ],
      },
    ],
    messageBlock: {
      label: 'Message',
      content: payload.message,
    },
    preResponse,
    metadata: {
      type: 'quick_contact',
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      phone: payload.phone || null,
      request_type: payload.requestType,
      message: payload.message,
      consent: payload.consent,
      submitted_at: payload.meta.submitted_at ?? new Date().toISOString(),
      source_page: payload.meta.source_page ?? null,
    },
    submittedAt: payload.meta.submitted_at,
    sourcePage: payload.meta.source_page,
  };

  return {
    subject: `[${branding.siteName}] ${requestTypeLabels[payload.requestType]} — ${fullName}`,
    text: buildAdminEmailText(options),
    html: buildAdminEmailHtml(options, branding),
  };
};

const formatConfirmationEmail = (payload: QuickContactPayload): EmailContent => {
  const fullName = `${payload.firstName} ${payload.lastName}`;

  const options = {
    recipientName: payload.firstName,
    intro:
      "Merci d'avoir pris le temps de me contacter. Votre message a bien été reçu et je vous répondrai sous 48 heures.",
    recap: {
      title: 'Récapitulatif',
      fields: [
        { label: 'Nom', value: fullName },
        { label: 'Email', value: payload.email },
        { label: 'Demande', value: requestTypeLabels[payload.requestType] },
        { label: 'Envoyé le', value: formatSubmittedAt(payload.meta.submitted_at) },
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
    branding.contactEmail;

  const preResponse = await generatePreResponse({
    name: `${payload.firstName} ${payload.lastName}`,
    message: payload.message,
    subject: payload.requestType,
  });

  const adminContent = formatAdminEmail(payload, preResponse);

  try {
    await sendEmailThroughResend(adminContent, recipient, branding, { replyTo: payload.email });

    try {
      await sendEmailThroughResend(formatConfirmationEmail(payload), payload.email, branding);
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
