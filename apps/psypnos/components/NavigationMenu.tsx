'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/psychotherapie', label: 'Psychothérapie' },
  { href: '/hypnose', label: 'Hypnose' },
  { href: '/respiration-holotropique', label: 'Respiration' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/blog', label: 'Blog' },
  { href: '/#contact', label: 'Contact' },
];

interface NavigationMenuProps {
  /** Force la visibilité du menu (utile pour les pages autres que l'accueil) */
  forceVisible?: boolean;
}

export function NavigationMenu({ forceVisible = false }: NavigationMenuProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Track mounting to enable animations only after hydration
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    const handleScroll = () => {
      // Afficher le fond après 100px de scroll
      setIsScrolled(window.scrollY > 100);
    };

    // Vérifier la position initiale
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMounted]);

  // Determine visibility: always visible after mount when forceVisible, or when scrolled
  const showBackground = hasMounted && (isScrolled || forceVisible);
  const isVisible = showBackground;

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          isVisible
            ? 'bg-night/90 border-gold/20 shadow-night/50 translate-y-0 border-b opacity-100 shadow-lg backdrop-blur-md'
            : '-translate-y-full bg-transparent opacity-0'
        }`}
        suppressHydrationWarning
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo à gauche */}
            <Link href="/" className="group flex items-center gap-3">
              <div className="relative">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 600 600"
                  aria-label="Logo Psypnos"
                  className="text-gold transition-transform duration-300 group-hover:scale-110"
                >
                  <circle
                    cx="300"
                    cy="300"
                    r="250"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="30"
                  />
                  <path
                    d="
                      M 300 550
                      a 200,200 0 0 0 200,-200
                      a 180,180 0 0 0 -180,-180
                      a 144,144 0 0 0 -144,144
                      a 100.8,100.8 0 0 0 100.8,100.8
                      a 60.48,60.48 0 0 0 60.48,-60.48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="30"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="text-gold hidden text-xl font-semibold sm:block">Psypnos</span>
            </Link>

            {/* Liens de navigation au centre - Desktop */}
            <div className="hidden items-center gap-1 lg:flex">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-ivory/80 hover:text-gold hover:bg-gold/10 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Bouton CTA à droite - Desktop */}
            <div className="hidden items-center gap-3 lg:flex">
              <Link
                href="/demande-rendez-vous"
                className="text-night hover:shadow-gold/25 focus:ring-gold focus:ring-offset-night inline-flex items-center gap-2 rounded-lg bg-[#C9A86A] px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-105 hover:bg-[#d4b77a] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
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
                Prendre RDV
              </Link>
            </div>

            {/* Menu hamburger - Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-ivory/80 hover:text-gold hover:bg-gold/10 rounded-lg p-2 transition-colors lg:hidden"
              aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Menu mobile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-16 z-40 lg:hidden">
          <div className="bg-night/95 border-gold/20 border-b shadow-xl backdrop-blur-lg">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-1">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-ivory/80 hover:text-gold hover:bg-gold/10 rounded-lg px-4 py-3 text-base font-medium transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}

                {/* CTA Mobile */}
                <div className="border-gold/20 mt-4 border-t pt-4">
                  <Link
                    href="/demande-rendez-vous"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-night flex items-center justify-center gap-2 rounded-lg bg-[#C9A86A] px-5 py-3 text-base font-semibold transition-all duration-200 hover:bg-[#d4b77a]"
                  >
                    <svg
                      className="h-5 w-5"
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
                    Prendre RDV
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay pour fermer le menu mobile */}
      {isMobileMenuOpen && (
        <div
          className="bg-night/50 fixed inset-0 z-30 transition-opacity duration-200 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
