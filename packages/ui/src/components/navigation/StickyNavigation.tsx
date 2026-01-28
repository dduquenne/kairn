'use client';

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';

import { cn } from '../../utils/cn';
import type { LinkComponent } from '../blog/types';

/**
 * Navigation link configuration
 */
export interface NavLink {
  href: string;
  label: string;
}

/**
 * Social link configuration
 */
export interface StickyNavSocialLink {
  platform: 'facebook' | 'linkedin' | 'instagram' | 'threads' | 'twitter' | 'youtube';
  url: string;
  label?: string;
}

/**
 * CTA button configuration
 */
export interface CTAConfig {
  href: string;
  label: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary';
}

export interface StickyNavigationProps {
  /** Navigation links */
  links: NavLink[];
  /** Logo component or element */
  logo: ReactNode;
  /** Site name (shown next to logo) */
  siteName?: string;
  /** CTA buttons */
  ctas?: CTAConfig[];
  /** Social links (for mobile menu) */
  socialLinks?: StickyNavSocialLink[];
  /** Force visibility (for pages other than homepage) */
  forceVisible?: boolean;
  /** Scroll threshold to show background (px) */
  scrollThreshold?: number;
  /** Custom link component (Next.js Link) */
  linkComponent?: LinkComponent;
  /** Custom class name */
  className?: string;
  /** Mobile menu background color */
  mobileMenuBgColor?: string;
  /** Custom colors */
  colors?: {
    primary?: string;
    background?: string;
    text?: string;
    border?: string;
  };
}

/**
 * Social icon component
 */
function SocialIcon({ platform, className = 'h-5 w-5' }: { platform: string; className?: string }) {
  const iconProps = { className, fill: 'currentColor', viewBox: '0 0 24 24' };

  switch (platform.toLowerCase()) {
    case 'facebook':
      return (
        <svg {...iconProps}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg {...iconProps}>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg {...iconProps}>
          <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
        </svg>
      );
    case 'threads':
      return (
        <svg {...iconProps}>
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.88-.732 2.07-1.128 3.446-1.145 1.053-.013 2.053.125 2.851.287v3.19l-.015-.004c-1.285.052-2.092.138-2.766.295-1.417.33-1.866.838-1.89 1.925.012.482.205.878.575 1.178.444.36 1.075.547 1.823.54 1.27-.012 2.281-.487 3.002-1.406.573-.733.89-1.753.944-3.039l.02-.442v-5.57l.758.122c.122.02.308.054.555.101.36.068.758.157 1.142.267.424.121.755.243 1.015.374a6.8 6.8 0 011.386.848c1.388 1.09 2.191 2.481 2.386 4.136.188 1.587-.272 3.2-1.331 4.67-1.2 1.669-2.926 2.797-5.133 3.354-1.178.297-2.46.445-3.813.439z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg {...iconProps}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg {...iconProps}>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Animated hamburger icon (3 lines -> X)
 */
function HamburgerIcon({
  isOpen,
  primaryColor = 'primary',
}: {
  isOpen: boolean;
  primaryColor?: string;
}) {
  return (
    <div className="relative h-5 w-6">
      {/* Top line */}
      <span
        className={cn(
          `bg-${primaryColor} absolute left-0 block h-0.5 w-6 transition-all duration-300 ease-in-out`,
          isOpen ? 'top-2.5 rotate-45' : 'top-0 rotate-0'
        )}
      />
      {/* Middle line */}
      <span
        className={cn(
          `bg-${primaryColor} absolute left-0 top-2.5 block h-0.5 w-6 transition-all duration-300 ease-in-out`,
          isOpen ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
        )}
        style={{ transform: `translateY(-50%) ${isOpen ? 'scaleX(0)' : 'scaleX(1)'}` }}
      />
      {/* Bottom line */}
      <span
        className={cn(
          `bg-${primaryColor} absolute left-0 block h-0.5 w-6 transition-all duration-300 ease-in-out`,
          isOpen ? 'top-2.5 -rotate-45' : 'top-5 rotate-0'
        )}
      />
    </div>
  );
}

/**
 * Sticky navigation component with mobile hamburger menu
 *
 * @example
 * ```tsx
 * <StickyNavigation
 *   logo={<MyLogo />}
 *   siteName="My Site"
 *   links={[
 *     { href: "/", label: "Home" },
 *     { href: "/about", label: "About" },
 *   ]}
 *   ctas={[
 *     { href: "/contact", label: "Contact", variant: "primary" },
 *   ]}
 *   linkComponent={Link}
 * />
 * ```
 */
export function StickyNavigation({
  links,
  logo,
  siteName,
  ctas = [],
  socialLinks = [],
  forceVisible = false,
  scrollThreshold = 100,
  linkComponent: LinkComp,
  className,
  mobileMenuBgColor = '#1A2332',
  colors = {},
}: StickyNavigationProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);
  const firstFocusableRef = useRef<HTMLAnchorElement>(null);

  const { primary = 'gold', background = 'night', text = 'ivory', border = 'gold' } = colors;

  // Use custom Link component or default anchor
  const Link =
    LinkComp ??
    (({
      href,
      children,
      className: linkClassName,
      ...props
    }: {
      href: string;
      children: React.ReactNode;
      className?: string;
    }) => (
      <a href={href} className={linkClassName} {...props}>
        {children}
      </a>
    ));

  // Track mounting to enable animations only after hydration
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Scroll handler
  useEffect(() => {
    if (!hasMounted) return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > scrollThreshold);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMounted, scrollThreshold]);

  // Close menu function
  const closeMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    hamburgerButtonRef.current?.focus();
  }, []);

  // Escape key and body scroll lock
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };

    // Lock body scroll
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    // Focus first link when menu opens
    setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 100);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen, closeMenu]);

  const showBackground = hasMounted && (isScrolled || forceVisible);
  const isVisible = showBackground;

  return (
    <>
      <nav
        className={cn(
          'fixed left-0 right-0 top-0 z-50 transition-all duration-300',
          isVisible
            ? `border-${border}/20 bg-${background}/90 shadow-${background}/50 translate-y-0 border-b opacity-100 shadow-lg backdrop-blur-md`
            : '-translate-y-full bg-transparent opacity-0',
          className
        )}
        suppressHydrationWarning
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo on left */}
            <Link href="/" className="group flex items-center gap-3">
              <div className="relative transition-transform duration-300 group-hover:scale-110">
                {logo}
              </div>
              {siteName && (
                <span className={`text-${primary} hidden text-xl font-semibold sm:block`}>
                  {siteName}
                </span>
              )}
            </Link>

            {/* Navigation links center - Desktop */}
            <div className="hidden items-center gap-1 md:flex">
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-${text}/80 hover:bg-${primary}/10 hover:text-${primary} rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* CTA buttons on right - Desktop */}
            {ctas.length > 0 && (
              <div className="hidden items-center gap-3 md:flex">
                {ctas.map(cta => (
                  <Link
                    key={cta.href}
                    href={cta.href}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200',
                      cta.variant === 'primary'
                        ? `bg-${primary} text-${background} hover:scale-105 hover:shadow-lg focus:ring-${primary}`
                        : `border border-${primary}/40 text-${primary} hover:border-${primary} hover:bg-${primary}/10`
                    )}
                  >
                    {cta.icon}
                    {cta.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Hamburger button - Mobile */}
            <button
              ref={hamburgerButtonRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`text-${text}/80 hover:bg-${primary}/10 hover:text-${primary} focus:ring-${primary} focus:ring-offset-${background} relative z-50 rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 md:hidden`}
              aria-label="Navigation menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <HamburgerIcon isOpen={isMobileMenuOpen} primaryColor={primary} />
            </button>
          </div>
        </div>
      </nav>

      {/* Semi-transparent overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          isMobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Mobile menu - Slide from right */}
      <div
        ref={mobileMenuRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          'fixed bottom-0 right-0 top-0 z-40 flex w-80 max-w-[85vw] flex-col shadow-2xl transition-transform duration-300 ease-out md:hidden',
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ backgroundColor: mobileMenuBgColor }}
      >
        {/* Menu header with logo */}
        <div className={`border-${border}/20 flex items-center gap-3 border-b px-6 py-5`}>
          {logo}
          {siteName && (
            <span className={`font-display text-${primary} text-xl font-semibold`}>{siteName}</span>
          )}
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6" aria-label="Main navigation">
          <ul className="space-y-1">
            {links.map((link, index) => (
              <li key={link.href}>
                {index === 0 ? (
                  <a
                    ref={firstFocusableRef}
                    href={link.href}
                    onClick={closeMenu}
                    className={`text-${text}/90 hover:bg-${primary}/10 hover:text-${primary} focus:bg-${primary}/10 focus:text-${primary} block rounded-lg px-4 py-3 text-base font-medium transition-colors duration-200 focus:outline-none`}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    onClick={closeMenu}
                    className={`text-${text}/90 hover:bg-${primary}/10 hover:text-${primary} focus:bg-${primary}/10 focus:text-${primary} block rounded-lg px-4 py-3 text-base font-medium transition-colors duration-200 focus:outline-none`}
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* CTA buttons */}
        {ctas.length > 0 && (
          <div className={`border-${border}/20 space-y-3 border-t px-6 py-5`}>
            {ctas.map(cta => (
              <Link
                key={cta.href}
                href={cta.href}
                onClick={closeMenu}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-base font-semibold transition-all duration-200 focus:outline-none focus:ring-2',
                  cta.variant === 'primary'
                    ? `bg-${primary} text-${background} focus:ring-${primary}`
                    : `border-2 border-${primary} text-${primary} hover:bg-${primary}/10 focus:ring-${primary}`
                )}
              >
                {cta.icon}
                {cta.label}
              </Link>
            ))}
          </div>
        )}

        {/* Social links */}
        {socialLinks.length > 0 && (
          <div className={`border-${border}/20 border-t px-6 py-5`}>
            <p className={`text-${text}/50 mb-3 text-center text-sm`}>Follow us</p>
            <div className="flex items-center justify-center gap-4">
              {socialLinks.map(link => (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label || `Follow on ${link.platform}`}
                  className={`text-${text}/60 hover:bg-${primary}/10 hover:text-${primary} focus:ring-${primary} rounded-lg p-2 transition-all duration-200 focus:outline-none focus:ring-2`}
                >
                  <SocialIcon platform={link.platform} className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
