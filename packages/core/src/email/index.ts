/**
 * @kairn/core Email Module
 *
 * Centralized email sending and template management.
 * Provides branded email templates and a Resend-based sending service.
 */

export {
  sendEmail,
  createEmailSender,
  type EmailContent,
  type SendEmailOptions,
  type EmailServiceConfig,
  type SendEmailResult,
} from './send';

export {
  // Template builders
  buildAdminEmailHtml,
  buildAdminEmailText,
  buildConfirmationEmailHtml,
  buildConfirmationEmailText,

  // Utilities
  escapeHtml,
  nl2br,
  formatSubmittedAt,

  // Types
  type EmailField,
  type EmailSection,
  type EmailCallout,
  type AdminEmailOptions,
  type ConfirmationEmailOptions,
  type EmailBranding,
} from './templates';
