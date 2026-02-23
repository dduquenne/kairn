/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextResponse } from "next/server";
import { z } from "zod";

import { siteConfig } from "@/config/site.config";
import { validateCSRFMiddleware } from "../common/csrf-middleware";
import {
  buildAdminEmailHtml,
  buildAdminEmailText,
  buildConfirmationEmailHtml,
  buildConfirmationEmailText,
  formatSubmittedAt,
  getEmailBranding,
} from "../common/email-templates";
import { recordAttempt, getClientIP } from "../common/rate-limiter";

const branding = getEmailBranding(siteConfig);

const contactPreferenceValues = [
  "",
  "telephone",
  "email",
  "indifferent"
] as const;

const sessionTypeValues = ["", "presentiel", "visio", "indecis"] as const;

const referralValues = [
  "",
  "bouche_a_oreille",
  "internet",
  "reseaux_sociaux",
  "recommandation",
  "conference_atelier",
  "autre"
] as const;

// Regex pour validation téléphone français ou international
const phoneRegex = /^(\+33|0)[1-9](\d{2}){4}$|^\+?\d{10,15}$/;

const requestSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(255),
  phone: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? "")
    .refine((value) => !value || phoneRegex.test(value), {
      message: "Format de téléphone invalide",
    }),
  contact_preference: z.enum(contactPreferenceValues),
  reason: z.string().trim().min(10).max(2000),
  session_type: z.enum(sessionTypeValues),
  availability: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? "")
    .refine((value) => !value || value.length <= 1000, {
      message: "Le champ disponibilités est trop long",
    }),
  referral: z.enum(referralValues),
  consent: z.boolean().refine((value) => value === true),
  meta: z
    .object({
      honeypot: z.string().optional().transform((value) => value?.trim() ?? ""),
      submitted_at: z.string().optional(),
      source_page: z.string().optional()
    })
    .default({ honeypot: "", submitted_at: undefined, source_page: undefined })
});

type AppointmentRequestPayload = z.infer<typeof requestSchema>;

type EmailContent = {
  subject: string;
  text: string;
  html: string;
};

const contactPreferenceLabels: Record<(typeof contactPreferenceValues)[number], string> = {
  "": "Non précisée",
  telephone: "Téléphone",
  email: "E-mail",
  indifferent: "Peu importe"
};

const sessionTypeLabels: Record<(typeof sessionTypeValues)[number], string> = {
  "": "Non précisé",
  presentiel: `Présentiel à ${siteConfig.contact.address.city}`,
  visio: "Visioconférence",
  indecis: "Je ne sais pas encore"
};

const referralLabels: Record<(typeof referralValues)[number], string> = {
  "": "Non précisé",
  bouche_a_oreille: "Bouche à oreille",
  internet: "Recherche Internet",
  reseaux_sociaux: "Réseaux sociaux",
  recommandation: "Recommandation d'un professionnel",
  conference_atelier: "Conférence ou atelier",
  autre: "Autre"
};

const formatAdminEmail = (payload: AppointmentRequestPayload): EmailContent => {
  const options = {
    heading: "Nouvelle demande de rendez-vous",
    badge: "Rendez-vous",
    sections: [
      {
        title: "Coordonnées du demandeur",
        fields: [
          { label: "Nom", value: payload.name },
          { label: "Email", value: payload.email, emailLink: true },
          { label: "Téléphone", value: payload.phone || "Non précisé", phoneLink: !!payload.phone },
          { label: "Préférence de contact", value: contactPreferenceLabels[payload.contact_preference], badge: true },
        ],
      },
      {
        title: "Détails de la demande",
        fields: [
          { label: "Type de séance", value: sessionTypeLabels[payload.session_type], badge: true },
          { label: "Disponibilités", value: payload.availability || "Non précisées" },
          { label: "Comment m'a trouvé", value: referralLabels[payload.referral] },
        ],
      },
    ],
    messageBlock: {
      label: "Motif de la demande",
      content: payload.reason,
    },
    metadata: {
      type: "appointment_request",
      name: payload.name,
      email: payload.email,
      phone: payload.phone || null,
      contact_preference: payload.contact_preference,
      reason: payload.reason,
      session_type: payload.session_type,
      availability: payload.availability || null,
      referral: payload.referral,
      submitted_at: payload.meta.submitted_at ?? new Date().toISOString(),
      source_page: payload.meta.source_page ?? null,
    },
    submittedAt: payload.meta.submitted_at,
    sourcePage: payload.meta.source_page,
  };

  return {
    subject: `[${branding.siteName}] Demande de rendez-vous — ${payload.name}`,
    text: buildAdminEmailText(options),
    html: buildAdminEmailHtml(options, branding),
  };
};

const formatConfirmationEmail = (payload: AppointmentRequestPayload): EmailContent => {
  const options = {
    recipientName: payload.name,
    intro:
      "Merci pour votre demande de rendez-vous. Elle a bien été enregistrée et je vous recontacte prochainement pour convenir d'un échange.",
    sections: [
      {
        title: "Votre demande",
        fields: [
          { label: "Type de séance", value: sessionTypeLabels[payload.session_type] },
          { label: "Contact préféré", value: contactPreferenceLabels[payload.contact_preference] },
          ...(payload.availability ? [{ label: "Disponibilités", value: payload.availability }] : []),
        ],
      },
    ],
    callout: {
      icon: "📋",
      title: "Prochaines étapes",
      lines: [
        "Je prends connaissance de votre demande dans les plus brefs délais.",
        `Je vous recontacte par ${payload.contact_preference === "telephone" ? "téléphone" : payload.contact_preference === "email" ? "e-mail" : "le moyen le plus adapté"} pour fixer un premier échange.`,
        "Cet échange permettra de préciser ensemble vos besoins et le cadre de l'accompagnement.",
      ],
    },
    recap: {
      title: "Vos coordonnées",
      fields: [
        { label: "Nom", value: payload.name },
        { label: "Email", value: payload.email },
        ...(payload.phone ? [{ label: "Téléphone", value: payload.phone }] : []),
        { label: "Envoyé le", value: formatSubmittedAt(payload.meta.submitted_at) },
      ],
    },
    closing: "À très bientôt,",
    signer: `${branding.practitionerName} — ${branding.siteName}`,
  };

  return {
    subject: `Votre demande de rendez-vous — ${branding.siteName}`,
    text: buildConfirmationEmailText(options, branding),
    html: buildConfirmationEmailHtml(options, branding),
  };
};

const sendEmailThroughResend = async (content: EmailContent, to: string, replyTo?: string) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.APPOINTMENT_REQUEST_FROM ?? `${branding.siteName} <no-reply@${branding.domain}>`;

  if (!apiKey) {
    throw new Error("Le service d'envoi d'e-mails n'est pas configuré.");
  }

  // ROBUSTESSE : Timeout de 10 secondes pour éviter le blocage indéfini
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        reply_to: replyTo ? [replyTo] : undefined,
        subject: content.subject,
        text: content.text,
        html: content.html
      }),
      signal: controller.signal
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
  // PROTECTION : Rate limiting - 5 demandes par minute par IP
  const clientIP = getClientIP(request);
  const rateLimitResult = recordAttempt("appointment", clientIP);

  if (rateLimitResult.limited) {
    return NextResponse.json(
      {
        message: "Trop de tentatives. Veuillez réessayer dans quelques instants.",
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  // Valider le token CSRF
  const csrfError = await validateCSRFMiddleware(request);
  if (csrfError) {
    return csrfError;
  }

  let payload: AppointmentRequestPayload;

  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      // SÉCURITÉ : Messages d'erreur génériques pour ne pas révéler la structure des données
      return NextResponse.json({ message: "Données invalides." }, { status: 400 });
    }

    payload = parsed.data;
  } catch (error) {
    return NextResponse.json(
      { message: "Données invalides." },
      { status: 400 }
    );
  }

  if (payload.meta.honeypot) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const adminContent = formatAdminEmail(payload);
  const recipient = process.env.APPOINTMENT_REQUEST_RECIPIENT ?? branding.contactEmail;

  try {
    await sendEmailThroughResend(adminContent, recipient, payload.email);

    try {
      await sendEmailThroughResend(
        formatConfirmationEmail(payload),
        payload.email
      );
    } catch (confirmationError) {
      console.error("Échec de l'envoi de la confirmation", confirmationError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Échec de l'envoi de la demande", error);
    return NextResponse.json(
      { message: "Une erreur est survenue. Veuillez réessayer dans quelques instants." },
      { status: 500 }
    );
  }
}
