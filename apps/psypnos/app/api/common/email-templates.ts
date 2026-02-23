/**
 * Shared email templates for Kairn-based sites
 *
 * Provides consistent, branded HTML email layouts that adapt to each site's
 * identity (colors, name, domain, address) via the EmailBranding parameter.
 *
 * Templates:
 * - Admin notification emails (structured for automated processing)
 * - User confirmation emails (informative and visually polished)
 */

import type { SiteConfig } from '@kairn/config';

// ─── Utilities ──────────────────────────────────────────────────────────────

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function nl2br(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br />");
}

function formatDateFr(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(date);
}

export function formatSubmittedAt(isoString?: string): string {
  if (!isoString) return "Non précisé";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "Non précisé";
  return formatDateFr(date);
}

// ─── Types ──────────────────────────────────────────────────────────────────

export type EmailField = {
  label: string;
  value: string;
  /** Show as badge/pill instead of plain text */
  badge?: boolean;
  /** Show value as a clickable email link */
  emailLink?: boolean;
  /** Show value as a clickable phone link */
  phoneLink?: boolean;
};

export type EmailSection = {
  title: string;
  fields: EmailField[];
};

export type EmailCallout = {
  icon?: string;
  title: string;
  lines: string[];
};

export type AdminEmailOptions = {
  /** Email heading */
  heading: string;
  /** Badge text shown next to heading (e.g. "Nouveau") */
  badge?: string;
  /** Structured sections of key-value fields */
  sections: EmailSection[];
  /** Freeform message block (e.g. user's message) */
  messageBlock?: { label: string; content: string };
  /** JSON metadata for automated processing (embedded as hidden comment) */
  metadata?: Record<string, unknown>;
  /** Submission timestamp ISO string */
  submittedAt?: string;
  /** Source page URL */
  sourcePage?: string;
};

export type ConfirmationEmailOptions = {
  /** Recipient first name or full name */
  recipientName: string;
  /** Opening paragraph after greeting */
  intro: string;
  /** Informational sections */
  sections?: EmailSection[];
  /** Highlighted callout box (e.g. financial conditions) */
  callout?: EmailCallout;
  /** Bullet list (e.g. conditions, reminders) */
  bulletList?: { title: string; items: string[] };
  /** Summary recap section */
  recap?: { title: string; fields: EmailField[] };
  /** Closing message */
  closing: string;
  /** Signer name */
  signer: string;
  /** Reference number or identifier */
  reference?: string;
};

// ─── Branding ──────────────────────────────────────────────────────────────

export type EmailBranding = {
  /** Display name of the site (e.g. "Psypnos") */
  siteName: string;
  /** Domain without protocol (e.g. "psypnos.fr") */
  domain: string;
  /** Short tagline built from services (e.g. "Psychothérapie · Hypnose · Respiration Holotropique") */
  tagline: string;
  /** Practitioner's full name (e.g. "David Duquenne") */
  practitionerName: string;
  /** Formatted address line (e.g. "Le Moulin d'en Bas · 89330 Saint-Julien-du-Sault") */
  address: string;
  /** Contact email (e.g. "contact@psypnos.fr") */
  contactEmail: string;
  /** Brand colors */
  colors: {
    /** Primary / accent color (e.g. gold #c7a962) */
    primary: string;
    /** Lighter variant of primary (e.g. gold light #f0d9a3) */
    primaryLight: string;
    /** Dark background / secondary color (e.g. night #0e1f2f) */
    secondary: string;
    /** Light foreground / text-on-dark color (e.g. ivory #f5f1e6) */
    foreground: string;
  };
};

/**
 * Extracts email branding from a Kairn SiteConfig.
 */
export function getEmailBranding(config: SiteConfig): EmailBranding {
  const addr = config.contact.address;
  return {
    siteName: config.name,
    domain: config.domain,
    tagline: config.services
      .filter(s => s.enabled)
      .sort((a, b) => a.order - b.order)
      .map(s => s.name)
      .join(' · '),
    practitionerName: config.practitioner.name,
    address: `${addr.street} · ${addr.postalCode} ${addr.city}`,
    contactEmail: config.contact.email,
    colors: {
      primary: config.theme.colors.primary,
      primaryLight: config.theme.colors.accent,
      secondary: config.theme.colors.secondary,
      foreground: config.theme.colors.foreground,
    },
  };
}

// ─── Resolved Colors ──────────────────────────────────────────────────────

type ResolvedColors = {
  gold: string;
  goldLight: string;
  night: string;
  ivory: string;
  white: string;
  grey50: string;
  grey100: string;
  grey200: string;
  grey400: string;
  grey500: string;
  grey700: string;
  grey900: string;
};

function resolveColors(branding: EmailBranding): ResolvedColors {
  return {
    gold: branding.colors.primary,
    goldLight: branding.colors.primaryLight,
    night: branding.colors.secondary,
    ivory: branding.colors.foreground,
    white: "#ffffff",
    grey50: "#f9fafb",
    grey100: "#f3f4f6",
    grey200: "#e5e7eb",
    grey400: "#9ca3af",
    grey500: "#6b7280",
    grey700: "#374151",
    grey900: "#111827",
  };
}

const FONT_STACK = "'Inter', 'Helvetica Neue', Arial, Helvetica, sans-serif";

// ─── Admin Email Template ───────────────────────────────────────────────────

function renderAdminField(field: EmailField, c: ResolvedColors): string {
  let valueHtml = escapeHtml(field.value);

  if (field.badge) {
    valueHtml = `<span style="display:inline-block;background:${c.gold};color:${c.night};padding:2px 10px;border-radius:12px;font-size:13px;font-weight:600;">${valueHtml}</span>`;
  } else if (field.emailLink) {
    valueHtml = `<a href="mailto:${escapeHtml(field.value)}" style="color:${c.gold};text-decoration:none;">${valueHtml}</a>`;
  } else if (field.phoneLink) {
    const tel = field.value.replace(/\s/g, "");
    valueHtml = `<a href="tel:${escapeHtml(tel)}" style="color:${c.gold};text-decoration:none;">${valueHtml}</a>`;
  }

  return (
    `<tr>` +
    `<td style="padding:10px 14px;border-bottom:1px solid ${c.grey200};color:${c.grey500};font-size:13px;white-space:nowrap;vertical-align:top;width:160px;">${escapeHtml(field.label)}</td>` +
    `<td style="padding:10px 14px;border-bottom:1px solid ${c.grey200};color:${c.grey900};font-size:14px;vertical-align:top;">${valueHtml}</td>` +
    `</tr>`
  );
}

function renderAdminSection(section: EmailSection, c: ResolvedColors): string {
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">` +
    `<tr><td style="padding:8px 14px;background:${c.night};color:${c.gold};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-radius:6px 6px 0 0;">${escapeHtml(section.title)}</td></tr>` +
    `</table>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${c.grey200};border-top:none;border-radius:0 0 6px 6px;">` +
    section.fields.map(f => renderAdminField(f, c)).join("") +
    `</table>`
  );
}

export function buildAdminEmailHtml(options: AdminEmailOptions, branding: EmailBranding): string {
  const c = resolveColors(branding);
  const { heading, badge, sections, messageBlock, metadata, submittedAt, sourcePage } = options;

  const siteNameUpper = branding.siteName.toUpperCase();

  const badgeHtml = badge
    ? ` <span style="display:inline-block;background:${c.gold};color:${c.night};padding:3px 12px;border-radius:12px;font-size:12px;font-weight:700;text-transform:uppercase;vertical-align:middle;margin-left:8px;">${escapeHtml(badge)}</span>`
    : "";

  const sectionsHtml = sections.map(s => renderAdminSection(s, c)).join("");

  const messageBlockHtml = messageBlock
    ? (
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">` +
      `<tr><td style="padding:8px 14px;background:${c.night};color:${c.gold};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-radius:6px 6px 0 0;">${escapeHtml(messageBlock.label)}</td></tr>` +
      `</table>` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${c.grey200};border-top:none;border-radius:0 0 6px 6px;">` +
      `<tr><td style="padding:16px;color:${c.grey900};font-size:14px;line-height:1.7;white-space:pre-wrap;">${nl2br(messageBlock.content)}</td></tr>` +
      `</table>`
    )
    : "";

  const footerParts: string[] = [];
  if (submittedAt) footerParts.push(`Reçu le ${escapeHtml(formatSubmittedAt(submittedAt))}`);
  if (sourcePage) footerParts.push(`Page : ${escapeHtml(sourcePage)}`);

  const footerHtml = footerParts.length > 0
    ? `<p style="margin-top:24px;font-size:12px;color:${c.grey400};border-top:1px solid ${c.grey200};padding-top:16px;">${footerParts.join(" · ")}</p>`
    : "";

  // Metadata for automated processing: embedded as an HTML comment with JSON
  const metadataComment = metadata
    ? `<!-- KAIRN_METADATA_START ${JSON.stringify(metadata)} KAIRN_METADATA_END -->`
    : "";

  return (
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">` +
    `<title>${escapeHtml(heading)}</title></head>` +
    `<body style="margin:0;padding:0;background:${c.grey50};font-family:${FONT_STACK};-webkit-text-size-adjust:100%;">` +
    metadataComment +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.grey50};">` +
    `<tr><td align="center" style="padding:32px 16px;">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${c.white};border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">` +
    // Header bar
    `<tr><td style="background:${c.night};padding:20px 28px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    `<tr>` +
    `<td style="color:${c.gold};font-size:18px;font-weight:700;letter-spacing:0.5px;">${escapeHtml(siteNameUpper)}</td>` +
    `<td align="right" style="color:${c.ivory};font-size:11px;opacity:0.7;">Notification</td>` +
    `</tr></table>` +
    `</td></tr>` +
    // Content
    `<tr><td style="padding:28px;">` +
    `<h1 style="margin:0 0 4px;font-size:20px;color:${c.night};font-weight:700;">${escapeHtml(heading)}${badgeHtml}</h1>` +
    sectionsHtml +
    messageBlockHtml +
    footerHtml +
    `</td></tr>` +
    // Footer bar
    `<tr><td style="background:${c.grey100};padding:14px 28px;text-align:center;">` +
    `<span style="font-size:11px;color:${c.grey400};">${escapeHtml(branding.siteName)} · ${escapeHtml(branding.domain)}</span>` +
    `</td></tr>` +
    `</table>` +
    `</td></tr></table>` +
    `</body></html>`
  );
}

export function buildAdminEmailText(options: AdminEmailOptions): string {
  const { heading, sections, messageBlock, submittedAt, sourcePage } = options;

  const separator = Array(heading.length + 1).join("═");
  const lines: string[] = [heading, separator, ""];

  for (const section of sections) {
    lines.push(`── ${section.title} ──`);
    for (const field of section.fields) {
      lines.push(`${field.label} : ${field.value}`);
    }
    lines.push("");
  }

  if (messageBlock) {
    lines.push(`── ${messageBlock.label} ──`);
    lines.push(messageBlock.content);
    lines.push("");
  }

  if (submittedAt) lines.push(`Reçu le : ${formatSubmittedAt(submittedAt)}`);
  if (sourcePage) lines.push(`Page : ${sourcePage}`);

  return lines.join("\n");
}

// ─── Confirmation Email Template ────────────────────────────────────────────

function renderConfirmationField(field: EmailField, c: ResolvedColors): string {
  return (
    `<tr>` +
    `<td style="padding:8px 12px;color:${c.grey500};font-size:13px;vertical-align:top;width:140px;">${escapeHtml(field.label)}</td>` +
    `<td style="padding:8px 12px;color:${c.night};font-size:14px;font-weight:500;vertical-align:top;">${escapeHtml(field.value)}</td>` +
    `</tr>`
  );
}

function renderConfirmationSection(section: EmailSection, c: ResolvedColors): string {
  return (
    `<h3 style="margin:28px 0 12px;font-size:15px;color:${c.gold};font-weight:700;border-bottom:2px solid ${c.goldLight};padding-bottom:6px;">${escapeHtml(section.title)}</h3>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.grey50};border-radius:8px;">` +
    section.fields.map(f => renderConfirmationField(f, c)).join("") +
    `</table>`
  );
}

export function buildConfirmationEmailHtml(options: ConfirmationEmailOptions, branding: EmailBranding): string {
  const c = resolveColors(branding);
  const { recipientName, intro, sections, callout, bulletList, recap, closing, signer, reference } = options;

  const siteNameUpper = branding.siteName.toUpperCase();
  const siteUrl = `https://${branding.domain}`;

  const sectionsHtml = sections ? sections.map(s => renderConfirmationSection(s, c)).join("") : "";

  const calloutHtml = callout
    ? (
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">` +
      `<tr><td style="background:linear-gradient(135deg,${c.ivory},${c.white});border:1px solid ${c.goldLight};border-left:4px solid ${c.gold};border-radius:0 8px 8px 0;padding:20px;">` +
      (callout.icon ? `<p style="margin:0 0 8px;font-size:20px;">${callout.icon}</p>` : "") +
      `<p style="margin:0 0 10px;font-size:15px;font-weight:700;color:${c.night};">${escapeHtml(callout.title)}</p>` +
      callout.lines.map(line => `<p style="margin:4px 0;font-size:14px;color:${c.grey700};">${escapeHtml(line)}</p>`).join("") +
      `</td></tr></table>`
    )
    : "";

  const bulletListHtml = bulletList
    ? (
      `<h3 style="margin:28px 0 12px;font-size:15px;color:${c.gold};font-weight:700;">${escapeHtml(bulletList.title)}</h3>` +
      `<ul style="margin:0;padding:0 0 0 20px;color:${c.grey700};font-size:14px;line-height:1.8;">` +
      bulletList.items.map(item => `<li style="margin-bottom:6px;">${escapeHtml(item)}</li>`).join("") +
      `</ul>`
    )
    : "";

  const recapHtml = recap
    ? (
      `<h3 style="margin:28px 0 12px;font-size:15px;color:${c.gold};font-weight:700;">${escapeHtml(recap.title)}</h3>` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.grey50};border-radius:8px;">` +
      recap.fields.map(f => renderConfirmationField(f, c)).join("") +
      `</table>`
    )
    : "";

  const referenceHtml = reference
    ? `<p style="margin:0 0 20px;font-size:12px;color:${c.grey400};">Réf. : ${escapeHtml(reference)}</p>`
    : "";

  return (
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">` +
    `<title>Confirmation ${escapeHtml(branding.siteName)}</title></head>` +
    `<body style="margin:0;padding:0;background:${c.grey50};font-family:${FONT_STACK};-webkit-text-size-adjust:100%;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.grey50};">` +
    `<tr><td align="center" style="padding:32px 16px;">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${c.white};border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">` +
    // Header with logo area
    `<tr><td style="background:${c.night};padding:28px;text-align:center;">` +
    `<p style="margin:0;font-size:24px;font-weight:700;color:${c.gold};letter-spacing:1.5px;">${escapeHtml(siteNameUpper)}</p>` +
    `<p style="margin:4px 0 0;font-size:12px;color:${c.ivory};opacity:0.7;letter-spacing:0.5px;">${escapeHtml(branding.tagline)}</p>` +
    `</td></tr>` +
    // Gold accent line
    `<tr><td style="height:3px;background:linear-gradient(90deg,${c.gold},${c.goldLight},${c.gold});"></td></tr>` +
    // Content
    `<tr><td style="padding:32px 28px;">` +
    referenceHtml +
    `<p style="margin:0 0 8px;font-size:17px;color:${c.night};">Bonjour <strong>${escapeHtml(recipientName)}</strong>,</p>` +
    `<p style="margin:0 0 24px;font-size:15px;color:${c.grey700};line-height:1.7;">${escapeHtml(intro)}</p>` +
    sectionsHtml +
    calloutHtml +
    bulletListHtml +
    recapHtml +
    // Closing
    `<p style="margin:28px 0 4px;font-size:15px;color:${c.grey700};line-height:1.7;">${escapeHtml(closing)}</p>` +
    `<p style="margin:4px 0 0;font-size:15px;color:${c.night};font-weight:600;">${escapeHtml(signer)}</p>` +
    `</td></tr>` +
    // Footer
    `<tr><td style="background:${c.ivory};padding:20px 28px;text-align:center;">` +
    `<p style="margin:0 0 6px;font-size:13px;color:${c.night};">` +
    `<a href="${siteUrl}" style="color:${c.gold};text-decoration:none;font-weight:600;">${escapeHtml(branding.domain)}</a>` +
    `</p>` +
    `<p style="margin:0;font-size:11px;color:${c.grey400};line-height:1.5;">` +
    `${escapeHtml(branding.address)}<br />` +
    `Vos données sont traitées conformément au RGPD.` +
    `</p>` +
    `</td></tr>` +
    `</table>` +
    `</td></tr></table>` +
    `</body></html>`
  );
}

export function buildConfirmationEmailText(options: ConfirmationEmailOptions, branding: EmailBranding): string {
  const { recipientName, intro, sections, callout, bulletList, recap, closing, signer, reference } = options;

  const lines: string[] = [];
  if (reference) lines.push(`Réf. : ${reference}`, "");
  lines.push(`Bonjour ${recipientName},`, "", intro, "");

  if (sections) {
    for (const section of sections) {
      lines.push(`── ${section.title} ──`);
      for (const field of section.fields) {
        lines.push(`${field.label} : ${field.value}`);
      }
      lines.push("");
    }
  }

  if (callout) {
    lines.push(`${callout.icon ?? ""} ${callout.title}`.trim());
    for (const line of callout.lines) {
      lines.push(`  ${line}`);
    }
    lines.push("");
  }

  if (bulletList) {
    lines.push(bulletList.title);
    for (const item of bulletList.items) {
      lines.push(`• ${item}`);
    }
    lines.push("");
  }

  if (recap) {
    lines.push(`── ${recap.title} ──`);
    for (const field of recap.fields) {
      lines.push(`${field.label} : ${field.value}`);
    }
    lines.push("");
  }

  lines.push(closing, signer, "", "─────────────────────", `${branding.siteName} · ${branding.domain}`, branding.address);

  return lines.join("\n");
}
