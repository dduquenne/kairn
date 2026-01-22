// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextResponse } from "next/server";
import { z } from "zod";
import { validateCSRFMiddleware } from "../common/csrf-middleware";

import seminarsData from "../../../data/seminars.json";

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

const sexValues = ["homme", "femme", "autre"] as const;

const registrationSchema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  email: z.string().email(),
  phone: z.string().trim().min(10),
  seminarId: z.string().trim().min(1),
  firstTime: z.boolean().default(false),
  precisions: z.string().trim().max(500).optional().transform((value) => value ?? ""),
  newsletterOptIn: z.boolean().optional().default(false),
  consent: z.boolean().refine((value) => value === true),
  birthYear: z.number().int(),
  sex: z.enum(sexValues),
  sexOther: z.string().trim().max(50).optional().transform((value) => value ?? ""),
  addressStreet: z.string().trim().min(3).max(120),
  addressZip: z.string().trim().min(2).max(12),
  addressCity: z.string().trim().min(2).max(80),
  addressCountry: z.string().trim().min(2).max(56),
  emergencyLastName: z.string().trim().min(2).max(60),
  emergencyFirstName: z.string().trim().min(2).max(50),
  emergencyPhone: z.string().trim().min(10),
  hasPriorWork: z.boolean().optional().default(false),
  priorWorkDetails: z.string().trim().max(800).optional().transform((value) => value ?? ""),
  consent_RGPD: z.boolean().refine((value) => value === true)
});

const MIN_RECAPTCHA_SCORE = 0.5;

type SeminarRegistrationPayload = z.infer<typeof registrationSchema>;

type EmailContent = {
  subject: string;
  text: string;
  html: string;
};

type RecaptchaVerificationResponse = {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
};

const formatBoolean = (value: boolean) => (value ? "Oui" : "Non");

const getSeminarById = (id: string) => {
  if (!seminarsData || typeof seminarsData !== "object") {
    return undefined;
  }

  const seminars = (seminarsData as { seminars: Seminar[] }).seminars;
  if (!Array.isArray(seminars)) {
    return undefined;
  }

  return seminars.find((seminar) => seminar.id === id);
};

const formatSeminarDates = (seminar?: Seminar): string => {
  if (!seminar) {
    return "Dates non disponibles";
  }

  const start = new Date(seminar.startAt);
  const end = new Date(seminar.endAt);
  const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const startLabel = dateFormatter.format(start);
  const endLabel = dateFormatter.format(end);

  return startLabel === endLabel ? startLabel : `du ${startLabel} au ${endLabel}`;
};

const formatSeminarDetails = (seminar?: Seminar) => {
  if (!seminar) {
    return {
      title: "Séminaire non référencé",
      dates: "Dates non disponibles",
      description: "",
      speakers: "",
      location: "Non spécifié",
      capacity: 0,
      price: 0,
      deposit: 0,
      order: "Non spécifié"
    };
  }

  const speakers = seminar.speakers?.length
    ? seminar.speakers.map((s) => `${s.firstName} ${s.lastName}`).join(", ")
    : "Non spécifié";

  const location = seminar.tags?.find((tag) => tag.includes("lieu:"))?.replace("lieu:", "") || "Non spécifié";

  return {
    title: seminar.title,
    dates: formatSeminarDates(seminar),
    description: seminar.description || "",
    speakers,
    location,
    capacity: seminar.capacity || 0,
    price: seminar.price || 0,
    deposit: seminar.deposit || 0,
    order: seminar.order || "Psypnos"
  };
};

const formatSeminarWindow = (seminar?: Seminar) => {
  if (!seminar) {
    return "Séminaire non référencé";
  }

  const start = new Date(seminar.startAt);
  const end = new Date(seminar.endAt);
  const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const startLabel = dateFormatter.format(start);
  const endLabel = dateFormatter.format(end);

  return startLabel === endLabel
    ? `${seminar.title} — ${startLabel}`
    : `${seminar.title} — du ${startLabel} au ${endLabel}`;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatAdminEmail = (
  payload: SeminarRegistrationPayload,
  seminar?: Seminar
): EmailContent => {
  const submittedAt = new Date().toISOString();
  const seminarInfo = formatSeminarDetails(seminar);
  const precision = payload.precisions?.trim() ? payload.precisions.trim() : "Non précisées";
  const priorWork = payload.priorWorkDetails?.trim()
    ? payload.priorWorkDetails.trim()
    : "Non précisé";

  const sexLabel =
    payload.sex === "autre" && payload.sexOther
      ? `Autre (${payload.sexOther})`
      : payload.sex.charAt(0).toUpperCase() + payload.sex.slice(1);

  const text =
    `Nouvelle inscription à un séminaire Psypnos\n\n` +
    `═══ INFORMATIONS PARTICIPANT ═══\n` +
    `Identité : ${payload.firstName} ${payload.lastName}\n` +
    `Email : ${payload.email}\n` +
    `Téléphone : ${payload.phone}\n` +
    `Année de naissance : ${payload.birthYear}\n` +
    `Sexe : ${sexLabel}\n` +
    `Adresse : ${payload.addressStreet}, ${payload.addressZip} ${payload.addressCity}, ${payload.addressCountry}\n` +
    `Contact d'urgence : ${payload.emergencyFirstName} ${payload.emergencyLastName} (${payload.emergencyPhone})\n` +
    `\n═══ INFORMATIONS SÉMINAIRE ═══\n` +
    `Titre : ${seminarInfo.title}\n` +
    `Dates : ${seminarInfo.dates}\n` +
    `Lieu : ${seminarInfo.location}\n` +
    `Animateurs : ${seminarInfo.speakers}\n` +
    `Capacité : ${seminarInfo.capacity} personnes\n` +
    `Coût : ${seminarInfo.price}€\n` +
    `Acompte : ${seminarInfo.deposit}€\n` +
    `Ordre chèque : ${seminarInfo.order}\n` +
    `Description : ${seminarInfo.description}\n` +
    `\n═══ DÉTAILS INSCRIPTION ═══\n` +
    `Première participation : ${formatBoolean(payload.firstTime)}\n` +
    `A déjà participé à un stage : ${formatBoolean(payload.hasPriorWork ?? false)}\n` +
    `Détails des stages précédents : ${priorWork}\n` +
    `Précisions supplémentaires : ${precision}\n` +
    `Inscription newsletter : ${formatBoolean(payload.newsletterOptIn ?? false)}\n` +
    `Consentement conditions : ${formatBoolean(payload.consent)}\n` +
    `Consentement RGPD : ${formatBoolean(payload.consent_RGPD)}\n` +
    `Soumis le : ${submittedAt}`;

  const html =
    `<!doctype html><html lang="fr"><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0b0b0d;">` +
    `<h2>Nouvelle inscription à un séminaire Psypnos</h2>` +
    `<h3 style="color:#c7a962;margin-top:1.5em;">Informations du participant</h3>` +
    `<p><strong>Identité :</strong> ${escapeHtml(`${payload.firstName} ${payload.lastName}`)}</p>` +
    `<p><strong>Email :</strong> ${escapeHtml(payload.email)}</p>` +
    `<p><strong>Téléphone :</strong> ${escapeHtml(payload.phone)}</p>` +
    `<p><strong>Année de naissance :</strong> ${payload.birthYear}</p>` +
    `<p><strong>Sexe :</strong> ${escapeHtml(sexLabel)}</p>` +
    `<p><strong>Adresse :</strong><br />${escapeHtml(payload.addressStreet)}<br />` +
    `${escapeHtml(`${payload.addressZip} ${payload.addressCity}`)}<br />${escapeHtml(payload.addressCountry)}</p>` +
    `<p><strong>Contact d'urgence :</strong> ${escapeHtml(`${payload.emergencyFirstName} ${payload.emergencyLastName}`)} — ${escapeHtml(payload.emergencyPhone)}</p>` +
    `<h3 style="color:#c7a962;margin-top:1.5em;">Informations du séminaire</h3>` +
    `<p><strong>Titre :</strong> ${escapeHtml(seminarInfo.title)}</p>` +
    `<p><strong>Dates :</strong> ${escapeHtml(seminarInfo.dates)}</p>` +
    `<p><strong>Lieu :</strong> ${escapeHtml(seminarInfo.location)}</p>` +
    `<p><strong>Animateurs :</strong> ${escapeHtml(seminarInfo.speakers)}</p>` +
    `<p><strong>Capacité :</strong> ${seminarInfo.capacity} personnes</p>` +
    `<p style="background-color:#f5f1e6;border-left:4px solid #c7a962;padding:12px;margin:1em 0;"><strong>Coût :</strong> ${seminarInfo.price}€<br /><strong>Acompte :</strong> ${seminarInfo.deposit}€<br /><strong>Ordre chèque :</strong> ${escapeHtml(seminarInfo.order)}</p>` +
    `<p><strong>Description :</strong><br />${escapeHtml(seminarInfo.description).replace(/\n/g, "<br />")}</p>` +
    `<h3 style="color:#c7a962;margin-top:1.5em;">Détails de l'inscription</h3>` +
    `<p><strong>Première participation :</strong> ${formatBoolean(payload.firstTime)}</p>` +
    `<p><strong>A déjà participé à un stage :</strong> ${formatBoolean(payload.hasPriorWork ?? false)}</p>` +
    `<p><strong>Détails des stages précédents :</strong><br />${escapeHtml(priorWork).replace(/\n/g, "<br />")}</p>` +
    `<p><strong>Précisions supplémentaires :</strong><br />${escapeHtml(precision).replace(/\n/g, "<br />")}</p>` +
    `<p><strong>Inscription newsletter :</strong> ${formatBoolean(payload.newsletterOptIn ?? false)}</p>` +
    `<p><strong>Consentement conditions :</strong> ${formatBoolean(payload.consent)}</p>` +
    `<p><strong>Consentement RGPD :</strong> ${formatBoolean(payload.consent_RGPD)}</p>` +
    `<p><strong>Soumis le :</strong> ${submittedAt}</p>` +
    `</body></html>`;

  return {
    subject: `Nouvelle inscription — ${payload.firstName} ${payload.lastName} pour ${seminarInfo.title}`,
    text,
    html
  };
};

const formatConfirmationEmail = (
  payload: SeminarRegistrationPayload,
  seminar?: Seminar
): EmailContent => {
  const seminarInfo = formatSeminarDetails(seminar);
  const precision = payload.precisions?.trim() ? payload.precisions.trim() : "Non précisé";

  const text =
    `Bonjour ${payload.firstName},\n\n` +
    `Merci pour votre inscription au séminaire Psypnos !\n\n` +
    `═══ INFORMATIONS SÉMINAIRE ═══\n` +
    `Titre : ${seminarInfo.title}\n` +
    `Dates : ${seminarInfo.dates}\n` +
    `Lieu : ${seminarInfo.location}\n` +
    `Animateurs : ${seminarInfo.speakers}\n` +
    `Description : ${seminarInfo.description}\n` +
    `\nNous revenons vers vous rapidement pour confirmer votre participation.\n\n` +
    `═══ CONDITIONS FINANCIÈRES ═══\n` +
    `💰 COÛT TOTAL : ${seminarInfo.price}€\n` +
    `📋 ACOMPTE À ENVOYER : ${seminarInfo.deposit}€ par chèque\n` +
    `✓ Ordre du chèque : ${seminarInfo.order}\n` +
    `📬 Adresse : David Duquenne, Le Moulin d'en Bas, 89330 Saint-Julien-du-Sault\n` +
    `\n═══ RAPPEL DES CONDITIONS ═══\n` +
    `- Règlement de l'acompte (${seminarInfo.deposit}€) par chèque à l'ordre de ${seminarInfo.order}.\n` +
    `- Pour une première inscription, merci d'attendre l'entretien préalable avant d'envoyer l'acompte.\n` +
    `- Annulation entre 15 jours et une semaine avant le séminaire : l'acompte est encaissé.\n` +
    `- Annulation à moins d'une semaine : la totalité (${seminarInfo.price}€) est due (sauf remplacement possible).\n\n` +
    `═══ RÉCAPITULATIF ═══\n` +
    `• Nom : ${payload.firstName} ${payload.lastName}\n` +
    `• Téléphone : ${payload.phone}\n` +
    `• Précisions communiquées : ${precision}\n\n` +
    `Vos informations sont traitées conformément au RGPD et resteront strictement confidentielles.\n\n` +
    `À très bientôt,\nPsypnos`;

  const html =
    `<!doctype html><html lang="fr"><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.7;color:#0b0b0d;">` +
    `<p>Bonjour ${escapeHtml(payload.firstName)},</p>` +
    `<p>Merci pour votre inscription au séminaire Psypnos ! Nous revenons vers vous très rapidement pour confirmer votre participation.</p>` +
    `<h3 style="color:#c7a962;margin-top:1.5em;">Informations du séminaire</h3>` +
    `<p>` +
    `<strong>${escapeHtml(seminarInfo.title)}</strong><br />` +
    `<em>${escapeHtml(seminarInfo.dates)}</em>` +
    `</p>` +
    `<p><strong>Lieu :</strong> ${escapeHtml(seminarInfo.location)}</p>` +
    `<p><strong>Animateurs :</strong> ${escapeHtml(seminarInfo.speakers)}</p>` +
    `<p><strong>Description :</strong><br />${escapeHtml(seminarInfo.description).replace(/\n/g, "<br />")}</p>` +
    `<h3 style="color:#c7a962;margin-top:1.5em;border-bottom:2px solid #c7a962;padding-bottom:0.5em;">Conditions Financières</h3>` +
    `<div style="background-color:#f5f1e6;border-left:4px solid #c7a962;padding:1em;margin:1em 0;border-radius:4px;">` +
    `<p style="margin:0.5em 0;"><strong style="font-size:1.2em;color:#c7a962;">💰 Coût total du séminaire : ${seminarInfo.price}€</strong></p>` +
    `<p style="margin:0.5em 0;"><strong style="font-size:1.1em;color:#0b0b0d;">📋 Acompte à envoyer : ${seminarInfo.deposit}€</strong></p>` +
    `<p style="margin:0.5em 0;"><em>Paiement par chèque à l'ordre de : <strong>${escapeHtml(seminarInfo.order)}</strong></em></p>` +
    `<p style="margin:0.5em 0;"><em>À adresser à : David Duquenne – Le Moulin d'en Bas – 89330 Saint-Julien-du-Sault</em></p>` +
    `</div>` +
    `<h3 style="color:#c7a962;margin-top:1.5em;">Rappel des conditions d'inscription</h3>` +
    `<ul>` +
    `<li>Versement de l'acompte (<strong>${seminarInfo.deposit}€</strong>) par chèque à l'ordre de <strong>${escapeHtml(seminarInfo.order)}</strong>, à envoyer à David Duquenne – Le Moulin d'en Bas – 89330 Saint-Julien-du-Sault.</li>` +
    `<li>Pour une première inscription, merci d'attendre l'entretien préalable avant d'expédier l'acompte.</li>` +
    `<li>Annulation entre 15 jours et une semaine avant le séminaire : l'acompte est encaissé.</li>` +
    `<li>Annulation à moins d'une semaine : la totalité du séminaire (<strong>${seminarInfo.price}€</strong>) est due (sauf remplacement possible).</li>` +
    `</ul>` +
    `<h3 style="color:#c7a962;margin-top:1.5em;">Récapitulatif de votre inscription</h3>` +
    `<ul>` +
    `<li><strong>Nom :</strong> ${escapeHtml(`${payload.firstName} ${payload.lastName}`)}</li>` +
    `<li><strong>Téléphone :</strong> ${escapeHtml(payload.phone)}</li>` +
    `<li><strong>Séminaire :</strong> ${escapeHtml(seminarInfo.title)}</li>` +
    `<li><strong>Précisions :</strong> ${escapeHtml(precision)}</li>` +
    `</ul>` +
    `<p style="margin-top:1.5em;font-size:0.9em;color:#666;">Vos informations sont traitées dans le respect du RGPD et resteront strictement confidentielles.</p>` +
    `<p>À très bientôt,<br /><strong>Psypnos</strong></p>` +
    `</body></html>`;

  return {
    subject: `Confirmation de votre inscription — ${seminarInfo.title}`,
    text,
    html
  };
};

const sendEmailThroughResend = async (content: EmailContent, to: string, replyTo?: string) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress =
    process.env.SEMINAR_REGISTRATION_FROM ??
    process.env.APPOINTMENT_REQUEST_FROM ??
    "Psypnos <no-reply@psypnos.fr>";

  if (!apiKey) {
    throw new Error("Le service d'envoi d'e-mails n'est pas configuré.");
  }

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
    })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.message || "L'envoi de l'e-mail a échoué.";
    throw new Error(message);
  }
};

const verifyRecaptchaToken = async (token: string) => {
  const secret = process.env.RECAPTCHA_SECRET_KEY ?? process.env.RECAPTCHA_SERVER_SECRET;

  if (!secret) {
    // SECURITY: Fail closed - reject requests if reCAPTCHA is not configured
    // This prevents attackers from bypassing protection by removing the secret
    console.error("SECURITY: La clé secrète reCAPTCHA est absente. Rejet de la requête.");
    return false;
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({ secret, response: token })
    });

    if (!response.ok) {
      return false;
    }

    const result = (await response.json()) as RecaptchaVerificationResponse;
    if (!result.success) {
      return false;
    }

    if (typeof result.score === "number" && result.score < MIN_RECAPTCHA_SCORE) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("recaptcha-verification-error", error);
    return false;
  }
};

export async function POST(request: Request) {
  // Valider le token CSRF
  const csrfError = await validateCSRFMiddleware(request);
  if (csrfError) {
    return csrfError;
  }

  const recaptchaToken =
    (request.headers.get("x-recaptcha-token") ?? request.headers.get("X-ReCaptcha-Token") ?? "").trim();

  if (!recaptchaToken) {
    return NextResponse.json(
      { message: "Le jeton reCAPTCHA est manquant." },
      { status: 400 }
    );
  }

  const isHuman = await verifyRecaptchaToken(recaptchaToken);
  if (!isHuman) {
    return NextResponse.json(
      { message: "La vérification de sécurité a échoué." },
      { status: 400 }
    );
  }

  let payload: SeminarRegistrationPayload;
  try {
    const body = await request.json();
    const parsed = registrationSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const message = firstIssue?.message ?? "Données invalides.";
      return NextResponse.json({ message }, { status: 400 });
    }

    payload = parsed.data;
  } catch (error) {
    return NextResponse.json(
      { message: "Données invalides." },
      { status: 400 }
    );
  }

  const seminar = getSeminarById(payload.seminarId);
  const recipient =
    process.env.SEMINAR_REGISTRATION_RECIPIENT ??
    process.env.APPOINTMENT_REQUEST_RECIPIENT ??
    "contact@psypnos.fr";

  try {
    await sendEmailThroughResend(formatAdminEmail(payload, seminar), recipient, payload.email);

    try {
      await sendEmailThroughResend(formatConfirmationEmail(payload, seminar), payload.email);
    } catch (confirmationError) {
      console.error("Échec de l'envoi de la confirmation du séminaire", confirmationError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Échec de l'envoi du formulaire d'inscription au séminaire", error);
    return NextResponse.json(
      { message: "Une erreur est survenue. Veuillez réessayer dans quelques instants." },
      { status: 500 }
    );
  }
}
