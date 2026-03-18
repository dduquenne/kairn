'use client';

import Image from 'next/image';
import Link from 'next/link';

import { CTAButton } from '../../../components/CTAButton';

const heroContent = {
  h1: 'Psychothérapie et Hypnose à Saint-Julien-du-Sault (Yonne)',
  slogan1: 'Accueillir ce qui est.',
  slogan2: 'Explorer ce qui vient.',
  subtitle:
    'Traversez les crises, réveillez votre sagesse intérieure et redonnez du sens à votre vie.',
  ctas: {
    primary: 'Prendre un rendez-vous',
    secondary: "S'inscrire à un séminaire",
    tertiary: 'Découvrir mon approche',
  },
};

const heroPractitioner = {
  name: 'David Duquenne',
  headline: 'Psychothérapie & Hypnose',
  address: "Le Moulin d'en Bas – 89330 Saint-Julien du Sault",
  description:
    "Praticien certifié en psychothérapie et en hypnose, je suis spécialisé dans l'accompagnement des personnes traversant des périodes de transition émotionnelle ou psychologique. Qu'il s'agisse de gérer le stress, de surmonter des blocages ou de vivre un deuil, mon approche allie écoute bienveillante et techniques thérapeutiques adaptées à chaque besoin spécifique. Je suis convaincu que chaque individu possède en lui les ressources nécessaires pour évoluer vers un mieux-être, et mon rôle est de vous aider à les découvrir.",
};

/**
 * Hero section — above-the-fold, pas de parallax.
 * Animations CSS légères au lieu de Framer Motion pour éviter
 * les re-renders continus et la cascade de 3.4s.
 */
export function HeroSection() {
  return (
    <header
      className="bg-night relative overflow-hidden px-6 pb-24 pt-24 sm:px-8 lg:px-16"
      aria-label="Introduction"
      data-track-section="hero"
      data-track-section-name="Accueil"
    >
      {/* Static gradient glow effects — pas de parallax */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(199,169,98,0.35),_transparent_70%)]" />
        <div className="absolute right-0 top-40 h-[28rem] w-[28rem] translate-x-1/3 rounded-full bg-[radial-gradient(circle_at_center,_rgba(245,241,230,0.25),_transparent_70%)]" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 text-center">
        {/* Logo + nom — CSS fade-in rapide */}
        <div className="animate-fade-in bg-night/40 flex flex-col items-center justify-center">
          <svg width="100" height="100" viewBox="0 0 600 600" aria-label="Logo spiralé">
            <circle cx="300" cy="300" r="250" fill="none" stroke="#E5C78E" strokeWidth="25" />
            <path
              d="
                M 300 550
                a 200,200 0 0 0 200,-200
                a 180,180 0 0 0 -180,-180
                a 144,144 0 0 0 -144,144
                a 100.8,100.8 0 0 0 100.8,100.8
                a 60.48,60.48 0 0 0 60.48,-60.48"
              fill="none"
              stroke="#E5C78E"
              strokeWidth="25"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-display text-gold text-2xl font-semibold">Psypnos</span>
        </div>

        {/* Titre principal — CSS fade-in avec léger délai */}
        <div className="animate-fade-in-up max-w-3xl [animation-delay:200ms]">
          <h1 className="text-gold-accessible mb-2 text-sm uppercase tracking-[0.3em]">
            {heroContent.h1}
          </h1>
          <h2 className="font-display text-ivory mt-4 text-2xl font-semibold sm:text-3xl lg:text-4xl">
            <span className="block">{heroContent.slogan1}</span>
            <span className="block">{heroContent.slogan2}</span>
          </h2>
          <p className="text-ivory mt-6 text-base sm:text-lg">{heroContent.subtitle}</p>
        </div>

        {/* CTAs — CSS fade-in */}
        <div className="animate-fade-in-up flex flex-col items-center gap-6 [animation-delay:400ms]">
          {/* Boutons principaux */}
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
            <CTAButton variant="primary" href="/demande-rendez-vous">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {heroContent.ctas.primary}
            </CTAButton>
            <CTAButton variant="secondary" href="/inscription-seminaire">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {heroContent.ctas.secondary}
            </CTAButton>
          </div>

          {/* Lien tertiaire */}
          <Link
            href="#approche"
            className="text-ivory hover:text-gold-accessible group inline-flex items-center gap-2 text-sm transition-colors duration-300"
          >
            <span>{heroContent.ctas.tertiary}</span>
            <svg
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </Link>
        </div>

        {/* Praticien — CSS fade-in */}
        <div className="animate-fade-in-up relative flex w-full flex-col items-center justify-center gap-8 overflow-hidden [animation-delay:600ms] lg:flex-row lg:items-start lg:justify-center">
          <Image
            src="/images/David_Duquenne.webp"
            alt="David Duquenne"
            className="fade-mask"
            width={400}
            height={225}
          />
          <div className="max-w-xl text-center lg:text-left">
            <br />
            <br />
            <br />
            <p className="text-gold-accessible mb-2 text-sm uppercase tracking-[0.3em]">
              {heroPractitioner.headline}
            </p>
            <h2 className="text-ivory text-3xl font-semibold sm:text-4xl">
              {heroPractitioner.name}
            </h2>
            <p className="text-gold-accessible mt-6 text-base sm:text-lg">
              {heroPractitioner.address}
            </p>
            <p className="text-ivory mt-4 text-base sm:text-lg">{heroPractitioner.description}</p>
            {/* Liens vers les pratiques */}
            <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-4 lg:justify-start">
              <Link
                href="/a-propos"
                className="text-ivory-muted hover:text-gold-accessible group inline-flex items-center gap-2 text-sm transition-all duration-300"
              >
                <span className="border-ivory/20 bg-ivory/5 group-hover:border-gold/50 group-hover:bg-gold/10 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </span>
                <span className="font-medium">Mon parcours</span>
              </Link>
              <Link
                href="#psychotherapie"
                className="text-ivory-muted hover:text-gold-accessible group inline-flex items-center gap-2 text-sm transition-all duration-300"
              >
                <span className="border-ivory/20 bg-ivory/5 group-hover:border-gold/50 group-hover:bg-gold/10 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                    />
                  </svg>
                </span>
                <span className="font-medium">Psychothérapie</span>
              </Link>
              <Link
                href="#hypnose"
                className="text-ivory-muted hover:text-gold-accessible group inline-flex items-center gap-2 text-sm transition-all duration-300"
              >
                <span className="border-ivory/20 bg-ivory/5 group-hover:border-gold/50 group-hover:bg-gold/10 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                    />
                  </svg>
                </span>
                <span className="font-medium">Hypnose</span>
              </Link>
              <Link
                href="#respiration-holotropique"
                className="text-ivory-muted hover:text-gold-accessible group inline-flex items-center gap-2 text-sm transition-all duration-300"
              >
                <span className="border-ivory/20 bg-ivory/5 group-hover:border-gold/50 group-hover:bg-gold/10 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
                <span className="font-medium">Respiration holotropique</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
