'use client';

import { useTheme } from '@/lib/theme-context';

/**
 * Props du composant ThemeToggle
 */
interface ThemeToggleProps {
  /** Taille du bouton */
  size?: 'sm' | 'md' | 'lg';
  /** Afficher le label */
  showLabel?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Icône Soleil pour le mode clair
 */
function SunIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

/**
 * Icône Lune pour le mode sombre
 */
function MoonIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/**
 * Bouton de basculement entre mode clair et sombre
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * <ThemeToggle size="lg" showLabel />
 * ```
 */
export function ThemeToggle({ size = 'md', showLabel = false, className = '' }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`
        inline-flex items-center gap-2 rounded-lg
        transition-all duration-200
        ${sizeClasses[size]}
        ${isDark
          ? 'bg-night-light/50 text-gold-accessible hover:bg-gold/10 hover:text-gold-hover'
          : 'bg-ivory-dark/50 text-gold-700 hover:bg-gold-100 hover:text-gold-800'
        }
        focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2
        ${isDark ? 'focus:ring-offset-night' : 'focus:ring-offset-white'}
        ${className}
      `}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      <span className="relative">
        {/* Icône du soleil (visible en mode sombre) */}
        <SunIcon
          className={`
            ${iconSizes[size]}
            absolute inset-0 transition-all duration-300
            ${isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}
          `}
        />
        {/* Icône de la lune (visible en mode clair) */}
        <MoonIcon
          className={`
            ${iconSizes[size]}
            transition-all duration-300
            ${isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}
          `}
        />
      </span>
      {showLabel && (
        <span className="text-sm font-medium">
          {isDark ? 'Mode clair' : 'Mode sombre'}
        </span>
      )}
    </button>
  );
}

/**
 * Version compacte du toggle pour la navigation
 */
export function ThemeToggleCompact() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative h-8 w-14 rounded-full transition-colors duration-300
        ${isDark ? 'bg-night-light' : 'bg-ivory-dark'}
        focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2
        ${isDark ? 'focus:ring-offset-night' : 'focus:ring-offset-white'}
      `}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      {/* Curseur */}
      <span
        className={`
          absolute top-1 h-6 w-6 rounded-full transition-all duration-300
          flex items-center justify-center
          ${isDark
            ? 'left-1 bg-gold text-night'
            : 'left-7 bg-gold-700 text-white'
          }
        `}
      >
        {isDark ? (
          <MoonIcon className="h-3.5 w-3.5" />
        ) : (
          <SunIcon className="h-3.5 w-3.5" />
        )}
      </span>
    </button>
  );
}

export default ThemeToggle;
