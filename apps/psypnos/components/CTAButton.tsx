'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import Link from 'next/link';
import type { ReactNode } from 'react';

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-sm font-medium tracking-wide transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

type CTAButtonVariant = 'primary' | 'secondary' | 'ghost';

const variantStyles: Record<CTAButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-gold via-gold/95 to-gold text-night shadow-md shadow-gold/25 hover:shadow-lg hover:shadow-gold/35 hover:from-gold/90 hover:via-gold hover:to-gold/90 focus-visible:outline-gold font-semibold',
  secondary:
    'border-2 border-gold/50 bg-transparent text-gold hover:border-gold hover:bg-gold/10 focus-visible:outline-gold backdrop-blur-sm',
  ghost: 'text-ivory/90 hover:text-gold hover:bg-ivory/5 focus-visible:outline-ivory',
};

/**
 * Concaténation simple de classes CSS.
 */
function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const MotionLink = motion.create(Link);

const motionInteractions = {
  whileHover: { scale: 1.02, y: -1 },
  whileTap: { scale: 0.98 },
} as const;

interface CTAButtonProps {
  variant?: CTAButtonVariant;
  className?: string;
  children: ReactNode;
  href?: string;
  trackingLabel?: string;
  onTrack?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Bouton CTA avec animations de hover/tap via Framer Motion.
 * Rendu en tant que lien si `href` est fourni, sinon en tant que bouton.
 */
export function CTAButton({
  variant = 'primary',
  className,
  children,
  href,
  onTrack,
  type,
}: CTAButtonProps) {
  const composedClassName = cn(baseStyles, variantStyles[variant], className);

  /** Callback de tracking au clic. */
  const handleClick = () => {
    if (onTrack) {
      onTrack();
    }
  };

  if (href) {
    return (
      <MotionLink
        href={href}
        {...motionInteractions}
        className={composedClassName}
        onClick={handleClick}
      >
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type={type ?? 'button'}
      {...motionInteractions}
      className={composedClassName}
      onClick={handleClick}
    >
      {children}
    </motion.button>
  );
}
