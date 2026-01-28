import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';
import { NavigationMenu } from '@/components/NavigationMenu';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Contact & Accès | Psychothérapeute Saint-Julien-du-Sault',
  description:
    'Contactez David Duquenne, psychothérapeute à Saint-Julien-du-Sault (89). Cabinet Le Moulin d\'en Bas. Accès depuis Sens, Auxerre, Joigny, Paris. Formulaire de contact et itinéraires.',
  keywords: [
    'contact psychothérapeute Yonne',
    'cabinet psychothérapie Saint-Julien-du-Sault',
    'rdv hypnose Sens',
    'accès cabinet Auxerre',
    'psychothérapeute Joigny contact',
  ],
  openGraph: {
    title: 'Contact & Accès - Cabinet Psypnos',
    description:
      'Prenez rendez-vous avec David Duquenne. Cabinet Le Moulin d\'en Bas à Saint-Julien-du-Sault. Consultations en présentiel et en visioconférence.',
    url: 'https://psypnos.fr/contact',
    type: 'website',
  },
  alternates: {
    canonical: 'https://psypnos.fr/contact',
  },
};

// Schema ContactPage
function generateContactPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': 'https://psypnos.fr/contact',
    name: 'Contact - Psypnos',
    description: 'Page de contact du cabinet Psypnos - David Duquenne',
    url: 'https://psypnos.fr/contact',
    mainEntity: {
      '@type': 'LocalBusiness',
      '@id': 'https://psypnos.fr/#organization',
      name: 'Psypnos - David Duquenne',
      address: {
        '@type': 'PostalAddress',
        streetAddress: "Le Moulin d'en Bas",
        addressLocality: 'Saint-Julien-du-Sault',
        postalCode: '89330',
        addressCountry: 'FR',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 48.0324,
        longitude: 3.2917,
      },
      telephone: '+33 6 XX XX XX XX',
      email: 'contact@psypnos.fr',
    },
  };
}

// Icônes
const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
  </svg>
);

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
    <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
  </svg>
);

const CarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
  </svg>
);

const ParkingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm6 3a.75.75 0 01.75-.75h2.5a2.25 2.25 0 010 4.5h-1.75v1.5a.75.75 0 01-1.5 0V9zm1.5 2.25h1.75a.75.75 0 000-1.5h-1.75v1.5z" clipRule="evenodd" />
  </svg>
);

// Données des itinéraires
const DIRECTIONS = [
  {
    city: 'Sens',
    distance: '25 km',
    duration: '25 min',
    description: 'Depuis Sens, prendre la D606 direction Joigny. À Saint-Julien-du-Sault, suivre les panneaux "Le Moulin".',
    highlight: true,
  },
  {
    city: 'Joigny',
    distance: '12 km',
    duration: '15 min',
    description: 'Depuis Joigny, prendre la D943 direction Sens. Traverser Saint-Julien-du-Sault, le cabinet est à la sortie du village.',
    highlight: true,
  },
  {
    city: 'Auxerre',
    distance: '35 km',
    duration: '40 min',
    description: 'Depuis Auxerre, prendre l\'A6 puis sortie Joigny. Suivre D943 vers Sens jusqu\'à Saint-Julien-du-Sault.',
    highlight: false,
  },
  {
    city: 'Migennes',
    distance: '20 km',
    duration: '25 min',
    description: 'Depuis Migennes, prendre la D943 direction Sens. Le cabinet se trouve à l\'entrée de Saint-Julien-du-Sault.',
    highlight: false,
  },
  {
    city: 'Paris',
    distance: '130 km',
    duration: '1h30',
    description: 'Depuis Paris, prendre l\'A6 direction Lyon. Sortie n°18 "Courtenay", puis suivre Sens et Saint-Julien-du-Sault.',
    highlight: false,
  },
  {
    city: 'Dijon',
    distance: '150 km',
    duration: '1h45',
    description: 'Depuis Dijon, prendre l\'A6 direction Paris. Sortie "Auxerre Sud", puis D965 et D943 jusqu\'à Saint-Julien-du-Sault.',
    highlight: false,
  },
];

export default function ContactPage() {
  return (
    <div className="from-night via-night/95 to-night text-ivory min-h-screen bg-gradient-to-b">
      <NavigationMenu />

      {/* Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateContactPageSchema()) }}
      />

      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[{ name: 'Contact & Accès', href: '/contact' }]}
            className="mb-8"
          />

          {/* En-tête */}
          <header className="mb-12 text-center">
            <h1 className="font-display text-gold mb-4 text-4xl font-bold md:text-5xl">
              Contact & Accès
            </h1>
            <p className="text-ivory/70 mx-auto max-w-2xl text-lg">
              Prenez rendez-vous pour une consultation au cabinet de Saint-Julien-du-Sault
              ou en visioconférence. Je suis à votre écoute.
            </p>
          </header>

          <div className="grid gap-12 lg:grid-cols-2">
            {/* Colonne gauche : Carte et coordonnées */}
            <div className="space-y-8">
              {/* Carte Google Maps */}
              <div className="overflow-hidden rounded-2xl">
                <div className="bg-night/50 aspect-video w-full">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2696.123456789!2d3.2917!3d48.0324!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sLe%20Moulin%20d&#39;en%20Bas%2C%2089330%20Saint-Julien-du-Sault!5e0!3m2!1sfr!2sfr!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Localisation du cabinet Psypnos à Saint-Julien-du-Sault"
                    className="h-full w-full"
                  />
                </div>
                <a
                  href="https://maps.google.com/?q=Le+Moulin+d'en+Bas,+89330+Saint-Julien-du-Sault"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gold/10 hover:bg-gold/20 text-gold flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors"
                >
                  Ouvrir dans Google Maps
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>

              {/* Coordonnées */}
              <div className="border-ivory/10 bg-night/30 space-y-6 rounded-2xl border p-6">
                <h2 className="font-display text-xl font-semibold">Coordonnées</h2>

                <div className="space-y-4">
                  {/* Adresse */}
                  <div className="flex items-start gap-4">
                    <div className="text-gold">
                      <MapPinIcon />
                    </div>
                    <div>
                      <p className="font-medium">Adresse du cabinet</p>
                      <p className="text-ivory/70 text-sm">
                        Le Moulin d&apos;en Bas
                        <br />
                        89330 Saint-Julien-du-Sault
                        <br />
                        Yonne, Bourgogne-Franche-Comté
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className="text-gold">
                      <MailIcon />
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <a
                        href="mailto:contact@psypnos.fr"
                        className="text-ivory/70 hover:text-gold text-sm transition-colors"
                      >
                        contact@psypnos.fr
                      </a>
                    </div>
                  </div>

                  {/* Horaires */}
                  <div className="flex items-start gap-4">
                    <div className="text-gold">
                      <ClockIcon />
                    </div>
                    <div>
                      <p className="font-medium">Horaires de consultation</p>
                      <div className="text-ivory/70 text-sm">
                        <p>Lundi - Vendredi : 9h - 19h</p>
                        <p>Samedi : 9h - 17h</p>
                        <p className="text-ivory/50 mt-1 text-xs">Sur rendez-vous uniquement</p>
                      </div>
                    </div>
                  </div>

                  {/* Parking */}
                  <div className="flex items-start gap-4">
                    <div className="text-gold">
                      <ParkingIcon />
                    </div>
                    <div>
                      <p className="font-medium">Parking</p>
                      <p className="text-ivory/70 text-sm">
                        Parking gratuit et privé sur place
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href="/demande-rendez-vous"
                  className="bg-gold hover:bg-gold/90 text-night mt-4 block w-full rounded-lg py-3 text-center font-medium transition-colors"
                >
                  Prendre rendez-vous
                </Link>
              </div>
            </div>

            {/* Colonne droite : Formulaire de contact */}
            <div className="space-y-8">
              {/* Formulaire */}
              <div className="border-ivory/10 bg-night/30 rounded-2xl border p-6">
                <h2 className="font-display mb-6 text-xl font-semibold">
                  Envoyez-moi un message
                </h2>

                <form className="space-y-4" action="/api/contact" method="POST">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="firstName" className="text-ivory/70 mb-1 block text-sm">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        required
                        className="border-ivory/20 bg-night/50 focus:border-gold focus:ring-gold/20 w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="text-ivory/70 mb-1 block text-sm">
                        Nom *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        required
                        className="border-ivory/20 bg-night/50 focus:border-gold focus:ring-gold/20 w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="text-ivory/70 mb-1 block text-sm">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="border-ivory/20 bg-night/50 focus:border-gold focus:ring-gold/20 w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="text-ivory/70 mb-1 block text-sm">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="border-ivory/20 bg-night/50 focus:border-gold focus:ring-gold/20 w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="text-ivory/70 mb-1 block text-sm">
                      Sujet *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      className="border-ivory/20 bg-night/50 focus:border-gold focus:ring-gold/20 w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2"
                    >
                      <option value="">Choisir un sujet</option>
                      <option value="rdv-psychotherapie">Rendez-vous psychothérapie</option>
                      <option value="rdv-hypnose">Rendez-vous hypnose</option>
                      <option value="info-respiration">Information respiration holotropique</option>
                      <option value="info-seminaire">Inscription séminaire</option>
                      <option value="autre">Autre demande</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="text-ivory/70 mb-1 block text-sm">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      className="border-ivory/20 bg-night/50 focus:border-gold focus:ring-gold/20 w-full resize-none rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2"
                      placeholder="Décrivez brièvement votre demande..."
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="consent"
                      name="consent"
                      required
                      className="border-ivory/20 bg-night/50 text-gold focus:ring-gold/20 mt-1 rounded"
                    />
                    <label htmlFor="consent" className="text-ivory/50 text-xs">
                      J&apos;accepte que mes données soient utilisées pour répondre à ma demande.
                      Voir la{' '}
                      <Link href="/politique-de-confidentialite" className="text-gold hover:underline">
                        politique de confidentialité
                      </Link>
                      .
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="bg-gold hover:bg-gold/90 text-night w-full rounded-lg py-3 font-medium transition-colors"
                  >
                    Envoyer le message
                  </button>
                </form>
              </div>

              {/* Consultation en ligne */}
              <div className="border-gold/20 bg-gold/5 rounded-2xl border p-6">
                <h3 className="font-display text-gold mb-2 font-semibold">
                  Consultation en visioconférence
                </h3>
                <p className="text-ivory/70 mb-4 text-sm">
                  Vous habitez loin ou préférez consulter depuis chez vous ?
                  Je propose également des séances en visioconférence pour la psychothérapie
                  et l&apos;hypnose.
                </p>
                <Link
                  href="/demande-rendez-vous"
                  className="text-gold hover:text-gold/80 inline-flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  Demander une consultation en ligne
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Section Itinéraires */}
          <section className="mt-16">
            <div className="mb-8 text-center">
              <h2 className="font-display text-gold mb-2 text-2xl font-bold">
                Comment venir au cabinet
              </h2>
              <p className="text-ivory/70">
                Itinéraires depuis les principales villes de la région
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DIRECTIONS.map((dir) => (
                <div
                  key={dir.city}
                  className={`rounded-xl border p-5 transition-colors ${
                    dir.highlight
                      ? 'border-gold/30 bg-gold/5'
                      : 'border-ivory/10 bg-night/30'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CarIcon />
                      <h3 className="font-display font-semibold">Depuis {dir.city}</h3>
                    </div>
                    {dir.highlight && (
                      <span className="bg-gold/20 text-gold rounded-full px-2 py-0.5 text-xs">
                        Proche
                      </span>
                    )}
                  </div>
                  <div className="text-ivory/50 mb-2 flex gap-4 text-sm">
                    <span>{dir.distance}</span>
                    <span>•</span>
                    <span>{dir.duration}</span>
                  </div>
                  <p className="text-ivory/70 text-sm">{dir.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section Services locaux */}
          <section className="mt-16">
            <div className="border-ivory/10 bg-night/30 rounded-2xl border p-8">
              <h2 className="font-display text-gold mb-4 text-center text-2xl font-bold">
                Psychothérapeute dans l&apos;Yonne
              </h2>
              <p className="text-ivory/70 mx-auto mb-8 max-w-3xl text-center">
                Le cabinet Psypnos accueille des patients de toute l&apos;Yonne et des départements
                limitrophes. Que vous habitiez à Auxerre, Sens, Joigny, Migennes ou ailleurs
                en Bourgogne, je suis à votre écoute pour vous accompagner.
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/psychotherapeute-yonne"
                  className="bg-ivory/5 hover:bg-ivory/10 rounded-full px-4 py-2 text-sm transition-colors"
                >
                  Psychothérapeute Yonne
                </Link>
                <Link
                  href="/psychotherapeute-auxerre"
                  className="bg-ivory/5 hover:bg-ivory/10 rounded-full px-4 py-2 text-sm transition-colors"
                >
                  Psychothérapeute Auxerre
                </Link>
                <Link
                  href="/psychotherapeute-sens"
                  className="bg-ivory/5 hover:bg-ivory/10 rounded-full px-4 py-2 text-sm transition-colors"
                >
                  Psychothérapeute Sens
                </Link>
                <Link
                  href="/hypnose-yonne"
                  className="bg-ivory/5 hover:bg-ivory/10 rounded-full px-4 py-2 text-sm transition-colors"
                >
                  Hypnose Yonne
                </Link>
                <Link
                  href="/respiration-holotropique-bourgogne"
                  className="bg-ivory/5 hover:bg-ivory/10 rounded-full px-4 py-2 text-sm transition-colors"
                >
                  Respiration holotropique Bourgogne
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
