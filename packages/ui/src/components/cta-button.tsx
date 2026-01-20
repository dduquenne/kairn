"use client";

import Link from "next/link";
import type { ReactNode, ComponentPropsWithoutRef } from "react";
import { cn } from "../utils/cn";

export type CTAButtonVariant = "primary" | "secondary" | "ghost";

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-sm font-medium tracking-wide transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const variantStyles: Record<CTAButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-gold via-gold/95 to-gold text-night shadow-md shadow-gold/25 hover:shadow-lg hover:shadow-gold/35 hover:from-gold/90 hover:via-gold hover:to-gold/90 focus-visible:outline-gold font-semibold",
  secondary:
    "border-2 border-gold/50 bg-transparent text-gold hover:border-gold hover:bg-gold/10 focus-visible:outline-gold backdrop-blur-sm",
  ghost:
    "text-ivory/90 hover:text-gold hover:bg-ivory/5 focus-visible:outline-ivory",
};

interface CTAButtonBaseProps {
  /** Button variant */
  variant?: CTAButtonVariant;
  /** Custom class name */
  className?: string;
  /** Button content */
  children: ReactNode;
  /** Tracking label for analytics */
  trackingLabel?: string;
  /** Callback when button is clicked (for tracking) */
  onTrack?: () => void;
}

interface CTAButtonLinkProps extends CTAButtonBaseProps {
  /** Link destination (makes button a link) */
  href: string;
  /** Link props */
  linkProps?: Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className">;
}

interface CTAButtonButtonProps extends CTAButtonBaseProps {
  href?: never;
  /** Button props */
  buttonProps?: Omit<ComponentPropsWithoutRef<"button">, "className" | "onClick">;
  /** Click handler */
  onClick?: () => void;
}

export type CTAButtonProps = CTAButtonLinkProps | CTAButtonButtonProps;

export function CTAButton({
  variant = "primary",
  className,
  children,
  trackingLabel,
  onTrack,
  ...props
}: CTAButtonProps) {
  const composedClassName = cn(baseStyles, variantStyles[variant], className);

  const handleClick = () => {
    if (onTrack) {
      onTrack();
    }
    if ("onClick" in props && props.onClick) {
      props.onClick();
    }
  };

  if ("href" in props && props.href) {
    const { href, linkProps } = props as CTAButtonLinkProps;
    return (
      <Link
        href={href}
        className={composedClassName}
        onClick={handleClick}
        {...linkProps}
      >
        {children}
      </Link>
    );
  }

  const { buttonProps } = props as CTAButtonButtonProps;
  return (
    <button
      className={composedClassName}
      onClick={handleClick}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
