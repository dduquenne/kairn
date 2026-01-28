'use client';

import { cn } from '../utils/cn';

export interface PageTitleProps {
  /** The title text */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Size variant for responsive typography */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color variant (uses CSS custom properties or Tailwind classes) */
  color?: 'primary' | 'text' | 'custom';
  /** Custom color class when color="custom" */
  customColorClass?: string;
  /** Whether to use display font (serif) or body font (sans-serif) */
  useDisplayFont?: boolean;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** HTML tag to use (defaults to h1) */
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

const sizeClasses = {
  sm: 'text-2xl sm:text-3xl lg:text-4xl',
  md: 'text-3xl sm:text-4xl lg:text-5xl',
  lg: 'text-4xl sm:text-5xl lg:text-6xl',
  xl: 'text-5xl sm:text-6xl lg:text-7xl',
};

const colorClasses = {
  primary: 'text-gold',
  text: 'text-ivory',
  custom: '',
};

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

/**
 * PageTitle component for consistent H1 styling across sites
 *
 * Follows the Kairn design charter:
 * - Uses Playfair Display (font-display) for serif headings
 * - Gold (#c7a962) as primary accent color
 * - Bold weight for main titles
 * - Responsive sizing with mobile-first approach
 *
 * @example
 * ```tsx
 * // Default usage (gold, display font, medium size)
 * <PageTitle>Psychotherapist in Paris</PageTitle>
 *
 * // Custom size and alignment
 * <PageTitle size="lg" align="center">
 *   Welcome to Our Practice
 * </PageTitle>
 *
 * // With custom color class
 * <PageTitle color="custom" customColorClass="text-blue-500">
 *   Custom Styled Title
 * </PageTitle>
 *
 * // As a different heading level
 * <PageTitle as="h2" size="sm">
 *   Section Title
 * </PageTitle>
 * ```
 */
export function PageTitle({
  children,
  className,
  size = 'md',
  color = 'primary',
  customColorClass,
  useDisplayFont = true,
  align = 'left',
  as: Component = 'h1',
}: PageTitleProps) {
  return (
    <Component
      className={cn(
        'font-bold leading-tight',
        useDisplayFont && 'font-display',
        sizeClasses[size],
        color === 'custom' ? customColorClass : colorClasses[color],
        alignClasses[align],
        className
      )}
    >
      {children}
    </Component>
  );
}
