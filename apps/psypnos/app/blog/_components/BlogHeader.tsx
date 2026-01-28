"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface BlogHeaderProps {
  showBackButton?: boolean;
  currentPage?: "list" | "article";
  showBorder?: boolean;
}

export function BlogHeader({ showBackButton = false, currentPage = "list", showBorder = false }: BlogHeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`sticky top-0 z-40 bg-gradient-to-r from-night via-night to-night/95 backdrop-blur-md shadow-lg shadow-night/50 ${
        showBorder ? "border-b border-gold/20" : ""
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 py-2 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between gap-8">
          {/* Gauche: Logo + Texte */}
          <Link href="/" className={`flex items-center gap-4 min-w-0 group rounded-lg ${
            showBorder ? "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night" : ""
          }`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <img
                src="/images/David_Duquenne.webp"
                alt="David Duquenne - Thérapeute"
                className="h-24 w-24 fade-mask transition-transform duration-300 group-hover:scale-105"
              />
              <h2 className="text-sm text-gold font-medium transition-colors group-hover:text-gold/80">David Duquenne</h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden sm:block"
            >
              <h1 className="text-4xl sm:text-4xl lg:text-2xl text-lg font-semibold text-ivory leading-tight transition-colors group-hover:text-gold">
                Accueillir ce qui est. Explorer ce qui vient.
              </h1>
              <p className="text-xs text-ivory/70 mt-1">
                Traversez les crises, réveillez votre sagesse intérieure et redonnez du sens à votre vie.
              </p>
            </motion.div>
          </Link>

          {/* Mobile menu toggle */}
          <div className="sm:hidden">
            {showBackButton ? (
              <Link
                href="/blog"
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ivory/70 transition hover:bg-gold/10 hover:text-gold ${
                  showBorder ? "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night" : ""
                }`}
                title="Retour aux articles"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/"
                className={`text-lg font-semibold text-gold transition hover:text-gold/80 rounded ${
                  showBorder ? "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night" : ""
                }`}
                title="Retour à l'accueil"
              >
                Psypnos
              </Link>
            )}
          </div>

          {/* Droite: Navigation + CTA */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="hidden sm:flex items-center gap-4 flex-shrink-0"
          >
            {/* Navigation */}
            {showBackButton && currentPage === "article" && (
              <Link
                href="/blog"
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ivory/70 transition hover:bg-gold/10 hover:text-gold ${
                  showBorder ? "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night" : ""
                }`}
                title="Retour aux articles"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Articles</span>
              </Link>
            )}
            {!showBackButton && (
              <Link
                href="/"
                className={`text-sm font-semibold text-ivory/70 transition hover:text-gold rounded ${
                  showBorder ? "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night" : ""
                }`}
                title="Retour à l'accueil"
              >
                ← Psypnos
              </Link>
            )}

            {/* CTA Buttons */}
            <div className={`flex items-center gap-2 pl-4 ${showBorder ? "border-l border-gold/20" : ""}`}>
              <Link
                href="/demande-rendez-vous"
                className="rounded-lg bg-gold/20 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/30 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night"
              >
                Rendez-vous
              </Link>
              <Link
                href="/inscription-seminaire"
                className="rounded-lg bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/20 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night"
              >
                Séminaire
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Mobile CTA Buttons */}
        <div className="sm:hidden flex gap-2 mt-2">
          <Link
            href="/demande-rendez-vous"
            className="flex-1 rounded-lg bg-gold/20 px-3 py-2 text-xs font-medium text-gold text-center transition hover:bg-gold/30 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night"
          >
            RDV
          </Link>
          <Link
            href="/inscription-seminaire"
            className="flex-1 rounded-lg bg-gold/10 px-3 py-2 text-xs font-medium text-gold text-center transition hover:bg-gold/20 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night"
          >
            Séminaire
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
