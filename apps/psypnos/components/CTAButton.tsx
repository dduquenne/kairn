// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-sm font-medium tracking-wide transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

type CTAButtonVariant = "primary" | "secondary" | "ghost";

const variantStyles: Record<CTAButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-gold via-gold/95 to-gold text-night shadow-md shadow-gold/25 hover:shadow-lg hover:shadow-gold/35 hover:from-gold/90 hover:via-gold hover:to-gold/90 focus-visible:outline-gold font-semibold",
  secondary:
    "border-2 border-gold/50 bg-transparent text-gold hover:border-gold hover:bg-gold/10 focus-visible:outline-gold backdrop-blur-sm",
  ghost:
    "text-ivory/90 hover:text-gold hover:bg-ivory/5 focus-visible:outline-ivory",
};

type CTAButtonLinkProps = {
  href: string;
  trackingLabel?: string;
  onTrack?: () => void;
} & Omit<HTMLMotionProps<"a">, "className" | "children">;

type CTAButtonButtonProps = {
  href?: undefined;
  trackingLabel?: string;
  onTrack?: () => void;
} & Omit<HTMLMotionProps<"button">, "className" | "children">;

type CTAButtonAnimationProps = {
  initial?: { opacity: number; y: number };
  animate?: { opacity: number; y: number };
  transition?: { duration: number; delay?: number; ease: string };
};

type CTAButtonProps = {
  variant?: CTAButtonVariant;
  className?: string;
  children: ReactNode;
  animationProps?: CTAButtonAnimationProps;
} & (CTAButtonLinkProps | CTAButtonButtonProps);

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const MotionLink = motion(Link);

const motionInteractions = {
  whileHover: { scale: 1.02, y: -1 },
  whileTap: { scale: 0.98 },
} as const;

export function CTAButton({
  variant = "primary",
  className,
  children,
  href,
  trackingLabel,
  onTrack,
  animationProps,
  ...props
}: CTAButtonProps) {
  const composedClassName = cn(baseStyles, variantStyles[variant], className);

  const handleClick = () => {
    if (onTrack) {
      onTrack();
    }
  };

  const motionProps = animationProps
    ? {
        initial: animationProps.initial,
        animate: animationProps.animate,
        transition: animationProps.transition,
      }
    : {};

  if (href) {
    return (
      <MotionLink
        href={href}
        {...motionInteractions}
        className={composedClassName}
        onClick={handleClick}
        {...motionProps}
        {...(props as HTMLMotionProps<"a">)}
      >
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button
      {...motionInteractions}
      className={composedClassName}
      onClick={handleClick}
      {...motionProps}
      {...(props as HTMLMotionProps<"button">)}
    >
      {children}
    </motion.button>
  );
}
