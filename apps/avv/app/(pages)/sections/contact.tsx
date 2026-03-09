'use client';

import { ContactSection as ContactSectionUI } from '@kairn/ui';

import { ContactForm } from '../../../components/ContactForm';
import { SocialLinks } from '../../../components/SocialLinks';

/**
 * Appréciez Votre Vie contact section wrapper.
 * Provides site-specific form, social links, and labels to the shared @kairn/ui component.
 */
export function ContactSection() {
  return (
    <ContactSectionUI
      title={{
        eyebrow: 'Contact',
        title: 'Prêt à explorer davantage ?',
        description: 'Partagez vos intentions et recevez une réponse chaleureuse sous 48 heures.',
      }}
      contactForm={<ContactForm />}
      socialLinks={<SocialLinks variant="stacked" showLabels />}
      socialLinksLabel="Suivez-moi sur les réseaux sociaux pour des réflexions et ressources régulières"
      trackingName="Contact"
    />
  );
}
