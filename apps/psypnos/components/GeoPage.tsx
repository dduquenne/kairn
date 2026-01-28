/**
 * Composant template pour les pages géolocalisées SEO
 * Utilisé pour les pages psychothérapeute-[ville], hypnose-[ville], etc.
 */
import Link from 'next/link';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { NavigationMenu } from './NavigationMenu';
import { Footer } from './Footer';

export interface GeoPageProps {
  // SEO et contenu
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
  // Contenu principal
  mainContent: string;
  benefits: string[];
  // Études et statistiques
  researchStats: Array<{
    stat: string;
    description: string;
    source: string;
    sourceUrl: string;
  }>;
  // Informations pratiques
  practicalInfo: {
    distance: string;
    duration: string;
    directions: string;
  };
  // Liens connexes
  relatedLinks: Array<{
    label: string;
    href: string;
  }>;
  // Schema JSON-LD
  schemaData: object;
}

// Icônes
const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
  </svg>
);

const CarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
  </svg>
);

const serviceLabels = {
  psychotherapie: 'Psychothérapie',
  hypnose: 'Hypnose ericksonienne',
  respiration: 'Respiration holotropique',
};

const serviceLinks = {
  psychotherapie: '/psychotherapie',
  hypnose: '/hypnose',
  respiration: '/respiration-holotropique',
};

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
  return (
    <div className="from-night via-night/95 to-night text-ivory min-h-screen bg-gradient-to-b">
      <NavigationMenu />

      {/* Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} className="mb-8" />

          {/* En-tête */}
          <header className="mb-12">
            <div className="border-gold/30 bg-gold/5 mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5">
              <MapPinIcon />
              <span className="text-gold text-sm font-medium">
                {location.city}{location.department ? ` (${location.department})` : ''}
              </span>
            </div>

            <h1 className="font-display text-gold mb-4 text-4xl font-bold leading-tight md:text-5xl">
              {title}
            </h1>

            <p className="text-ivory/80 mb-6 text-xl">
              {subtitle}
            </p>

            <p className="text-ivory/60 max-w-3xl text-lg leading-relaxed">
              {description}
            </p>
          </header>

          <div className="grid gap-12 lg:grid-cols-3">
            {/* Contenu principal - 2 colonnes */}
            <div className="space-y-10 lg:col-span-2">
              {/* Section principale */}
              <section>
                <h2 className="font-display text-gold mb-6 text-2xl font-bold">
                  {serviceLabels[service]} à {location.city}
                </h2>

                <div className="prose prose-invert prose-gold max-w-none">
                  <div
                    className="text-ivory/80 space-y-4 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: mainContent }}
                  />
                </div>
              </section>

              {/* Bénéfices */}
              <section className="border-ivory/10 bg-night/30 rounded-2xl border p-6">
                <h3 className="font-display mb-4 text-xl font-semibold">
                  Pourquoi consulter ?
                </h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-gold mt-0.5 flex-shrink-0">
                        <CheckIcon />
                      </span>
                      <span className="text-ivory/70">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Études et statistiques */}
              {researchStats.length > 0 && (
                <section>
                  <h3 className="font-display text-gold mb-6 text-xl font-semibold">
                    Ce que dit la recherche scientifique
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2">
                    {researchStats.map((research, index) => (
                      <div
                        key={index}
                        className="border-ivory/10 bg-night/30 relative rounded-xl border p-6"
                      >
                        <div className="text-gold mb-3 text-3xl font-bold">
                          {research.stat}
                        </div>
                        <p className="text-ivory/80 mb-4">
                          {research.description}
                        </p>
                        <footer className="text-ivory/50 text-xs">
                          Source :{' '}
                          <a
                            href={research.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gold/70 hover:text-gold underline transition-colors"
                          >
                            {research.source}
                          </a>
                        </footer>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Carte Google Maps */}
              <section>
                <h3 className="font-display mb-4 text-xl font-semibold">
                  Localisation du cabinet
                </h3>
                <div className="overflow-hidden rounded-xl">
                  <div className="bg-night/50 aspect-video w-full">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2696.123456789!2d3.2917!3d48.0324!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sLe%20Moulin%20d&#39;en%20Bas%2C%2089330%20Saint-Julien-du-Sault!5e0!3m2!1sfr!2sfr!4v1234567890"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Localisation du cabinet pour ${serviceLabels[service]} près de ${location.city}`}
                      className="h-full w-full"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar - 1 colonne */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {/* CTA principal */}
              <div className="border-gold/30 bg-gold/5 rounded-2xl border p-6 text-center">
                <h3 className="font-display text-gold mb-2 text-lg font-semibold">
                  Prendre rendez-vous
                </h3>
                <p className="text-ivory/60 mb-4 text-sm">
                  Séance de {serviceLabels[service].toLowerCase()} à Saint-Julien-du-Sault,
                  accessible depuis {location.city}
                </p>
                <Link
                  href="/demande-rendez-vous"
                  className="bg-gold hover:bg-gold/90 text-night block w-full rounded-lg py-3 font-medium transition-colors"
                >
                  Demander un RDV
                </Link>
                <p className="text-ivory/40 mt-3 text-xs">
                  Réponse sous 24-48h
                </p>
              </div>

              {/* Informations pratiques */}
              <div className="border-ivory/10 bg-night/30 rounded-2xl border p-6">
                <h3 className="font-display mb-4 text-lg font-semibold">
                  Informations pratiques
                </h3>

                <div className="space-y-4">
                  {/* Distance depuis la ville */}
                  <div className="flex items-start gap-3">
                    <span className="text-gold">
                      <CarIcon />
                    </span>
                    <div>
                      <p className="font-medium">Depuis {location.city}</p>
                      <p className="text-ivory/60 text-sm">
                        {practicalInfo.distance} • {practicalInfo.duration}
                      </p>
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className="flex items-start gap-3">
                    <span className="text-gold">
                      <MapPinIcon />
                    </span>
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-ivory/60 text-sm">
                        Le Moulin d&apos;en Bas
                        <br />
                        89330 Saint-Julien-du-Sault
                      </p>
                    </div>
                  </div>

                  {/* Horaires */}
                  <div className="flex items-start gap-3">
                    <span className="text-gold">
                      <ClockIcon />
                    </span>
                    <div>
                      <p className="font-medium">Horaires</p>
                      <p className="text-ivory/60 text-sm">
                        Lun-Ven : 9h-19h
                        <br />
                        Sam : 9h-17h
                      </p>
                    </div>
                  </div>

                  {/* Itinéraire */}
                  <div className="border-ivory/10 mt-4 border-t pt-4">
                    <p className="text-ivory/50 text-xs">
                      {practicalInfo.directions}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tarifs */}
              <div className="border-ivory/10 bg-night/30 rounded-2xl border p-6">
                <h3 className="font-display mb-4 text-lg font-semibold">
                  Tarifs
                </h3>
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-ivory/70">Séance standard</span>
                    <span className="text-gold font-semibold">70 €</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-ivory/70">Tarif solidaire</span>
                    <span className="text-gold font-semibold">40-50 €</span>
                  </div>
                  <p className="text-ivory/40 mt-2 text-xs">
                    * Tarif solidaire sur justificatif (étudiant, demandeur d&apos;emploi, etc.)
                  </p>
                </div>
              </div>

              {/* Liens connexes */}
              <div className="border-ivory/10 bg-night/30 rounded-2xl border p-6">
                <h3 className="font-display mb-4 text-lg font-semibold">
                  Voir aussi
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href={serviceLinks[service]}
                      className="text-ivory/70 hover:text-gold flex items-center gap-2 text-sm transition-colors"
                    >
                      <span className="bg-gold/20 h-1.5 w-1.5 rounded-full" />
                      En savoir plus sur {serviceLabels[service].toLowerCase()}
                    </Link>
                  </li>
                  {relatedLinks.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-ivory/70 hover:text-gold flex items-center gap-2 text-sm transition-colors"
                      >
                        <span className="bg-gold/20 h-1.5 w-1.5 rounded-full" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="/contact"
                      className="text-ivory/70 hover:text-gold flex items-center gap-2 text-sm transition-colors"
                    >
                      <span className="bg-gold/20 h-1.5 w-1.5 rounded-full" />
                      Contact & Accès
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
