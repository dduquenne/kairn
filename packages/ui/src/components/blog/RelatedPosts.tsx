"use client";

import { type ElementType } from "react";

import { cn } from "../../utils/cn";

import type {
  BlogPostSummary,
  CategoryColors,
  GetCategoryColors,
  LinkComponent,
} from "./types";

export interface RelatedPostsProps {
  /** Related posts to display */
  posts: BlogPostSummary[];
  /** Section title */
  title?: string;
  /** Function to get category colors */
  getCategoryColors?: GetCategoryColors;
  /** Custom link component */
  linkComponent?: LinkComponent;
  /** Base URL for blog posts */
  blogBaseUrl?: string;
  /** Date format locale */
  dateLocale?: string;
  /** Read more label */
  readMoreLabel?: string;
  /** Custom class name */
  className?: string;
  /** Motion component for animations */
  motionComponent?: ElementType;
}

const defaultCategoryColors: CategoryColors = {
  bg: "bg-gold/10",
  text: "text-gold",
  border: "border-gold/20",
  hover: "hover:border-gold/40",
  gradient: "from-gold to-gold/50",
};

/**
 * Related posts component for displaying similar articles
 *
 * @example
 * ```tsx
 * <RelatedPosts
 *   posts={relatedPosts}
 *   linkComponent={Link}
 *   getCategoryColors={getCategoryColors}
 * />
 * ```
 */
export function RelatedPosts({
  posts,
  title = "Related Articles",
  getCategoryColors,
  linkComponent: LinkComp,
  blogBaseUrl = "/blog",
  dateLocale = "fr-FR",
  readMoreLabel = "Read article",
  className,
  motionComponent: Motion,
}: RelatedPostsProps) {
  if (posts.length === 0) {
    return null;
  }

  // Use custom Link component or default anchor
  const Link = LinkComp ?? (({ href, children, className, ...props }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ));

  const Wrapper = Motion ?? "article";

  return (
    <section
      className={cn("mt-16 border-t border-ivory/10 pt-12", className)}
    >
      <h2 className="mb-8 text-2xl font-semibold text-ivory">{title}</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => {
          const colors = getCategoryColors?.(post.category) ?? defaultCategoryColors;
          const formattedDate = new Date(post.date).toLocaleDateString(
            dateLocale,
            {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "Europe/Paris",
            }
          );

          const wrapperProps = Motion
            ? {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.4, delay: index * 0.1 },
              }
            : {};

          return (
            <Wrapper
              key={post.slug}
              {...wrapperProps}
              className={cn(
                "group relative overflow-hidden rounded-lg border",
                colors.border,
                "bg-night/30 backdrop-blur-sm transition-all",
                colors.hover,
                "hover:bg-night/50"
              )}
            >
              {/* Color bar on left */}
              <div
                className={cn(
                  "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b",
                  colors.gradient
                )}
              />

              <Link
                href={`${blogBaseUrl}/${post.slug}`}
                className="block p-6 pl-8 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night rounded-lg"
              >
                {/* Category */}
                <span
                  className={cn(
                    "mb-3 inline-block rounded-full px-3 py-1 text-xs font-medium",
                    colors.bg,
                    colors.text
                  )}
                >
                  {post.category}
                </span>

                {/* Title */}
                <h3 className="mb-2 text-lg font-semibold text-ivory transition-colors group-hover:text-gold">
                  {post.title}
                </h3>

                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-ivory/60">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <time dateTime={post.date}>{formattedDate}</time>
                </div>

                {/* Read more link */}
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gold transition-all group-hover:gap-3">
                  <span>{readMoreLabel}</span>
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
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </div>
              </Link>
            </Wrapper>
          );
        })}
      </div>
    </section>
  );
}

