/**
 * Email Templates — Re-exports from @kairn/core
 *
 * This file re-exports the centralized email templates from @kairn/core
 * and provides the site-specific getEmailBranding() helper.
 */

import type { SiteConfig } from '@kairn/config';

// Re-export all templates and utilities from @kairn/core
export {
  escapeHtml,
  nl2br,
  formatSubmittedAt,
  buildAdminEmailHtml,
  buildAdminEmailText,
  buildConfirmationEmailHtml,
  buildConfirmationEmailText,
  type EmailField,
  type EmailSection,
  type EmailCallout,
  type AdminEmailOptions,
  type ConfirmationEmailOptions,
  type EmailBranding,
} from '@kairn/core';

import type { EmailBranding } from '@kairn/core';

/**
 * Extracts email branding from a Kairn SiteConfig.
 *
 * @param config - The site configuration
 * @returns Email branding information for template rendering
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
