"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@kairn/ui";

export interface AdminHeaderProps {
  /** Site name / dashboard title */
  siteName: string;
  /** Subtitle displayed above the title */
  subtitle?: string;
  /** Main title displayed in the header */
  title?: string;
  /** Link to return to the main site */
  siteUrl?: string;
  /** Label for the return to site button */
  siteReturnLabel?: string;
  /** Mobile navigation component slot */
  mobileNav?: ReactNode;
  /** Right side actions (logout button, etc.) */
  actions?: ReactNode;
  /** Accent color */
  accentColor?: string;
  /** Custom class names */
  className?: string;
}

/**
 * AdminHeader - Header component for admin dashboard
 *
 * @example
 * ```tsx
 * <AdminHeader
 *   siteName="MyApp"
 *   title="Administration MyApp"
 *   mobileNav={<AdminMobileNav {...props} />}
 *   actions={<LogoutButton />}
 * />
 * ```
 */
export function AdminHeader({
  siteName,
  subtitle = "Tableau de bord",
  title,
  siteUrl = "/",
  siteReturnLabel = "Retour au site",
  mobileNav,
  actions,
  accentColor = "gold",
  className,
}: AdminHeaderProps) {
  const displayTitle = title || `Administration ${siteName}`;

  return (
    <header
      className={cn(
        "border-b border-night/50 bg-night/80 px-4 py-3 backdrop-blur sm:px-6 sm:py-4",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {mobileNav}
          <div>
            <p className={cn(
              "text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em]",
              `text-${accentColor}`
            )}>
              {subtitle}
            </p>
            <h1 className="text-lg font-semibold sm:text-2xl">{displayTitle}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={siteUrl}
            className={cn(
              "hidden rounded-md px-3 py-2 text-sm font-medium transition lg:block",
              `border border-${accentColor}/60 text-${accentColor} hover:bg-${accentColor}/10`,
              `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-${accentColor}/70`,
              "focus-visible:ring-offset-2 focus-visible:ring-offset-night"
            )}
          >
            {siteReturnLabel}
          </Link>
          {actions}
        </div>
      </div>
    </header>
  );
}
