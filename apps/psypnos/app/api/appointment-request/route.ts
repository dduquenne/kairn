// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextResponse } from "next/server";
import { z } from "zod";
import { validateCSRFMiddleware } from "../common/csrf-middleware";
import { recordAttempt, getClientIP } from "../common/rate-limiter";

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
  presentiel: "Présentiel à Saint-Julien-du-Sault",
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

/**
 * Échappe les caractères HTML dangereux pour prévenir les injections XSS
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const formatEmailContent = (payload: AppointmentRequestPayload): EmailContent => {
  const submittedAtRaw = payload.meta.submitted_at
    ? new Date(payload.meta.submitted_at)
    : null;
  const submittedAtIso =
    submittedAtRaw && !Number.isNaN(submittedAtRaw.getTime())
      ? submittedAtRaw.toISOString()
      : "Non précisé";

  const text = `Nouvelle demande de rendez-vous Psypnos\n\n` +
    `Nom : ${payload.name}\n` +
    `Email : ${payload.email}\n` +
    `Téléphone : ${payload.phone || "Non précisé"}\n` +
    `Préférence de contact : ${contactPreferenceLabels[payload.contact_preference]}\n` +
    `Motif : ${payload.reason}\n` +
    `Type de séance : ${sessionTypeLabels[payload.session_type]}\n` +
    `Disponibilités : ${payload.availability || "Non précisées"}\n` +
    `Origine : ${referralLabels[payload.referral]}\n` +
    `Consentement : ${payload.consent ? "Oui" : "Non"}\n` +
    `Soumis le : ${submittedAtIso}`;

  // SÉCURITÉ : Échapper tout le contenu HTML pour prévenir les injections XSS
  const escapedName = escapeHtml(payload.name);
  const escapedEmail = escapeHtml(payload.email);
  const escapedPhone = escapeHtml(payload.phone || "Non précisé");
  const escapedReason = escapeHtml(payload.reason).replace(/\n/g, "<br />");
  const escapedAvailability = escapeHtml(payload.availability || "Non précisées").replace(/\n/g, "<br />");
  const escapedSubmittedAt = escapeHtml(submittedAtIso);

  const html = `<!doctype html><html lang="fr"><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0b0b0d;">` +
    `<h2>Nouvelle demande de rendez-vous Psypnos</h2>` +
    `<p><strong>Nom :</strong> ${escapedName}</p>` +
    `<p><strong>Email :</strong> ${escapedEmail}</p>` +
    `<p><strong>Téléphone :</strong> ${escapedPhone}</p>` +
    `<p><strong>Préférence de contact :</strong> ${contactPreferenceLabels[payload.contact_preference]}</p>` +
    `<p><strong>Motif :</strong><br />${escapedReason}</p>` +
    `<p><strong>Type de séance :</strong> ${sessionTypeLabels[payload.session_type]}</p>` +
    `<p><strong>Disponibilités :</strong><br />${escapedAvailability}</p>` +
    `<p><strong>Origine :</strong> ${referralLabels[payload.referral]}</p>` +
    `<p><strong>Consentement :</strong> ${payload.consent ? "Oui" : "Non"}</p>` +
    `<p><strong>Soumis le :</strong> ${escapedSubmittedAt}</p>` +
    `</body></html>`;

  return {
    subject: "Nouvelle demande de rendez-vous Psypnos",
    text,
    html
  };
};

const sendEmailThroughResend = async (content: EmailContent, to: string, replyTo?: string) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.APPOINTMENT_REQUEST_FROM ?? "Psypnos <no-reply@psypnos.fr>";

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

  const content = formatEmailContent(payload);
  const recipient = process.env.APPOINTMENT_REQUEST_RECIPIENT ?? "contact@psypnos.fr";

  try {
    await sendEmailThroughResend(content, recipient, payload.email);

    try {
      await sendEmailThroughResend(
        {
          subject: "Votre demande de rendez-vous Psypnos",
          text:
            "Bonjour,\n\nMerci pour votre demande de rendez-vous. Je vous recontacte prochainement pour convenir d’un échange.\n\nBien à vous,\nDavid Duquenne",
          html:
            "<!doctype html><html lang=\"fr\"><body style=\"font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0b0b0d;\"><p>Bonjour,</p><p>Merci pour votre demande de rendez-vous. Je vous recontacte prochainement pour convenir d’un échange.</p><p>Bien à vous,<br />Psypnos</p></body></html>"
        },
        payload.email
      );
    } catch (confirmationError) {
      console.error("Échec de l’envoi de la confirmation", confirmationError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Échec de l’envoi de la demande", error);
    return NextResponse.json(
      { message: "Une erreur est survenue. Veuillez réessayer dans quelques instants." },
      { status: 500 }
    );
  }
}
