'use client';

import { useState, useEffect, useCallback, type ElementType } from 'react';

import { cn } from '../../utils/cn';

import type {
  BlogPostSummary,
  CategoryColors,
  GetCategoryColors,
  LinkComponent,
  ImageComponent,
} from './types';

export interface FeaturedCarouselProps {
  /** Featured posts to display */
  posts: BlogPostSummary[];
  /** Section title */
  title?: string;
  /** Items per page */
  itemsPerPage?: number;
  /** Autoplay interval in ms (0 to disable) */
  autoplayInterval?: number;
  /** Function to get category colors */
  getCategoryColors?: GetCategoryColors;
  /** Custom link component */
  linkComponent?: LinkComponent;
  /** Custom image component */
  imageComponent?: ImageComponent;
  /** Base URL for blog posts */
  blogBaseUrl?: string;
  /** Image resolver function */
  resolveImageUrl?: (post: BlogPostSummary) => string | null;
  /** Date format locale */
  dateLocale?: string;
  /** Featured badge text */
  featuredBadgeText?: string;
  /** Pause autoplay label */
  pauseLabel?: string;
  /** Play autoplay label */
  playLabel?: string;
  /** Custom class name */
  className?: string;
  /** Motion component for animations */
  motionComponent?: ElementType;
  /** AnimatePresence component */
  animatePresenceComponent?: ElementType;
}

const defaultCategoryColors: CategoryColors = {
  bg: 'bg-gold/10',
  text: 'text-gold',
  border: 'border-ivory/10',
  hover: 'hover:border-ivory/20',
  gradient: 'from-gold to-gold/50',
};

/**
 * Featured carousel component for highlighting posts
 *
 * @example
 * ```tsx
 * <FeaturedCarousel
 *   posts={featuredPosts}
 *   linkComponent={Link}
 *   imageComponent={Image}
 *   motionComponent={motion.div}
 *   animatePresenceComponent={AnimatePresence}
 * />
 * ```
 */
export function FeaturedCarousel({
  posts,
  title = 'Featured Posts',
  itemsPerPage = 3,
  autoplayInterval = 7000,
  getCategoryColors,
  linkComponent: LinkComp,
  imageComponent: ImageComp,
  blogBaseUrl = '/blog',
  resolveImageUrl,
  dateLocale = 'fr-FR',
  featuredBadgeText = 'Featured',
  pauseLabel = 'Pause',
  playLabel = 'Play',
  className,
  motionComponent: Motion,
  animatePresenceComponent: AnimatePresence,
}: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoplayInterval > 0);
  const [imageExists, setImageExists] = useState<Record<string, boolean>>({});

  const totalPages = Math.ceil(posts.length / itemsPerPage);

  // Check image existence for all posts
  useEffect(() => {
    const checkImages = async () => {
      const results: Record<string, boolean> = {};
      for (const post of posts) {
        try {
          const imageUrl = resolveImageUrl?.(post) ?? post.imageUrl;
          if (!imageUrl) {
            results[post.slug] = false;
            continue;
          }
          const response = await fetch(imageUrl, { method: 'HEAD' });
          results[post.slug] = response.ok;
        } catch {
          results[post.slug] = false;
        }
      }
      setImageExists(results);
    };

    checkImages();
  }, [posts, resolveImageUrl]);

  // Autoplay
  useEffect(() => {
    if (!isAutoPlaying || totalPages <= 1 || autoplayInterval <= 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % totalPages);
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying, totalPages, autoplayInterval]);

  const goToPrevious = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex(prev => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  const goToNext = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex(prev => (prev + 1) % totalPages);
  }, [totalPages]);

  const goToPage = useCallback((index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  }, []);

  if (posts.length === 0) return null;

  const startIdx = currentIndex * itemsPerPage;
  const visiblePosts = posts.slice(startIdx, startIdx + itemsPerPage);

  // Use custom Link component or default anchor
  const Link =
    LinkComp ??
    (({
      href,
      children,
      className,
      ...props
    }: {
      href: string;
      children: React.ReactNode;
      className?: string;
    }) => (
      <a href={href} className={className} {...props}>
        {children}
      </a>
    ));

  const Wrapper = Motion ?? 'div';
  const ArticleWrapper = Motion ?? 'article';

  // Navigation button component
  const NavButton = ({
    direction,
    onClick,
  }: {
    direction: 'prev' | 'next';
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'absolute top-1/2 z-10 -translate-y-1/2 rounded-full',
        'border-gold/30 bg-night/90 text-gold border p-3 backdrop-blur-sm',
        'hover:border-gold hover:bg-night transition-all hover:scale-110',
        'focus:ring-gold focus:outline-none focus:ring-2',
        direction === 'prev' ? 'left-0 -translate-x-4' : 'right-0 translate-x-4'
      )}
      aria-label={direction === 'prev' ? 'Page précédente' : 'Page suivante'}
    >
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={direction === 'prev' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
        />
      </svg>
    </button>
  );

  const carouselContent = (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {visiblePosts.map((post, index) => {
        const colors = getCategoryColors?.(post.category) ?? defaultCategoryColors;
        const formattedDate = new Date(post.date).toLocaleDateString(dateLocale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'Europe/Paris',
        });
        const imageUrl = resolveImageUrl?.(post) ?? post.imageUrl;

        const articleProps = Motion
          ? {
              initial: { opacity: 0, y: 20, scale: 0.95 },
              animate: { opacity: 1, y: 0, scale: 1 },
              whileHover: { scale: 1.02, y: -4 },
              transition: { duration: 0.5, delay: index * 0.1, ease: 'easeOut' },
            }
          : {};

        return (
          <ArticleWrapper
            key={post.slug}
            {...articleProps}
            className={cn(
              'border-ivory/10 group relative overflow-hidden rounded-xl border-2',
              'from-night via-night/95 to-night/90 bg-gradient-to-br backdrop-blur-sm',
              'hover:shadow-gold/30 hover:border-ivory/20 transition-all hover:shadow-2xl'
            )}
          >
            {/* Featured badge */}
            {Motion ? (
              <Motion
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
                className="bg-gold/90 text-night shadow-gold/50 absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-lg backdrop-blur-sm"
              >
                <svg className="fill-night h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {featuredBadgeText}
              </Motion>
            ) : (
              <div className="bg-gold/90 text-night shadow-gold/50 absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-lg backdrop-blur-sm">
                <svg className="fill-night h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {featuredBadgeText}
              </div>
            )}

            {/* Color bar on left */}
            <div
              className={cn('absolute bottom-0 left-0 top-0 w-2 bg-gradient-to-b', colors.gradient)}
            />

            {/* Hover gradient overlay */}
            <div className="from-gold/10 absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <Link
              href={`${blogBaseUrl}/${post.slug}`}
              className="focus:ring-gold focus:ring-offset-night block rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              {/* Image */}
              {imageExists[post.slug] && imageUrl && (
                <div className="bg-night/80 relative h-56 overflow-hidden">
                  <div className="bg-gold/5 absolute inset-0 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                  {ImageComp ? (
                    <ImageComp
                      src={imageUrl}
                      alt={post.title}
                      fill
                      unoptimized
                      className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      priority
                    />
                  ) : (
                    <img
                      src={imageUrl}
                      alt={post.title}
                      className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                    />
                  )}
                  <div className="from-night/90 via-night/30 absolute inset-0 bg-gradient-to-t to-transparent" />
                  <div className="border-gold/0 group-hover:border-gold/20 absolute inset-0 border-2 transition-all duration-500 group-hover:shadow-[inset_0_0_20px_rgba(199,169,98,0.2)]" />
                </div>
              )}

              {/* Content */}
              <div className="p-6 pl-8">
                {/* Category badge */}
                <div className="mb-4 flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold',
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
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    {post.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-ivory group-hover:text-gold mb-3 line-clamp-2 text-2xl font-bold transition-colors">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-ivory/80 mb-4 line-clamp-3">{post.excerpt}</p>

                {/* Metadata */}
                <div className="text-ivory/60 flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
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
                  <div className="flex items-center gap-1">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{post.readingTime}</span>
                  </div>
                </div>

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {post.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="bg-gold/10 border-gold/20 text-gold/80 rounded-md border px-2 py-1 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {post.tags.length > 3 && (
                      <span className="text-ivory/50 text-xs">+{post.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Hover indicator */}
              <div className="from-gold via-gold to-gold/50 absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 bg-gradient-to-r transition-transform duration-500 group-hover:scale-x-100" />
            </Link>
          </ArticleWrapper>
        );
      })}
    </div>
  );

  return (
    <section
      className={cn('relative mb-16', className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={title}
    >
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="text-gold fill-gold h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <h2 className="text-gold text-3xl font-bold">{title}</h2>
        </div>

        {/* Page indicators */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToPage(index)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  index === currentIndex ? 'bg-gold w-8' : 'bg-ivory/30 hover:bg-ivory/50 w-2'
                )}
                aria-label={`Aller à la page ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Previous button */}
        {totalPages > 1 && <NavButton direction="prev" onClick={goToPrevious} />}

        {/* Content */}
        <div className="overflow-hidden" aria-live="polite" aria-atomic="true">
          {AnimatePresence ? (
            <AnimatePresence mode="wait">
              <Wrapper
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
              >
                {carouselContent}
              </Wrapper>
            </AnimatePresence>
          ) : (
            carouselContent
          )}
        </div>

        {/* Next button */}
        {totalPages > 1 && <NavButton direction="next" onClick={goToNext} />}
      </div>

      {/* Autoplay toggle */}
      {totalPages > 1 && autoplayInterval > 0 && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="text-ivory/50 hover:text-ivory/80 text-xs transition-colors"
          >
            {isAutoPlaying ? `⏸ ${pauseLabel}` : `▶ ${playLabel}`}
          </button>
        </div>
      )}
    </section>
  );
}
