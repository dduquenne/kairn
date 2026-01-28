/**
 * Footer enrichi pour le SEO local
 * Contient les informations de localisation, horaires et zone desservie
 */
import Link from 'next/link';
import { CurrentYear } from './CurrentYear';
import { SocialLinks } from './SocialLinks';

// Icônes SVG intégrées pour éviter les dépendances
const MapPinIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-5 w-5"
  >
    <path
      fillRule="evenodd"
      d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
      clipRule="evenodd"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-5 w-5"
  >
    <path
      fillRule="evenodd"
      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
      clipRule="evenodd"
    />
  </svg>
);

const PhoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-5 w-5"
  >
    <path
      fillRule="evenodd"
      d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
      clipRule="evenodd"
    />
  </svg>
);

const MailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-5 w-5"
  >
    <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
    <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-4 w-4"
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
);

// Villes desservies pour le SEO local
const CITIES_SERVED = [
  { name: 'Auxerre', href: '/psychotherapeute-auxerre' },
  { name: 'Sens', href: '/psychotherapeute-sens' },
  { name: 'Joigny', href: '/psychotherapeute-joigny' },
  { name: 'Migennes', href: '/psychotherapeute-migennes' },
];

// Liens rapides vers les services
const SERVICE_LINKS = [
  { name: 'Psychothérapie', href: '/psychotherapie' },
  { name: 'Hypnose', href: '/hypnose' },
  { name: 'Respiration holotropique', href: '/respiration-holotropique' },
  { name: 'Blog', href: '/blog' },
];

// Liens légaux
const LEGAL_LINKS = [
  { name: 'Conditions d\'utilisation', href: '/conditions-utilisation' },
  { name: 'Politique de confidentialité', href: '/politique-de-confidentialite' },
];

export function Footer() {
  return (
    <footer className="border-ivory/10 bg-night border-t">
      {/* Section principale */}
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-10 lg:px-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Colonne 1 : Informations de contact */}
          <div className="space-y-4">
            <h3 className="font-display text-gold text-lg font-semibold">
              Cabinet Psypnos
            </h3>
            <div className="space-y-3">
              {/* Adresse */}
              <a
                href="https://maps.google.com/?q=Le+Moulin+d'en+Bas,+89330+Saint-Julien-du-Sault"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ivory/70 hover:text-gold group flex items-start gap-3 transition-colors"
              >
                <MapPinIcon />
                <span className="text-sm leading-relaxed">
                  Le Moulin d&apos;en Bas
                  <br />
                  89330 Saint-Julien-du-Sault
                  <br />
                  <span className="text-gold/70 group-hover:text-gold inline-flex items-center gap-1 text-xs">
                    Voir sur Google Maps <ExternalLinkIcon />
                  </span>
                </span>
              </a>

              {/* Email */}
              <a
                href="mailto:contact@psypnos.fr"
                className="text-ivory/70 hover:text-gold flex items-center gap-3 transition-colors"
              >
                <MailIcon />
                <span className="text-sm">contact@psypnos.fr</span>
              </a>
            </div>

            {/* Badge localisation */}
            <div className="bg-night/50 border-gold/20 mt-4 rounded-lg border p-3">
              <p className="text-gold text-xs font-medium">
                Psychothérapeute à Saint-Julien-du-Sault (89)
              </p>
              <p className="text-ivory/50 mt-1 text-xs">
                Au service de l&apos;Yonne depuis 2015
              </p>
            </div>
          </div>

          {/* Colonne 2 : Horaires */}
          <div className="space-y-4">
            <h3 className="font-display text-gold text-lg font-semibold">
              Horaires de consultation
            </h3>
            <div className="flex items-start gap-3">
              <ClockIcon />
              <div className="text-ivory/70 space-y-1 text-sm">
                <p>
                  <span className="text-ivory/90">Lundi - Vendredi :</span> 9h - 19h
                </p>
                <p>
                  <span className="text-ivory/90">Samedi :</span> 9h - 17h
                </p>
                <p className="text-ivory/50 mt-2 text-xs">
                  Sur rendez-vous uniquement
                </p>
              </div>
            </div>

            {/* CTA Prendre RDV */}
            <Link
              href="/demande-rendez-vous"
              className="bg-gold hover:bg-gold/90 text-night mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Prendre rendez-vous
            </Link>
          </div>

          {/* Colonne 3 : Zone desservie */}
          <div className="space-y-4">
            <h3 className="font-display text-gold text-lg font-semibold">
              Zone desservie
            </h3>
            <p className="text-ivory/50 text-sm">
              Au service de l&apos;Yonne : Auxerre, Sens, Joigny, Migennes
            </p>
            <ul className="space-y-2">
              {CITIES_SERVED.map(city => (
                <li key={city.href}>
                  <Link
                    href={city.href}
                    className="text-ivory/70 hover:text-gold flex items-center gap-2 text-sm transition-colors"
                  >
                    <span className="bg-gold/20 h-1.5 w-1.5 rounded-full" />
                    Psychothérapeute {city.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/psychotherapeute-yonne"
                  className="text-ivory/70 hover:text-gold flex items-center gap-2 text-sm transition-colors"
                >
                  <span className="bg-gold/20 h-1.5 w-1.5 rounded-full" />
                  Toute l&apos;Yonne (89)
                </Link>
              </li>
            </ul>

            {/* Services hypnose */}
            <div className="border-ivory/10 mt-4 border-t pt-4">
              <p className="text-ivory/50 mb-2 text-xs">Hypnose ericksonienne</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/hypnose-yonne"
                  className="bg-ivory/5 text-ivory/60 hover:text-gold rounded px-2 py-1 text-xs transition-colors"
                >
                  Yonne
                </Link>
                <Link
                  href="/hypnose-auxerre"
                  className="bg-ivory/5 text-ivory/60 hover:text-gold rounded px-2 py-1 text-xs transition-colors"
                >
                  Auxerre
                </Link>
                <Link
                  href="/hypnose-sens"
                  className="bg-ivory/5 text-ivory/60 hover:text-gold rounded px-2 py-1 text-xs transition-colors"
                >
                  Sens
                </Link>
              </div>
            </div>
          </div>

          {/* Colonne 4 : Navigation et social */}
          <div className="space-y-4">
            <h3 className="font-display text-gold text-lg font-semibold">
              Navigation
            </h3>
            <ul className="space-y-2">
              {SERVICE_LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-ivory/70 hover:text-gold text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/contact"
                  className="text-ivory/70 hover:text-gold text-sm transition-colors"
                >
                  Contact & Accès
                </Link>
              </li>
            </ul>

            {/* Réseaux sociaux */}
            <div className="border-ivory/10 mt-6 border-t pt-4">
              <p className="text-ivory/50 mb-3 text-xs">Retrouvez-moi sur les réseaux</p>
              <SocialLinks variant="inline" />
            </div>
          </div>
        </div>
      </div>

      {/* Barre inférieure */}
      <div className="border-ivory/10 bg-night/50 border-t">
        <div className="mx-auto max-w-7xl px-6 py-6 sm:px-10 lg:px-16">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            {/* Copyright */}
            <div className="text-ivory/50 text-center text-xs md:text-left">
              <p>
                © <CurrentYear /> Psypnos - David Duquenne. Tous droits réservés.
              </p>
              <p className="mt-1">
                Psychothérapeute à Saint-Julien-du-Sault • Yonne (89) • Bourgogne
              </p>
            </div>

            {/* Liens légaux */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {LEGAL_LINKS.map((link, index) => (
                <span key={link.href} className="flex items-center gap-4">
                  <Link
                    href={link.href}
                    className="text-ivory/50 hover:text-gold text-xs transition-colors"
                  >
                    {link.name}
                  </Link>
                  {index < LEGAL_LINKS.length - 1 && (
                    <span className="text-ivory/20">|</span>
                  )}
                </span>
              ))}
              <span className="text-ivory/20 hidden md:inline">|</span>
              <Link
                href="/admin"
                className="text-ivory/30 hover:text-ivory/50 text-xs transition-colors"
              >
                Accès privé
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
