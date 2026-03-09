'use client';

/**
 * RelatedServices Component
 *
 * Displays related therapy services for internal SEO linking.
 * Shows complementary services based on the current service type.
 */
import { motion } from 'framer-motion';
import { ArrowRight, Brain, Sparkles, Wind } from 'lucide-react';
import Link from 'next/link';

type ServiceType = 'psychotherapie' | 'somatothérapie' | 'respiration';

interface Service {
  type: ServiceType;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
}

const services: Service[] = [
  {
    type: 'psychotherapie',
    title: 'Sophrologie',
    description:
      'Un accompagnement bienveillant pour traverser les crises de vie, l\'anxiété, le burn-out et retrouver du sens.',
    href: '/sophrologie',
    icon: Brain,
    keywords: ['anxiété', 'dépression', 'burn-out', 'deuil', 'crise de vie'],
  },
  {
    type: 'somatothérapie',
    title: 'Somatothérapie',
    description:
      'Une approche douce pour accéder à vos ressources internes et libérer vos blocages émotionnels.',
    href: '/somatotherapie',
    icon: Sparkles,
    keywords: ['stress', 'phobies', 'confiance en soi', 'changement', 'ressources'],
  },
  {
    type: 'respiration',
    title: 'Breathwork & Rebirth',
    description:
      'Un voyage intérieur puissant pour explorer les états modifiés de conscience et favoriser la transformation.',
    href: '/breathwork',
    icon: Wind,
    keywords: ['transformation', 'conscience', 'guérison', 'exploration', 'libération'],
  },
];

interface RelatedServicesProps {
  currentService: ServiceType;
  variant?: 'default' | 'compact';
  showAll?: boolean;
}

export function RelatedServices({
  currentService,
  variant = 'default',
  showAll = false,
}: RelatedServicesProps) {
  // Filter out current service unless showAll is true
  const displayServices = showAll
    ? services
    : services.filter((s) => s.type !== currentService);

  if (displayServices.length === 0) {
    return null;
  }

  return (
    <section
      className="border-t border-ivory/10 pt-12"
      aria-labelledby="related-services-heading"
    >
      <h2
        id="related-services-heading"
        className="mb-8 text-2xl font-semibold text-ivory"
      >
        {showAll ? 'Nos approches thérapeutiques' : 'Découvrez aussi'}
      </h2>

      <div
        className={`grid gap-6 ${
          variant === 'compact'
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {displayServices.map((service, index) => {
          const Icon = service.icon;
          const isCurrentService = service.type === currentService;

          return (
            <motion.article
              key={service.type}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`group relative overflow-hidden rounded-lg border transition-all ${
                isCurrentService
                  ? 'border-gold/50 bg-gold/10'
                  : 'border-ivory/10 bg-night/30 hover:border-gold/30 hover:bg-night/50'
              }`}
            >
              {/* Gradient accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gold via-gold/50 to-transparent" />

              <Link
                href={service.href}
                className="block p-6 pl-8 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night rounded-lg"
                aria-current={isCurrentService ? 'page' : undefined}
              >
                {/* Icon & Title */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-ivory transition-colors group-hover:text-gold">
                    {service.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="mb-4 text-sm text-ivory/70 leading-relaxed">
                  {service.description}
                </p>

                {/* Keywords */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {service.keywords.slice(0, 3).map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-ivory/5 px-2 py-0.5 text-xs text-ivory/50"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-sm font-medium text-gold transition-all group-hover:gap-3">
                  <span>{isCurrentService ? 'Vous êtes ici' : 'En savoir plus'}</span>
                  {!isCurrentService && <ArrowRight className="h-4 w-4" />}
                </div>
              </Link>
            </motion.article>
          );
        })}
      </div>

      {/* Link to hub page */}
      {!showAll && (
        <div className="mt-8 text-center">
          <Link
            href="/therapies"
            className="inline-flex items-center gap-2 text-sm text-ivory/60 hover:text-gold transition-colors"
          >
            <span>Voir toutes nos approches thérapeutiques</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  );
}

export default RelatedServices;
