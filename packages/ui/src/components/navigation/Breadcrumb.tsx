"use client";

import { cn } from "../../utils/cn";
import type { BreadcrumbItem, SchemaOrgBreadcrumbItem } from "./types";
import type { LinkComponent } from "../blog/types";

export interface BreadcrumbProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Custom link component */
  linkComponent?: LinkComponent;
  /** Show home icon */
  showHomeIcon?: boolean;
  /** Home label (if using home icon, this is the sr-only text) */
  homeLabel?: string;
  /** Custom class name */
  className?: string;
  /** Custom item class name */
  itemClassName?: string;
  /** Custom separator class name */
  separatorClassName?: string;
  /** Custom active item class name */
  activeClassName?: string;
  /** Aria label */
  ariaLabel?: string;
}

/**
 * Breadcrumb navigation component
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: "Home", href: "/" },
 *     { label: "Blog", href: "/blog" },
 *     { label: "My Post" },
 *   ]}
 *   linkComponent={Link}
 * />
 * ```
 */
export function Breadcrumb({
  items,
  linkComponent: LinkComp,
  showHomeIcon = true,
  homeLabel = "Home",
  className,
  itemClassName,
  separatorClassName,
  activeClassName,
  ariaLabel = "Breadcrumb",
}: BreadcrumbProps) {
  if (items.length === 0) return null;

  // Use custom Link component or default anchor
  const Link = LinkComp ?? (({ href, children, className, ...props }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ));

  const baseItemClass = cn(
    "transition-colors whitespace-nowrap",
    "hover:text-gold",
    itemClassName
  );

  const activeItemClass = cn(
    "font-medium text-gold truncate max-w-xs sm:max-w-md",
    activeClassName
  );

  const separatorClass = cn(
    "h-3.5 w-3.5 flex-shrink-0 text-ivory/40",
    separatorClassName
  );

  // Chevron separator
  const Separator = () => (
    <svg
      className={separatorClass}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );

  // Home icon
  const HomeIcon = () => (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "mb-6 flex items-center gap-2 text-sm text-ivory/60",
        "overflow-x-auto py-2",
        className
      )}
    >
      {items.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === items.length - 1;
        const hasLink = Boolean(item.href);

        return (
          <span key={index} className="flex items-center gap-2">
            {/* Separator (not for first item) */}
            {!isFirst && <Separator />}

            {/* Item */}
            {hasLink ? (
              <Link
                href={item.href!}
                className={cn(
                  baseItemClass,
                  isFirst && "flex items-center gap-1"
                )}
              >
                {isFirst && showHomeIcon && (
                  <>
                    <HomeIcon />
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sr-only sm:hidden">{item.label}</span>
                  </>
                )}
                {(!isFirst || !showHomeIcon) && item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? activeItemClass : baseItemClass)}>
                {isFirst && showHomeIcon && (
                  <>
                    <HomeIcon />
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sr-only sm:hidden">{item.label}</span>
                  </>
                )}
                {(!isFirst || !showHomeIcon) && item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export interface BreadcrumbStructuredDataProps {
  /** Breadcrumb items with full URLs */
  items: Array<{
    name: string;
    url: string;
  }>;
}

/**
 * Schema.org structured data for breadcrumbs (SEO)
 *
 * @example
 * ```tsx
 * <BreadcrumbStructuredData
 *   items={[
 *     { name: "Home", url: "https://example.com" },
 *     { name: "Blog", url: "https://example.com/blog" },
 *     { name: "Post Title", url: "https://example.com/blog/post-slug" },
 *   ]}
 * />
 * ```
 */
export function BreadcrumbStructuredData({
  items,
}: BreadcrumbStructuredDataProps) {
  const schemaItems: SchemaOrgBreadcrumbItem[] = items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: schemaItems,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

