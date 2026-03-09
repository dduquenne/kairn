import { NextResponse } from 'next/server';
import { z } from 'zod';

import { siteConfig } from '@/config/site.config';

import seminarsData from '../../../data/seminars.json';
import { validateCSRFMiddleware } from '../common/csrf-middleware';
import {
  buildAdminEmailHtml,
  buildAdminEmailText,
  buildConfirmationEmailHtml,
  buildConfirmationEmailText,
  getEmailBranding,
} from '../common/email-templates';
import { generatePreResponse } from '../common/generate-pre-response';
import { recordAttempt, getClientIP } from '../common/rate-limiter';
import { sendEmailThroughResend, type EmailContent } from '../common/send-email';

const branding = getEmailBranding(siteConfig);

type Seminar = {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  capacity?: number;
  price?: number;
  deposit?: number;
  order?: string;
  speakers?: { firstName: string; lastName: string }[];
  tags?: string[];
};

const sexValues = ['homme', 'femme', 'autre'] as const;

const registrationSchema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  email: z.string().email(),
  phone: z.string().trim().min(10),
  seminarId: z.string().trim().min(1),
  firstTime: z.boolean().default(false),
  precisions: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform(value => value ?? ''),
  newsletterOptIn: z.boolean().optional().default(false),
  consent: z.boolean().refine(value => value === true),
  birthYear: z.number().int(),
  sex: z.enum(sexValues),
  sexOther: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform(value => value ?? ''),
  addressStreet: z.string().trim().min(3).max(120),
  addressZip: z.string().trim().min(2).max(12),
  addressCity: z.string().trim().min(2).max(80),
  addressCountry: z.string().trim().min(2).max(56),
  emergencyLastName: z.string().trim().min(2).max(60),
  emergencyFirstName: z.string().trim().min(2).max(50),
  emergencyPhone: z.string().trim().min(10),
  hasPriorWork: z.boolean().optional().default(false),
  priorWorkDetails: z
    .string()
    .trim()
    .max(800)
    .optional()
    .transform(value => value ?? ''),
  consent_RGPD: z.boolean().refine(value => value === true),
});

type SeminarRegistrationPayload = z.infer<typeof registrationSchema>;

const formatBoolean = (value: boolean) => (value ? 'Oui' : 'Non');

const getSeminarById = (id: string) => {
  if (!seminarsData || typeof seminarsData !== 'object') {
    return undefined;
  }

  const seminars = (seminarsData as { seminars: Seminar[] }).seminars;
  if (!Array.isArray(seminars)) {
    return undefined;
  }

  return seminars.find(seminar => seminar.id === id);
};

const formatSeminarDates = (seminar?: Seminar): string => {
  if (!seminar) {
    return 'Dates non disponibles';
  }

  const start = new Date(seminar.startAt);
  const end = new Date(seminar.endAt);
  const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const startLabel = dateFormatter.format(start);
  const endLabel = dateFormatter.format(end);

  return startLabel === endLabel ? startLabel : `du ${startLabel} au ${endLabel}`;
};

const formatSeminarDetails = (seminar?: Seminar) => {
  if (!seminar) {
    return {
      title: 'Séminaire non référencé',
      dates: 'Dates non disponibles',
      description: '',
      speakers: '',
      location: 'Non spécifié',
      capacity: 0,
      price: 0,
      deposit: 0,
      order: 'Non spécifié',
    };
  }

  const speakers = seminar.speakers?.length
    ? seminar.speakers.map(s => `${s.firstName} ${s.lastName}`).join(', ')
    : 'Non spécifié';

  const location =
    seminar.tags?.find(tag => tag.includes('lieu:'))?.replace('lieu:', '') || 'Non spécifié';

  return {
    title: seminar.title,
    dates: formatSeminarDates(seminar),
    description: seminar.description || '',
    speakers,
    location,
    capacity: seminar.capacity || 0,
    price: seminar.price || 0,
    deposit: seminar.deposit || 0,
    order: seminar.order || branding.siteName,
  };
};

const formatAdminEmail = (
  payload: SeminarRegistrationPayload,
  seminar?: Seminar,
  preResponse?: { text: string; source: 'ai' | 'fallback' }
): EmailContent => {
  const submittedAt = new Date().toISOString();
  const seminarInfo = formatSeminarDetails(seminar);
  const precision = payload.precisions?.trim() ? payload.precisions.trim() : 'Non précisées';
  const priorWork = payload.priorWorkDetails?.trim()
    ? payload.priorWorkDetails.trim()
    : 'Non précisé';

  const sexLabel =
    payload.sex === 'autre' && payload.sexOther
      ? `Autre (${payload.sexOther})`
      : payload.sex.charAt(0).toUpperCase() + payload.sex.slice(1);

  const fullName = `${payload.firstName} ${payload.lastName}`;

  const options = {
    heading: 'Nouvelle inscription séminaire',
    badge: seminarInfo.title,
    sections: [
      {
        title: 'Participant',
        fields: [
          { label: 'Identité', value: fullName },
          { label: 'Email', value: payload.email, emailLink: true },
          { label: 'Téléphone', value: payload.phone, phoneLink: true },
          { label: 'Année de naissance', value: String(payload.birthYear) },
          { label: 'Sexe', value: sexLabel },
          {
            label: 'Adresse',
            value: `${payload.addressStreet}, ${payload.addressZip} ${payload.addressCity}, ${payload.addressCountry}`,
          },
          {
            label: "Contact d'urgence",
            value: `${payload.emergencyFirstName} ${payload.emergencyLastName} — ${payload.emergencyPhone}`,
          },
        ],
      },
      {
        title: 'Séminaire',
        fields: [
          { label: 'Titre', value: seminarInfo.title },
          { label: 'Dates', value: seminarInfo.dates },
          { label: 'Lieu', value: seminarInfo.location },
          { label: 'Animateurs', value: seminarInfo.speakers },
          { label: 'Capacité', value: `${seminarInfo.capacity} personnes` },
          { label: 'Coût', value: `${seminarInfo.price} €` },
          { label: 'Acompte', value: `${seminarInfo.deposit} €` },
          { label: 'Ordre chèque', value: seminarInfo.order },
        ],
      },
      {
        title: 'Inscription',
        fields: [
          { label: 'Première participation', value: formatBoolean(payload.firstTime) },
          { label: 'Stages précédents', value: formatBoolean(payload.hasPriorWork ?? false) },
          { label: 'Détails stages', value: priorWork },
          { label: 'Précisions', value: precision },
          { label: 'Newsletter', value: formatBoolean(payload.newsletterOptIn ?? false) },
          { label: 'Consentement', value: formatBoolean(payload.consent) },
          { label: 'Consentement RGPD', value: formatBoolean(payload.consent_RGPD) },
        ],
      },
    ],
    preResponse,
    metadata: {
      type: 'seminar_registration',
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      birth_year: payload.birthYear,
      sex: payload.sex,
      sex_other: payload.sexOther || null,
      address: {
        street: payload.addressStreet,
        zip: payload.addressZip,
        city: payload.addressCity,
        country: payload.addressCountry,
      },
      emergency_contact: {
        first_name: payload.emergencyFirstName,
        last_name: payload.emergencyLastName,
        phone: payload.emergencyPhone,
      },
      seminar_id: payload.seminarId,
      seminar_title: seminarInfo.title,
      seminar_dates: seminarInfo.dates,
      seminar_price: seminarInfo.price,
      seminar_deposit: seminarInfo.deposit,
      first_time: payload.firstTime,
      has_prior_work: payload.hasPriorWork ?? false,
      prior_work_details: payload.priorWorkDetails || null,
      precisions: payload.precisions || null,
      newsletter_opt_in: payload.newsletterOptIn ?? false,
      submitted_at: submittedAt,
    },
    submittedAt,
  };

  return {
    subject: `[${branding.siteName}] Inscription séminaire — ${fullName} — ${seminarInfo.title}`,
    text: buildAdminEmailText(options),
    html: buildAdminEmailHtml(options, branding),
  };
};

const formatConfirmationEmail = (
  payload: SeminarRegistrationPayload,
  seminar?: Seminar
): EmailContent => {
  const seminarInfo = formatSeminarDetails(seminar);
  const precision = payload.precisions?.trim() ? payload.precisions.trim() : 'Non précisé';
  const fullName = `${payload.firstName} ${payload.lastName}`;

  const options = {
    recipientName: payload.firstName,
    intro: `Merci pour votre inscription au séminaire ${branding.siteName} ! Nous revenons vers vous très rapidement pour confirmer votre participation.`,
    sections: [
      {
        title: 'Informations du séminaire',
        fields: [
          { label: 'Séminaire', value: seminarInfo.title },
          { label: 'Dates', value: seminarInfo.dates },
          { label: 'Lieu', value: seminarInfo.location },
          { label: 'Animateurs', value: seminarInfo.speakers },
          ...(seminarInfo.description
            ? [{ label: 'Description', value: seminarInfo.description }]
            : []),
        ],
      },
    ],
    callout: {
      icon: '💰',
      title: 'Conditions financières',
      lines: [
        `Coût total du séminaire : ${seminarInfo.price} €`,
        `Acompte à envoyer : ${seminarInfo.deposit} € par chèque`,
        `Ordre du chèque : ${seminarInfo.order}`,
        `Adresse d'envoi : ${branding.practitionerName} — ${branding.address.replace(' · ', ' — ')}`,
      ],
    },
    bulletList: {
      title: "Rappel des conditions d'inscription",
      items: [
        `Versement de l'acompte (${seminarInfo.deposit} €) par chèque à l'ordre de ${seminarInfo.order}.`,
        "Pour une première inscription, merci d'attendre l'entretien préalable avant d'envoyer l'acompte.",
        "Annulation entre 15 jours et une semaine avant le séminaire : l'acompte est encaissé.",
        `Annulation à moins d'une semaine : la totalité (${seminarInfo.price} €) est due (sauf remplacement possible).`,
      ],
    },
    recap: {
      title: 'Récapitulatif de votre inscription',
      fields: [
        { label: 'Nom', value: fullName },
        { label: 'Téléphone', value: payload.phone },
        { label: 'Séminaire', value: seminarInfo.title },
        { label: 'Précisions', value: precision },
      ],
    },
    closing: 'À très bientôt,',
    signer: `${branding.practitionerName} — ${branding.siteName}`,
  };

  return {
    subject: `Confirmation de votre inscription — ${seminarInfo.title}`,
    text: buildConfirmationEmailText(options, branding),
    html: buildConfirmationEmailHtml(options, branding),
  };
};

export async function POST(request: Request) {
  // PROTECTION : Rate limiting - 3 inscriptions par minute par IP
  const clientIP = getClientIP(request);
  const rateLimitResult = recordAttempt('registration', clientIP);

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

  let payload: SeminarRegistrationPayload;
  try {
    const body = await request.json();

    // Honeypot check: if the hidden field is filled, return fake success silently
    const honeypot = typeof body?.meta?.honeypot === 'string' ? body.meta.honeypot.trim() : '';
    if (honeypot !== '') {
      return NextResponse.json({ success: true });
    }
    const parsed = registrationSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const message = firstIssue?.message ?? 'Données invalides.';
      return NextResponse.json({ message }, { status: 400 });
    }

    payload = parsed.data;
  } catch {
    return NextResponse.json({ message: 'Données invalides.' }, { status: 400 });
  }

  const seminar = getSeminarById(payload.seminarId);
  const seminarInfo = formatSeminarDetails(seminar);
  const recipient =
    process.env.SEMINAR_REGISTRATION_RECIPIENT ??
    process.env.APPOINTMENT_REQUEST_RECIPIENT ??
    branding.contactEmail;

  // Générer une pré-réponse uniquement si le participant a laissé des précisions
  const preResponse = payload.precisions
    ? await generatePreResponse({
        name: `${payload.firstName} ${payload.lastName}`,
        message: payload.precisions,
        subject: `Inscription séminaire — ${seminarInfo.title}`,
      })
    : undefined;

  try {
    await sendEmailThroughResend(formatAdminEmail(payload, seminar, preResponse), recipient, branding, {
      replyTo: payload.email,
    });

    try {
      await sendEmailThroughResend(
        formatConfirmationEmail(payload, seminar),
        payload.email,
        branding
      );
    } catch (confirmationError) {
      console.error("Échec de l'envoi de la confirmation du séminaire", confirmationError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Échec de l'envoi du formulaire d'inscription au séminaire", error);
    return NextResponse.json(
      { message: 'Une erreur est survenue. Veuillez réessayer dans quelques instants.' },
      { status: 500 }
    );
  }
}
