'use client';

import { motion } from 'framer-motion';

import { ContactForm } from '../../../components/ContactForm';
import { SectionTitle } from '../../../components/SectionTitle';
import { SocialLinks } from '../../../components/SocialLinks';

export function ContactSection() {
  return (
    <section
      id="contact"
      className="px-6 py-20 sm:px-10 lg:px-16"
      data-track-section="contact"
      data-track-section-name="Contact"
    >
      <div className="mx-auto max-w-4xl space-y-12">
        <SectionTitle
          eyebrow="Contact"
          title="Prêt à explorer davantage ?"
          description="Partagez vos intentions et recevez une réponse chaleureuse sous 48 heures."
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="border-ivory/10 bg-night/40 shadow-night/60 rounded-3xl border p-10 shadow-xl md:col-span-1"
        >
          <ContactForm />
        </motion.div>

        {/* Liens réseaux sociaux */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="mt-10 text-center"
        >
          <p className="text-ivory/60 mb-4 text-sm">
            Suivez-moi sur les réseaux sociaux pour des réflexions et ressources régulières
          </p>
          <SocialLinks variant="stacked" showLabels />
        </motion.div>
      </div>
    </section>
  );
}
