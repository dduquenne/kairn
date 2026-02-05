'use client';

/**
 * GeoPage wrapper for Psypnos
 *
 * This wrapper adapts the legacy GeoPage interface to use the shared
 * GeoPage component from @kairn/ui while maintaining backwards compatibility.
 */
import { GeoPage as SharedGeoPage } from '@kairn/ui';
import Link from 'next/link';

import { Footer } from './Footer';
import { NavigationMenu } from './NavigationMenu';

// Legacy interface (for backwards compatibility)
export interface BreadcrumbItem {
  name: string;
  href: string;
}

export interface GeoPageProps {
  // SEO and content
  title: string;
  subtitle: string;
  description: string;
  service: 'psychotherapie' | 'hypnose' | 'respiration';
  location: {
    city: string;
    department?: string;
    region?: string;
  };
  // Breadcrumb
  breadcrumbItems: BreadcrumbItem[];
  // Main content
  mainContent: string;
  benefits: string[];
  // Research and statistics
  researchStats?: Array<{
    stat: string;
    description: string;
    source: string;
    sourceUrl?: string;
  }>;
  // Practical information
  practicalInfo: {
    distance: string;
    duration: string;
    directions: string;
  };
  // Related links
  relatedLinks: Array<{
    label: string;
    href: string;
  }>;
  // Schema JSON-LD
  schemaData: object;
}

// Service labels and links
const serviceLabels: Record<GeoPageProps['service'], string> = {
  psychotherapie: 'Psychothérapie',
  hypnose: 'Hypnose ericksonienne',
  respiration: 'Respiration holotropique',
};

const serviceLinks: Record<GeoPageProps['service'], string> = {
  psychotherapie: '/psychotherapie',
  hypnose: '/hypnose',
  respiration: '/respiration-holotropique',
};

// Default pricing for Psypnos
const defaultPricing = [
  { label: 'Séance standard', price: '70 €' },
  {
    label: 'Tarif solidaire',
    price: '40-50 €',
    note: "* Tarif solidaire sur justificatif (étudiant, demandeur d'emploi, etc.)",
  },
];

// Default hours
const defaultHours = [
  { days: 'Lun-Ven', hours: '9h-19h' },
  { days: 'Sam', hours: '9h-17h' },
];

// Research stats section component
function ResearchStatsSection({
  researchStats,
}: {
  researchStats: NonNullable<GeoPageProps['researchStats']>;
}) {
  return (
    <section className="border-ivory/10 bg-night/30 rounded-2xl border p-6">
      <h3 className="font-display text-gold-accessible mb-6 text-xl font-semibold">
        Ce que dit la recherche
      </h3>

      <div className="space-y-6">
        {researchStats.map((research, index) => (
          <div key={index} className="border-ivory/10 border-b pb-6 last:border-b-0 last:pb-0">
            <div className="mb-2 flex items-start gap-3">
              <span className="text-gold mt-0.5 flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <p className="text-gold text-2xl font-bold">{research.stat}</p>
            </div>
            <p className="text-ivory/80 mb-2 ml-9">{research.description}</p>
            {research.sourceUrl ? (
              <a
                href={research.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ivory/50 hover:text-gold ml-9 inline-flex items-center gap-1.5 text-xs transition-colors"
              >
                Source : {research.source}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            ) : (
              <p className="text-ivory/50 ml-9 text-xs">Source : {research.source}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * GeoPage component wrapper for Psypnos
 *
 * Maintains backwards compatibility with the legacy interface while using
 * the shared GeoPage component from @kairn/ui.
 */
export function GeoPage({
  title,
  subtitle,
  description,
  service,
  location,
  breadcrumbItems,
  mainContent,
  benefits,
  researchStats,
  practicalInfo,
  relatedLinks,
  schemaData,
}: GeoPageProps) {
  // Build extended main content with research stats if provided
  const extendedMainContent = researchStats && researchStats.length > 0 ? mainContent : mainContent;

  return (
    <>
      <SharedGeoPage
        title={title}
        subtitle={subtitle}
        description={description}
        service={{
          type: service,
          label: serviceLabels[service],
          href: serviceLinks[service],
        }}
        location={location}
        breadcrumbItems={breadcrumbItems}
        baseUrl="https://psypnos.fr"
        mainContent={extendedMainContent}
        benefits={benefits}
        practicalInfo={practicalInfo}
        contactInfo={{
          address: "Le Moulin d'en Bas",
          city: 'Saint-Julien-du-Sault',
          postalCode: '89330',
          hours: defaultHours,
        }}
        pricing={defaultPricing}
        relatedLinks={relatedLinks}
        mapsEmbedUrl="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2696.123456789!2d3.2917!3d48.0324!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sLe%20Moulin%20d'en%20Bas%2C%2089330%20Saint-Julien-du-Sault!5e0!3m2!1sfr!2sfr!4v1234567890"
        schemaData={schemaData}
        navigationSlot={<NavigationMenu />}
        footerSlot={<Footer />}
        linkComponent={Link}
        colors={{
          primary: 'gold',
          background: 'night',
          text: 'ivory',
          border: 'ivory',
        }}
        ctaHref="/demande-rendez-vous"
        ctaLabel="Demander un RDV"
        ctaSubtext={`Séance de ${serviceLabels[service].toLowerCase()} à Saint-Julien-du-Sault, accessible depuis ${location.city}`}
      />
      {/* Render research stats separately as it's not in the shared component */}
      {researchStats && researchStats.length > 0 && (
        <div className="bg-night pb-16">
          <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
            <div className="lg:col-span-2 lg:pr-12">
              <ResearchStatsSection researchStats={researchStats} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GeoPage;
