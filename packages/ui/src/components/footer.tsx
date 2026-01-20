"use client";

import Link from "next/link";
import { cn } from "../utils/cn";
import { SocialLinks, type SocialLink } from "./social-links";

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterProps {
  /** Site name for copyright */
  siteName: string;
  /** Social links configuration */
  socialLinks?: SocialLink[];
  /** Show social links section */
  showSocialLinks?: boolean;
  /** Social links label */
  socialLinksLabel?: string;
  /** Additional footer links */
  links?: FooterLink[];
  /** Custom class name */
  className?: string;
  /** Variant: full (with social links) or minimal (copyright only) */
  variant?: "full" | "minimal";
  /** Custom colors */
  colors?: {
    primary?: string;
    background?: string;
    text?: string;
    border?: string;
  };
}

export function Footer({
  siteName,
  socialLinks,
  showSocialLinks = true,
  socialLinksLabel = "Retrouvez-moi sur les réseaux",
  links = [],
  className,
  variant = "full",
  colors = {},
}: FooterProps) {
  const {
    primary = "gold",
    background = "night",
    text = "ivory",
    border = "ivory",
  } = colors;

  const currentYear = new Date().getFullYear();

  if (variant === "minimal") {
    return (
      <footer
        className={cn(
          `border-t border-${border}/10 bg-${background}/80 px-6 py-10 text-center text-xs text-${text}/50 sm:px-10 lg:px-16`,
          className
        )}
      >
        © {currentYear} {siteName}. Tous droits réservés.
      </footer>
    );
  }

  return (
    <footer
      className={cn(
        `border-t border-${border}/10 bg-${background}/80 px-6 py-10 sm:px-10 lg:px-16`,
        className
      )}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Social Links Section */}
        {showSocialLinks && socialLinks && socialLinks.length > 0 && (
          <div className="flex flex-col items-center gap-3">
            <p className={`text-xs text-${text}/50`}>{socialLinksLabel}</p>
            <SocialLinks links={socialLinks} variant="inline" colors={colors} />
          </div>
        )}

        {/* Divider */}
        {showSocialLinks && socialLinks && socialLinks.length > 0 && (
          <div className={`border-t border-${border}/10`} />
        )}

        {/* Copyright and Links */}
        <div
          className={`flex flex-col items-center gap-2 text-center text-xs text-${text}/50 sm:flex-row sm:justify-center sm:gap-4`}
        >
          <span>
            © {currentYear} {siteName}. Tous droits réservés.
          </span>

          {links.map((link, index) => (
            <span key={link.href} className="contents">
              <span className={`hidden sm:inline text-${text}/30`}>|</span>
              <Link
                href={link.href}
                className={`transition hover:text-${primary} focus:outline-none focus:ring-2 focus:ring-${primary} focus:ring-offset-2 focus:ring-offset-${background} rounded`}
              >
                {link.label}
              </Link>
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
