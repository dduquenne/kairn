'use client';

import type { ReactNode } from 'react';

import { cn } from '../../utils/cn';
import { SectionTitle, type SectionTitleProps } from '../section-title';

/**
 * Props for the ContactSection component
 */
export interface ContactSectionProps {
  /** Section title configuration */
  title?: SectionTitleProps;
  /** Contact form component to render */
  contactForm: ReactNode;
  /** Optional social links component to render below the form */
  socialLinks?: ReactNode;
  /** Social links label text */
  socialLinksLabel?: string;
  /** Analytics tracking section name */
  trackingName?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Contact section with configurable form and social links.
 * The form and social links are injected as children for maximum flexibility.
 *
 * @example
 * ```tsx
 * <ContactSection
 *   title={{
 *     eyebrow: "Contact",
 *     title: "Contactez-nous",
 *     description: "Nous vous répondons sous 48h.",
 *   }}
 *   contactForm={<ContactForm />}
 *   socialLinks={<SocialLinks variant="stacked" />}
 * />
 * ```
 */
export function ContactSection({
  title = {
    eyebrow: 'Contact',
    title: 'Contactez-nous',
    description: 'Nous vous répondons dans les meilleurs délais.',
  },
  contactForm,
  socialLinks,
  socialLinksLabel = 'Suivez-nous sur les réseaux sociaux',
  trackingName = 'Contact',
  className,
}: ContactSectionProps) {
  return (
    <section
      id="contact"
      className={cn('px-6 py-12 sm:px-10 sm:py-20 lg:px-16', className)}
      data-track-section={trackingName.toLowerCase().replace(/\s+/g, '-')}
      data-track-section-name={trackingName}
    >
      <div className="mx-auto max-w-4xl space-y-12">
        <SectionTitle {...title} />

        <div className="border-ivory/10 bg-night/40 shadow-night/60 rounded-3xl border p-10 shadow-xl md:col-span-1">
          {contactForm}
        </div>

        {socialLinks && (
          <div className="mt-10 text-center">
            <p className="text-ivory/60 mb-4 text-sm">{socialLinksLabel}</p>
            {socialLinks}
          </div>
        )}
      </div>
    </section>
  );
}
