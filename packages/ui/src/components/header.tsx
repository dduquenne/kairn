'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { cn } from '../utils/cn';

import { SkipLinks } from './skip-links';

export type HeaderContext =
  | 'home'
  | 'blog-list'
  | 'blog-article'
  | 'appointment'
  | 'seminar'
  | 'privacy'
  | 'login';

export interface HeaderProps {
  /** Context to determine navigation behavior */
  context?: HeaderContext;
  /** Show back button (for article pages) */
  showBackButton?: boolean;
  /** Site name displayed in logo area */
  siteName?: string;
  /** Practitioner name */
  practitionerName?: string;
  /** Practitioner image URL */
  practitionerImage?: string;
  /** Tagline/headline */
  tagline?: string;
  /** Subtitle */
  subtitle?: string;
  /** Primary CTA button config */
  primaryCta?: {
    label: string;
    href: string;
    mobileLabel?: string;
  };
  /** Secondary CTA button config */
  secondaryCta?: {
    label: string;
    href: string;
    mobileLabel?: string;
  };
  /** Custom class name */
  className?: string;
  /** Custom colors */
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
}

export function Header({
  context = 'home',
  showBackButton = false,
  siteName = 'Site',
  practitionerName,
  practitionerImage,
  tagline,
  subtitle,
  primaryCta,
  secondaryCta,
  className,
  colors = {},
}: HeaderProps) {
  const { primary = 'gold', background = 'night', text = 'ivory' } = colors;

  // Determine which button should be highlighted based on context
  const isPrimaryAppointment =
    context === 'seminar' || context === 'blog-list' || context === 'blog-article';
  const isPrimarySeminar =
    context === 'appointment' || context === 'blog-list' || context === 'blog-article';
  const hideCtaButtons = context === 'login';

  // Navigation text based on context
  const getNavText = (): { show: boolean; text?: string; href: string; icon?: boolean } => {
    switch (context) {
      case 'blog-article':
        return { show: true, text: 'Articles', href: '/blog', icon: true };
      case 'blog-list':
        return { show: true, text: siteName, href: '/', icon: false };
      case 'appointment':
      case 'seminar':
      case 'privacy':
        return { show: true, text: siteName, href: '/', icon: false };
      default:
        return { show: false, href: '/' };
    }
  };

  const navInfo = getNavText();
  const isHomePage = context === 'home';

  // Consistent focus styles for accessibility (WCAG 2.1 AA)
  const focusClasses = 'focus-ring focus-visible:outline-none';

  return (
    <>
      {/* Skip Links for keyboard navigation - WCAG 2.1 AA */}
      <SkipLinks />

      <header
        className={cn(
          `sticky top-0 z-40 bg-gradient-to-r from-${background} via-${background} to-${background}/95 backdrop-blur-md`,
          isHomePage && `border-b border-${primary}/20`,
          className
        )}
        role="banner"
      >
        <nav
          id="main-navigation"
          className="mx-auto max-w-7xl px-6 py-2 sm:px-10 lg:px-16"
          aria-label="Navigation principale"
        >
          <div className="flex items-center justify-between gap-8">
            {/* Left: Logo + Text */}
            <Link
              href="/"
              className={cn('group flex min-w-0 items-center gap-4 rounded-lg', focusClasses)}
              aria-label={`Retour à l'accueil - ${siteName}`}
            >
              {practitionerImage && (
                <div>
                  <img
                    src={practitionerImage}
                    alt={practitionerName || 'Practitioner'}
                    className="fade-mask h-24 w-24"
                  />
                  {practitionerName && (
                    <h2 className={`text-sm text-${primary} font-medium`}>{practitionerName}</h2>
                  )}
                </div>
              )}
              {tagline && (
                <div className="hidden sm:block">
                  <h1
                    className={`text-4xl text-lg font-semibold sm:text-4xl lg:text-2xl text-${text} leading-tight`}
                  >
                    {tagline}
                  </h1>
                  {subtitle && <p className={`text-xs text-${text}/70 mt-1`}>{subtitle}</p>}
                </div>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <div className="sm:hidden">
              {showBackButton && context === 'blog-article' ? (
                <Link
                  href="/blog"
                  className={cn(
                    `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-${text}/70 transition hover:bg-${primary}/10 hover:text-${primary}`,
                    focusClasses
                  )}
                  title="Retour aux articles"
                  aria-label="Retour aux articles"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <Link
                  href="/"
                  className={cn(
                    `text-lg font-semibold text-${primary} transition hover:text-${primary}/80 rounded`,
                    focusClasses
                  )}
                  title="Retour à l'accueil"
                  aria-label="Retour à l'accueil"
                >
                  {siteName}
                </Link>
              )}
            </div>

            {/* Right: Navigation + CTA */}
            <div className="hidden flex-shrink-0 items-center gap-4 sm:flex">
              {/* Navigation */}
              {navInfo.show && navInfo.text && (
                <>
                  {navInfo.icon ? (
                    <Link
                      href={navInfo.href}
                      className={cn(
                        `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-${text}/70 transition hover:bg-${primary}/10 hover:text-${primary}`,
                        focusClasses
                      )}
                      title={navInfo.text}
                      aria-label={`Retour à ${navInfo.text}`}
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      <span>{navInfo.text}</span>
                    </Link>
                  ) : (
                    <Link
                      href={navInfo.href}
                      className={cn(
                        `text-sm font-semibold text-${text}/70 transition hover:text-${primary} rounded`,
                        focusClasses
                      )}
                      title={navInfo.text}
                      aria-label={`Retour à ${navInfo.text}`}
                    >
                      <span aria-hidden="true">← </span>
                      {navInfo.text}
                    </Link>
                  )}
                </>
              )}

              {/* CTA Buttons */}
              {!hideCtaButtons && primaryCta && secondaryCta && (
                <div
                  className={cn(
                    'flex items-center gap-2 pl-4',
                    isHomePage && `border-l border-${primary}/20`
                  )}
                >
                  <Link
                    href={primaryCta.href}
                    className={cn(
                      `rounded-lg px-4 py-2 text-sm font-medium transition`,
                      focusClasses,
                      isPrimaryAppointment
                        ? `bg-${primary}/20 text-${primary} hover:bg-${primary}/30`
                        : `bg-${primary}/10 text-${primary} hover:bg-${primary}/20`
                    )}
                  >
                    {primaryCta.label}
                  </Link>
                  <Link
                    href={secondaryCta.href}
                    className={cn(
                      `rounded-lg px-4 py-2 text-sm font-medium transition`,
                      focusClasses,
                      isPrimarySeminar
                        ? `bg-${primary}/20 text-${primary} hover:bg-${primary}/30`
                        : `bg-${primary}/10 text-${primary} hover:bg-${primary}/20`
                    )}
                  >
                    {secondaryCta.label}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile subtitle */}
          {tagline && (
            <div className="mt-4 text-center sm:hidden">
              <h1 className={`text-sm font-semibold text-${text} leading-tight`}>{tagline}</h1>
              {subtitle && <p className={`text-[11px] text-${text}/70 mt-1`}>{subtitle}</p>}
            </div>
          )}

          {/* Mobile CTA Buttons */}
          {!hideCtaButtons && primaryCta && secondaryCta && (
            <div className="mt-4 flex gap-2 sm:hidden">
              <Link
                href={primaryCta.href}
                className={cn(
                  `flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium transition`,
                  focusClasses,
                  isPrimaryAppointment
                    ? `bg-${primary}/20 text-${primary} hover:bg-${primary}/30`
                    : `bg-${primary}/10 text-${primary} hover:bg-${primary}/20`
                )}
              >
                {primaryCta.mobileLabel || primaryCta.label}
              </Link>
              <Link
                href={secondaryCta.href}
                className={cn(
                  `flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium transition`,
                  focusClasses,
                  isPrimarySeminar
                    ? `bg-${primary}/20 text-${primary} hover:bg-${primary}/30`
                    : `bg-${primary}/10 text-${primary} hover:bg-${primary}/20`
                )}
              >
                {secondaryCta.mobileLabel || secondaryCta.label}
              </Link>
            </div>
          )}
        </nav>
      </header>
    </>
  );
}
