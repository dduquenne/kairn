'use client';

import { cn } from '../utils/cn';

export interface SkipLink {
  /** Target element ID (without #) */
  targetId: string;
  /** Label displayed to users */
  label: string;
}

export interface SkipLinksProps {
  /** List of skip links to render */
  links?: SkipLink[];
  /** Custom class name */
  className?: string;
}

/**
 * Default skip links for typical page structure
 */
const DEFAULT_SKIP_LINKS: SkipLink[] = [
  { targetId: 'main-content', label: 'Aller au contenu principal' },
  { targetId: 'main-navigation', label: 'Aller à la navigation' },
];

/**
 * SkipLinks Component - WCAG 2.1 AA Compliant
 *
 * Provides keyboard-accessible skip links that appear on focus.
 * These allow users to bypass repetitive navigation and jump directly
 * to main content or other important page sections.
 *
 * Usage:
 * 1. Add <SkipLinks /> as the first element in your layout
 * 2. Ensure target elements have matching id attributes:
 *    - <main id="main-content">
 *    - <nav id="main-navigation">
 *
 * @example
 * ```tsx
 * // Basic usage with defaults
 * <SkipLinks />
 *
 * // Custom links
 * <SkipLinks
 *   links={[
 *     { targetId: "main-content", label: "Skip to content" },
 *     { targetId: "search", label: "Skip to search" },
 *   ]}
 * />
 * ```
 */
export function SkipLinks({ links = DEFAULT_SKIP_LINKS, className }: SkipLinksProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      event.preventDefault();
      // Make the target focusable if it isn't already
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus();
      // Scroll into view with offset for fixed header
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      className={cn('skip-links-container', className)}
      role="navigation"
      aria-label="Liens d'accès rapide"
    >
      {links.map(link => (
        <a
          key={link.targetId}
          href={`#${link.targetId}`}
          className="skip-link"
          onClick={e => handleClick(e, link.targetId)}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

export default SkipLinks;
