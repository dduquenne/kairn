/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextResponse } from "next/server";
import { z } from "zod";

import { validateCSRFMiddleware } from "../common/csrf-middleware";
import { recordAttempt, getClientIP } from "../common/rate-limiter";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(255),
  message: z.string().trim().min(10).max(5000),
  meta: z
    .object({
      honeypot: z.string().optional().transform((value) => value?.trim() ?? ""),
      submitted_at: z.string().optional(),
      source_page: z.string().optional()
    })
    .default({ honeypot: "", submitted_at: undefined, source_page: undefined })
});

type ContactPayload = z.infer<typeof contactSchema>;

type EmailContent = {
  subject: string;
  text: string;
  html: string;
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

const formatEmailContent = (payload: ContactPayload): EmailContent => {
  const submittedAtRaw = payload.meta.submitted_at
    ? new Date(payload.meta.submitted_at)
    : null;
  const submittedAtIso =
    submittedAtRaw && !Number.isNaN(submittedAtRaw.getTime())
      ? submittedAtRaw.toISOString()
      : "Non précisé";

  const text =
    `Nouveau message via le formulaire de contact Psypnos\n\n` +
    `Nom : ${payload.name}\n` +
    `Email : ${payload.email}\n` +
    `Message :\n${payload.message}\n\n` +
    `Soumis le : ${submittedAtIso}\n`;

  // SÉCURITÉ : Échapper tout le contenu HTML pour prévenir les injections XSS
  const escapedName = escapeHtml(payload.name);
  const escapedEmail = escapeHtml(payload.email);
  const escapedMessage = escapeHtml(payload.message).replace(/\n/g, "<br />");
  const escapedSubmittedAt = escapeHtml(submittedAtIso);

  const html =
    `<!doctype html><html lang="fr"><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0b0b0d;">` +
    `<h2>Nouveau message via le formulaire de contact Psypnos</h2>` +
    `<p><strong>Nom :</strong> ${escapedName}</p>` +
    `<p><strong>Email :</strong> ${escapedEmail}</p>` +
    `<p><strong>Message :</strong><br />${escapedMessage}</p>` +
    `<p><strong>Soumis le :</strong> ${escapedSubmittedAt}</p>` +
    `</body></html>`;

  return {
    subject: "Nouveau message de contact Psypnos",
    text,
    html
  };
};

const sendEmailThroughResend = async (content: EmailContent, to: string, replyTo?: string) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress =
    process.env.CONTACT_FORM_FROM ??
    process.env.APPOINTMENT_REQUEST_FROM ??
    "Psypnos <no-reply@psypnos.fr>";

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
  // PROTECTION : Rate limiting - 5 messages par minute par IP
  const clientIP = getClientIP(request);
  const rateLimitResult = recordAttempt("contact", clientIP);

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

  let payload: ContactPayload;

  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      // SÉCURITÉ : Messages d'erreur génériques pour ne pas révéler la structure des données
      return NextResponse.json({ message: "Données invalides." }, { status: 400 });
    }

    payload = parsed.data;
  } catch (error) {
    return NextResponse.json({ message: "Données invalides." }, { status: 400 });
  }

  if (payload.meta.honeypot) {
    return NextResponse.json({ success: true });
  }

  const recipient =
    process.env.CONTACT_FORM_RECIPIENT ??
    process.env.APPOINTMENT_REQUEST_RECIPIENT ??
    "contact@psypnos.fr";
  const content = formatEmailContent(payload);

  try {
    await sendEmailThroughResend(content, recipient, payload.email);

    try {
      await sendEmailThroughResend(
        {
          subject: "Votre message a bien été reçu",
          text:
            "Bonjour,\n\nMerci pour votre message. Je vous réponds dans les plus brefs délais.\n\nBien à vous,\nPsypnos",
          html:
            "<!doctype html><html lang=\"fr\"><body style=\"font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0b0b0d;\"><p>Bonjour,</p><p>Merci pour votre message. Je vous réponds dans les plus brefs délais.</p><p>Bien à vous,<br />Psypnos</p></body></html>"
        },
        payload.email
      );
    } catch (confirmationError) {
      console.error("Échec de l’envoi de la confirmation du formulaire de contact", confirmationError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Échec de l’envoi du formulaire de contact", error);
    return NextResponse.json(
      {
        message: "Une erreur est survenue. Veuillez réessayer dans quelques instants."
      },
      { status: 500 }
    );
  }
}