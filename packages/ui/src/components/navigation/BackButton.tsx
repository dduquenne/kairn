"use client";

import { useCallback, type ReactNode } from "react";

import { cn } from "../../utils/cn";

export interface BackButtonProps {
  /** Button content (default: "Back") */
  children?: ReactNode;
  /** Fallback URL when there's no history */
  fallbackHref?: string;
  /** Show back arrow icon */
  showIcon?: boolean;
  /** Custom class name */
  className?: string;
  /** onClick handler (optional - will be called in addition to navigation) */
  onClick?: () => void;
  /** Router's back function (for Next.js useRouter().back) */
  routerBack?: () => void;
  /** Router's push function (for Next.js useRouter().push) */
  routerPush?: (href: string) => void;
  /** Aria label */
  ariaLabel?: string;
  /** Button type */
  type?: "button" | "submit" | "reset";
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Back button component with programmatic navigation or fallback
 *
 * @example
 * ```tsx
 * // With Next.js router
 * const router = useRouter();
 *
 * <BackButton
 *   routerBack={router.back}
 *   routerPush={router.push}
 *   fallbackHref="/"
 * >
 *   Go Back
 * </BackButton>
 * ```
 *
 * @example
 * ```tsx
 * // Without router (uses window.history)
 * <BackButton fallbackHref="/">
 *   Go Back
 * </BackButton>
 * ```
 */
export function BackButton({
  children = "Back",
  fallbackHref = "/",
  showIcon = true,
  className,
  onClick,
  routerBack,
  routerPush,
  ariaLabel = "Go back to previous page",
  type = "button",
  disabled = false,
}: BackButtonProps) {
  const handleClick = useCallback(() => {
    // Call optional onClick handler
    onClick?.();

    // If using router functions
    if (routerBack && routerPush) {
      if (typeof window !== "undefined" && window.history.length > 1) {
        routerBack();
      } else {
        routerPush(fallbackHref);
      }
      return;
    }

    // Fallback to window.history
    if (typeof window !== "undefined") {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = fallbackHref;
      }
    }
  }, [onClick, routerBack, routerPush, fallbackHref]);

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium",
        "text-ivory/70 transition-colors hover:text-gold",
        "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      aria-label={ariaLabel}
    >
      {/* Back arrow icon */}
      {showIcon && (
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
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

