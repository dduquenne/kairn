'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type HeaderContext =
  | 'home'
  | 'blog-list'
  | 'blog-article'
  | 'appointment'
  | 'seminar'
  | 'privacy'
  | 'login';

interface GlobalHeaderProps {
  context?: HeaderContext;
  showBackButton?: boolean;
}

export function GlobalHeader({ context = 'home', showBackButton = false }: GlobalHeaderProps) {
  // Déterminer quel bouton afficher comme primaire selon le contexte
  const isPrimaryAppointment =
    context === 'seminar' || context === 'blog-list' || context === 'blog-article';
  const isPrimarySeminar =
    context === 'appointment' || context === 'blog-list' || context === 'blog-article';
  const hideCtaButtons = context === 'login';

  // Texte de navigation selon le contexte
  const getNavText = (): { show: boolean; text?: string; href: string; icon?: boolean } => {
    switch (context) {
      case 'blog-article':
        return { show: true, text: 'Articles', href: '/blog', icon: true };
      case 'blog-list':
        return { show: true, text: 'Psypnos', href: '/', icon: false };
      case 'appointment':
      case 'seminar':
      case 'privacy':
        return { show: true, text: 'Psypnos', href: '/', icon: false };
      default:
        return { show: false, href: '/' };
    }
  };

  const navInfo = getNavText();

  // Déterminer si on est sur la page d'accueil
  const isHomePage = context === 'home';

  return (
    <header
      className={`from-night via-night to-night/95 sticky top-0 z-40 bg-gradient-to-r backdrop-blur-md ${
        isHomePage ? 'border-gold/20 border-b' : ''
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 py-2 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between gap-8">
          {/* Gauche: Logo + Texte */}
          <Link
            href="/"
            className={`group flex min-w-0 items-center gap-4 rounded-lg ${
              isHomePage
                ? 'focus:ring-gold focus:ring-offset-night focus:outline-none focus:ring-2 focus:ring-offset-2'
                : ''
            }`}
          >
            <div>
              <img
                src="/images/David_Duquenne.webp"
                alt="David Duquenne - Psychothérapie et Hypnose"
                className="fade-mask h-24 w-24"
              />
              <h2 className="text-gold text-sm font-medium">David Duquenne</h2>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-ivory text-4xl text-lg font-semibold leading-tight sm:text-4xl lg:text-2xl">
                Accueillir ce qui est. Explorer ce qui vient.
              </h1>
              <p className="text-ivory/70 mt-1 text-xs">
                Traversez les crises, réveillez votre sagesse intérieure et redonnez du sens à votre
                vie.
              </p>
            </div>
          </Link>

          {/* Mobile menu toggle */}
          <div className="sm:hidden">
            {showBackButton && context === 'blog-article' ? (
              <Link
                href="/blog"
                className={`text-ivory/70 hover:bg-gold/10 hover:text-gold inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  isHomePage
                    ? 'focus:ring-gold focus:ring-offset-night focus:outline-none focus:ring-2 focus:ring-offset-2'
                    : ''
                }`}
                title="Retour aux articles"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/"
                className={`text-gold hover:text-gold/80 rounded text-lg font-semibold transition ${
                  isHomePage
                    ? 'focus:ring-gold focus:ring-offset-night focus:outline-none focus:ring-2 focus:ring-offset-2'
                    : ''
                }`}
                title="Retour à l'accueil"
              >
                Psypnos
              </Link>
            )}
          </div>

          {/* Droite: Navigation + CTA */}
          <div className="hidden flex-shrink-0 items-center gap-4 sm:flex">
            {/* Navigation */}
            {navInfo.show && navInfo.text && (
              <>
                {navInfo.icon ? (
                  <Link
                    href={navInfo.href}
                    className={`text-ivory/70 hover:bg-gold/10 hover:text-gold inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                      isHomePage
                        ? 'focus:ring-gold focus:ring-offset-night focus:outline-none focus:ring-2 focus:ring-offset-2'
                        : ''
                    }`}
                    title={navInfo.text}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>{navInfo.text}</span>
                  </Link>
                ) : (
                  <Link
                    href={navInfo.href}
                    className={`text-ivory/70 hover:text-gold rounded text-sm font-semibold transition ${
                      isHomePage
                        ? 'focus:ring-gold focus:ring-offset-night focus:outline-none focus:ring-2 focus:ring-offset-2'
                        : ''
                    }`}
                    title={navInfo.text}
                  >
                    ← {navInfo.text}
                  </Link>
                )}
              </>
            )}

            {/* CTA Buttons - Masqués sur la page de login */}
            {!hideCtaButtons && (
              <div
                className={`flex items-center gap-2 pl-4 ${isHomePage ? 'border-gold/20 border-l' : ''}`}
              >
                <Link
                  href="/demande-rendez-vous"
                  className={`focus:ring-gold focus:ring-offset-night rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isPrimaryAppointment
                      ? 'bg-gold/20 text-gold hover:bg-gold/30'
                      : 'bg-gold/10 text-gold hover:bg-gold/20'
                  }`}
                >
                  Rendez-vous
                </Link>
                <Link
                  href="/inscription-seminaire"
                  className={`focus:ring-gold focus:ring-offset-night rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isPrimarySeminar
                      ? 'bg-gold/20 text-gold hover:bg-gold/30'
                      : 'bg-gold/10 text-gold hover:bg-gold/20'
                  }`}
                >
                  Séminaire
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile subtitle */}
        <div className="mt-4 text-center sm:hidden">
          <h1 className="text-ivory text-sm font-semibold leading-tight">
            Accueillir ce qui est. Explorer ce qui vient.
          </h1>
          <p className="text-ivory/70 mt-1 text-[11px]">
            Traversez les crises, réveillez votre sagesse intérieure et redonnez du sens à votre
            vie.
          </p>
        </div>

        {/* Mobile CTA Buttons */}
        {!hideCtaButtons && (
          <div className="mt-4 flex gap-2 sm:hidden">
            <Link
              href="/demande-rendez-vous"
              className={`focus:ring-gold focus:ring-offset-night flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isPrimaryAppointment
                  ? 'bg-gold/20 text-gold hover:bg-gold/30'
                  : 'bg-gold/10 text-gold hover:bg-gold/20'
              }`}
            >
              RDV
            </Link>
            <Link
              href="/inscription-seminaire"
              className={`focus:ring-gold focus:ring-offset-night flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isPrimarySeminar
                  ? 'bg-gold/20 text-gold hover:bg-gold/30'
                  : 'bg-gold/10 text-gold hover:bg-gold/20'
              }`}
            >
              Séminaire
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
