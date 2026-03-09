'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface BlogHeaderProps {
  showBackButton?: boolean;
  currentPage?: 'list' | 'article';
  showBorder?: boolean;
}

export function BlogHeader({
  showBackButton = false,
  currentPage = 'list',
  showBorder = false,
}: BlogHeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`from-night via-night to-night/95 shadow-night/50 sticky top-0 z-40 bg-gradient-to-r shadow-lg backdrop-blur-md ${
        showBorder ? 'border-gold/20 border-b' : ''
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 py-2 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between gap-8">
          {/* Gauche: Logo + Texte */}
          <Link
            href="/"
            className={`group flex min-w-0 items-center gap-4 rounded-lg ${
              showBorder
                ? 'focus:ring-gold focus:ring-offset-night focus:outline-none focus:ring-2 focus:ring-offset-2'
                : ''
            }`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <img
                src="/images/Nathalie_Duquenne.webp"
                alt="Nathalie Duquenne - Psychopatricien"
                className="fade-mask h-24 w-24 transition-transform duration-300 group-hover:scale-105"
              />
              <h2 className="text-gold group-hover:text-gold/80 text-sm font-medium transition-colors">
                Nathalie Duquenne
              </h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden sm:block"
            >
              <h1 className="text-ivory group-hover:text-gold text-4xl text-lg font-semibold leading-tight transition-colors sm:text-4xl lg:text-2xl">
                Accueillir ce qui est. Explorer ce qui vient.
              </h1>
              <p className="text-ivory/70 mt-1 text-xs">
                Traversez les crises, réveillez votre sagesse intérieure et redonnez du sens à votre
                vie.
              </p>
            </motion.div>
          </Link>

          {/* Mobile menu toggle */}
          <div className="sm:hidden">
            {showBackButton ? (
              <Link
                href="/blog"
                className={`text-ivory/70 hover:bg-gold/10 hover:text-gold inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  showBorder
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
                  showBorder
                    ? 'focus:ring-gold focus:ring-offset-night focus:outline-none focus:ring-2 focus:ring-offset-2'
                    : ''
                }`}
                title="Retour à l'accueil"
              >
                Appréciez Votre Vie
              </Link>
            )}
          </div>

          {/* Droite: Navigation + CTA */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="hidden flex-shrink-0 items-center gap-4 sm:flex"
          >
            {/* Navigation */}
            {showBackButton && currentPage === 'article' && (
              <Link
                href="/blog"
                className={`text-ivory/70 hover:bg-gold/10 hover:text-gold inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  showBorder
                    ? 'focus:ring-gold focus:ring-offset-night focus:outline-none focus:ring-2 focus:ring-offset-2'
                    : ''
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
                className={`text-ivory/70 hover:text-gold rounded text-sm font-semibold transition ${
                  showBorder
                    ? 'focus:ring-gold focus:ring-offset-night focus:outline-none focus:ring-2 focus:ring-offset-2'
                    : ''
                }`}
                title="Retour à l'accueil"
              >
                ← Appréciez Votre Vie
              </Link>
            )}

            {/* CTA Buttons */}
            <div
              className={`flex items-center gap-2 pl-4 ${showBorder ? 'border-gold/20 border-l' : ''}`}
            >
              <Link
                href="/demande-rendez-vous"
                className="bg-gold/20 text-gold hover:bg-gold/30 focus:ring-gold focus:ring-offset-night rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                Rendez-vous
              </Link>
              <Link
                href="/inscription-seminaire"
                className="bg-gold/10 text-gold hover:bg-gold/20 focus:ring-gold focus:ring-offset-night rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                Séminaire
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Mobile CTA Buttons */}
        <div className="mt-2 flex gap-2 sm:hidden">
          <Link
            href="/demande-rendez-vous"
            className="bg-gold/20 text-gold hover:bg-gold/30 focus:ring-gold focus:ring-offset-night flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            RDV
          </Link>
          <Link
            href="/inscription-seminaire"
            className="bg-gold/10 text-gold hover:bg-gold/20 focus:ring-gold focus:ring-offset-night flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            Séminaire
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
