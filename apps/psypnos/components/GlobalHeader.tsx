// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type HeaderContext =
  | "home"
  | "blog-list"
  | "blog-article"
  | "appointment"
  | "seminar"
  | "privacy"
  | "login";

interface GlobalHeaderProps {
  context?: HeaderContext;
  showBackButton?: boolean;
}

export function GlobalHeader({ context = "home", showBackButton = false }: GlobalHeaderProps) {
  // Déterminer quel bouton afficher comme primaire selon le contexte
  const isPrimaryAppointment = context === "seminar" || context === "blog-list" || context === "blog-article";
  const isPrimarySeminar = context === "appointment" || context === "blog-list" || context === "blog-article";
  const hideCtaButtons = context === "login";

  // Texte de navigation selon le contexte
  const getNavText = (): { show: boolean; text?: string; href: string; icon?: boolean } => {
    switch (context) {
      case "blog-article":
        return { show: true, text: "Articles", href: "/blog", icon: true };
      case "blog-list":
        return { show: true, text: "Psypnos", href: "/", icon: false };
      case "appointment":
      case "seminar":
      case "privacy":
        return { show: true, text: "Psypnos", href: "/", icon: false };
      default:
        return { show: false, href: "/" };
    }
  };

  const navInfo = getNavText();

  // Déterminer si on est sur la page d'accueil
  const isHomePage = context === "home";

  return (
    <header className={`sticky top-0 z-40 bg-gradient-to-r from-night via-night to-night/95 backdrop-blur-md ${
      isHomePage ? "border-b border-gold/20" : ""
    }`}>
      <div className="mx-auto max-w-7xl px-6 py-2 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between gap-8">
          {/* Gauche: Logo + Texte */}
          <Link href="/" className={`flex items-center gap-4 min-w-0 group rounded-lg ${
            isHomePage ? "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night" : ""
          }`}>
            <div>
              <img
                src="/images/David_Duquenne.webp"
                alt="David Duquenne - Hypnothérapeute"
                className="h-24 w-24 fade-mask"
              />
              <h2 className="text-sm text-gold font-medium">David Duquenne</h2>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-4xl sm:text-4xl lg:text-2xl text-lg font-semibold text-ivory leading-tight">
                Accueillir ce qui est. Explorer ce qui vient.
              </h1>
              <p className="text-xs text-ivory/70 mt-1">
                Traversez les crises, réveillez votre sagesse intérieure et redonnez du sens à votre vie.
              </p>
            </div>
          </Link>

          {/* Mobile menu toggle */}
          <div className="sm:hidden">
            {showBackButton && context === "blog-article" ? (
              <Link
                href="/blog"
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ivory/70 transition hover:bg-gold/10 hover:text-gold ${
                  isHomePage ? "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night" : ""
                }`}
                title="Retour aux articles"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/"
                className={`text-lg font-semibold text-gold transition hover:text-gold/80 rounded ${
                  isHomePage ? "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night" : ""
                }`}
                title="Retour à l'accueil"
              >
                Psypnos
              </Link>
            )}
          </div>

          {/* Droite: Navigation + CTA */}
          <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
            {/* Navigation */}
            {navInfo.show && navInfo.text && (
              <>
                {navInfo.icon ? (
                  <Link
                    href={navInfo.href}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ivory/70 transition hover:bg-gold/10 hover:text-gold ${
                      isHomePage ? "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night" : ""
                    }`}
                    title={navInfo.text}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>{navInfo.text}</span>
                  </Link>
                ) : (
                  <Link
                    href={navInfo.href}
                    className={`text-sm font-semibold text-ivory/70 transition hover:text-gold rounded ${
                      isHomePage ? "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night" : ""
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
              <div className={`flex items-center gap-2 pl-4 ${isHomePage ? "border-l border-gold/20" : ""}`}>
                <Link
                  href="/demande-rendez-vous"
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night ${
                    isPrimaryAppointment
                      ? "bg-gold/20 text-gold hover:bg-gold/30"
                      : "bg-gold/10 text-gold hover:bg-gold/20"
                  }`}
                >
                  Rendez-vous
                </Link>
                <Link
                  href="/inscription-seminaire"
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night ${
                    isPrimarySeminar
                      ? "bg-gold/20 text-gold hover:bg-gold/30"
                      : "bg-gold/10 text-gold hover:bg-gold/20"
                  }`}
                >
                  Séminaire
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile subtitle */}
        <div className="sm:hidden mt-4 text-center">
          <h1 className="text-sm font-semibold text-ivory leading-tight">
            Accueillir ce qui est. Explorer ce qui vient.
          </h1>
          <p className="text-[11px] text-ivory/70 mt-1">
            Traversez les crises, réveillez votre sagesse intérieure et redonnez du sens à votre vie.
          </p>
        </div>

        {/* Mobile CTA Buttons */}
        {!hideCtaButtons && (
          <div className="sm:hidden flex gap-2 mt-4">
            <Link
              href="/demande-rendez-vous"
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium text-center transition focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night ${
                isPrimaryAppointment
                  ? "bg-gold/20 text-gold hover:bg-gold/30"
                  : "bg-gold/10 text-gold hover:bg-gold/20"
              }`}
            >
              RDV
            </Link>
            <Link
              href="/inscription-seminaire"
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium text-center transition focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night ${
                isPrimarySeminar
                  ? "bg-gold/20 text-gold hover:bg-gold/30"
                  : "bg-gold/10 text-gold hover:bg-gold/20"
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
