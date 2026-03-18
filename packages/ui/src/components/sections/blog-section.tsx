'use client';

import type { ReactNode } from 'react';

import { cn } from '../../utils/cn';
import { SectionTitle, type SectionTitleProps } from '../section-title';

/**
 * Blog post data for the section
 */
export interface BlogSectionPost {
  /** URL slug */
  slug: string;
  /** Post title */
  title: string;
  /** Short description */
  description?: string;
  /** Category name */
  category: string;
  /** Publication date ISO string */
  date: string;
  /** Optional cover image URL */
  image?: string;
}

/**
 * Category color configuration
 */
export interface BlogCategoryColor {
  /** Background color class */
  bg: string;
  /** Text color class */
  text: string;
  /** Gradient classes */
  gradient: string;
}

/**
 * Props for the BlogSection component
 */
export interface BlogSectionProps {
  /** Blog posts to display */
  posts: BlogSectionPost[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Section title configuration */
  title?: SectionTitleProps;
  /** Category color mapping */
  categoryColors?: Record<string, BlogCategoryColor>;
  /** Default category colors when no match */
  defaultCategoryColor?: BlogCategoryColor;
  /** Locale for date formatting */
  locale?: string;
  /** Timezone for date formatting */
  timezone?: string;
  /** CTA label for "View all" button */
  ctaLabel?: string;
  /** CTA href for "View all" button */
  ctaHref?: string;
  /** "Read article" hover text */
  readLabel?: string;
  /** Custom link component (e.g., Next.js Link) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  linkComponent?: React.ComponentType<any>;
  /** Custom image component */
  imageComponent?: React.ComponentType<{
    src: string;
    alt: string;
    fill?: boolean;
    unoptimized?: boolean;
    className?: string;
    sizes?: string;
  }>;
  /** Custom CTA button component */
  ctaComponent?: ReactNode;
  /** Analytics tracking section name */
  trackingName?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Loading skeleton for blog section
 */
function BlogSkeleton() {
  return (
    <section className="bg-night/60 px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="space-y-4">
          <div className="bg-ivory/10 h-4 w-32 animate-pulse rounded" />
          <div className="bg-ivory/10 h-8 w-80 max-w-full animate-pulse rounded" />
          <div className="bg-ivory/10 h-4 w-full max-w-2xl animate-pulse rounded" />
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="border-ivory/10 bg-night/50 relative flex h-72 flex-col overflow-hidden rounded-2xl border p-6"
            >
              <div className="bg-ivory/10 absolute bottom-0 left-0 top-0 w-1 animate-pulse" />
              <div className="space-y-4 pl-2">
                <div className="bg-ivory/10 h-6 w-24 animate-pulse rounded-full" />
                <div className="bg-ivory/10 h-6 w-full animate-pulse rounded" />
                <div className="space-y-2">
                  <div className="bg-ivory/10 h-4 w-full animate-pulse rounded" />
                  <div className="bg-ivory/10 h-4 w-3/4 animate-pulse rounded" />
                </div>
                <div className="bg-ivory/10 h-4 w-32 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const DEFAULT_CATEGORY_COLOR: BlogCategoryColor = {
  bg: 'bg-gold/20',
  text: 'text-gold',
  gradient: 'from-gold to-gold/60',
};

/**
 * Blog section displaying a grid of blog post cards with category colors.
 * Accepts data via props for framework-agnostic usage.
 *
 * @example
 * ```tsx
 * <BlogSection
 *   posts={blogPosts}
 *   title={{ eyebrow: "Blog", title: "Nos derniers articles" }}
 *   categoryColors={{ "Tech": { bg: "bg-blue-500/20", text: "text-blue-300", gradient: "from-blue-500 to-blue-600" } }}
 *   ctaLabel="Voir tous les articles"
 *   ctaHref="/blog"
 * />
 * ```
 */
export function BlogSection({
  posts,
  isLoading = false,
  title = { eyebrow: 'Blog', title: 'Nos derniers articles' },
  categoryColors = {},
  defaultCategoryColor = DEFAULT_CATEGORY_COLOR,
  locale = 'fr-FR',
  timezone = 'Europe/Paris',
  ctaLabel = 'Découvrir tous les articles',
  ctaHref = '/blog',
  readLabel = "Lire l'article",
  linkComponent: LinkComp,
  imageComponent: ImageComp,
  ctaComponent,
  trackingName = 'Blog',
  className,
}: BlogSectionProps) {
  if (isLoading) {
    return <BlogSkeleton />;
  }

  if (posts.length === 0) {
    return (
      <section
        id="blog"
        className={cn('bg-night/60 px-6 py-20 sm:px-10 lg:px-16', className)}
        data-track-section={trackingName.toLowerCase().replace(/\s+/g, '-')}
        data-track-section-name={trackingName}
      >
        <div className="mx-auto max-w-6xl space-y-12">
          <SectionTitle {...title} />
          <p className="text-ivory/50 text-center text-lg">
            Les premiers articles seront publiés prochainement.
          </p>
        </div>
      </section>
    );
  }

  const Link =
    LinkComp ??
    (({
      href,
      className: lc,
      children,
    }: {
      href: string;
      className?: string;
      children: ReactNode;
    }) => (
      <a href={href} className={lc}>
        {children}
      </a>
    ));

  return (
    <section
      id="blog"
      className={cn('bg-night/60 px-6 py-20 sm:px-10 lg:px-16', className)}
      data-track-section={trackingName.toLowerCase().replace(/\s+/g, '-')}
      data-track-section-name={trackingName}
    >
      <div className="mx-auto max-w-6xl space-y-12">
        <SectionTitle {...title} />

        {/* Posts grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => {
            const colors = categoryColors[post.category] ?? defaultCategoryColor;
            const formattedDate = new Date(post.date).toLocaleDateString(locale, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: timezone,
            });

            return (
              <article
                key={post.slug}
                className="border-ivory/10 bg-night/50 shadow-night/60 hover:border-ivory/20 hover:bg-night/70 group relative flex h-full flex-col overflow-hidden rounded-2xl border shadow-xl transition-all"
              >
                {/* Category color bar */}
                <div
                  className={cn(
                    'absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b',
                    colors.gradient
                  )}
                />

                <Link
                  href={`/blog/${post.slug}`}
                  className="focus:ring-gold focus:ring-offset-night flex h-full flex-col focus:outline-none focus:ring-2 focus:ring-offset-2"
                >
                  {/* Cover image */}
                  {post.image && (
                    <div className="from-night/80 relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br to-transparent">
                      {ImageComp ? (
                        <ImageComp
                          src={post.image}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <img
                          src={post.image}
                          alt={post.title}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6 pl-8">
                    {/* Category badge */}
                    <div className="mb-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                          colors.bg,
                          colors.text
                        )}
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        {post.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-ivory group-hover:text-gold mb-3 text-xl font-semibold transition-colors">
                      {post.title}
                    </h3>

                    {/* Description */}
                    <p className="text-ivory/70 mb-4 line-clamp-3 flex-1 text-sm">
                      {post.description}
                    </p>

                    {/* Date */}
                    <div className="text-ivory/60 flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <time dateTime={post.date}>{formattedDate}</time>
                      </div>
                    </div>

                    {/* Read indicator */}
                    <div className="text-gold mt-4 flex items-center gap-2 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100">
                      <span>{readLabel}</span>
                      <svg
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
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
                  </div>

                  {/* Progress bar on hover */}
                  <div className="from-gold to-gold/50 absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 bg-gradient-to-r transition-transform group-hover:scale-x-100" />
                </Link>
              </article>
            );
          })}
        </div>

        {/* CTA */}
        {ctaComponent ? (
          <div className="flex justify-center">{ctaComponent}</div>
        ) : (
          <div className="flex justify-center">
            <Link
              href={ctaHref}
              className="border-gold/50 text-gold hover:border-gold hover:bg-gold/10 inline-flex items-center justify-center gap-2 rounded-lg border-2 bg-transparent px-7 py-3.5 text-sm font-medium tracking-wide backdrop-blur-sm transition-all duration-300"
            >
              {ctaLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
