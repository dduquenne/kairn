"use client";

import { useState, useEffect, type ElementType } from "react";
import { cn } from "../../utils/cn";
import type {
  BlogPostSummary,
  CategoryColors,
  GetCategoryColors,
  LinkComponent,
  ImageComponent,
} from "./types";

export interface BlogListItemProps {
  /** Blog post data */
  post: BlogPostSummary;
  /** Animation index (for staggered animations) */
  index?: number;
  /** Function to get category colors */
  getCategoryColors?: GetCategoryColors;
  /** Custom link component (defaults to <a>) */
  linkComponent?: LinkComponent;
  /** Custom image component */
  imageComponent?: ImageComponent;
  /** Base URL for blog posts (default: /blog) */
  blogBaseUrl?: string;
  /** Image resolver function */
  resolveImageUrl?: (post: BlogPostSummary) => string | null;
  /** Date format locale (default: fr-FR) */
  dateLocale?: string;
  /** Custom class name */
  className?: string;
  /** Whether to animate the item */
  animate?: boolean;
  /** Motion component for animations */
  motionComponent?: ElementType;
}

const defaultCategoryColors: CategoryColors = {
  bg: "bg-gold/10",
  text: "text-gold",
  border: "border-ivory/10",
  hover: "hover:border-ivory/20",
  gradient: "from-gold to-gold/50",
};

/**
 * Blog list item component for displaying a post in a list view
 *
 * @example
 * ```tsx
 * <BlogListItem
 *   post={post}
 *   linkComponent={Link}
 *   imageComponent={Image}
 * />
 * ```
 */
export function BlogListItem({
  post,
  index = 0,
  getCategoryColors,
  linkComponent: LinkComp,
  imageComponent: ImageComp,
  blogBaseUrl = "/blog",
  resolveImageUrl,
  dateLocale = "fr-FR",
  className,
  animate = true,
  motionComponent: Motion,
}: BlogListItemProps) {
  const [imageExists, setImageExists] = useState(false);
  const colors = getCategoryColors?.(post.category) ?? defaultCategoryColors;

  // Determine image URL
  const imageUrl = resolveImageUrl?.(post) ?? post.imageUrl;

  // Check if image exists
  useEffect(() => {
    if (!imageUrl) {
      setImageExists(false);
      return;
    }

    const checkImage = async () => {
      try {
        const response = await fetch(imageUrl, { method: "HEAD" });
        setImageExists(response.ok);
      } catch {
        setImageExists(false);
      }
    };

    checkImage();
  }, [imageUrl]);

  const formattedDate = new Date(post.date).toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const postUrl = `${blogBaseUrl}/${post.slug}`;

  // Use custom Link component or default anchor
  const Link = LinkComp ?? (({ href, children, className, ...props }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ));

  // Content wrapper (with or without motion)
  const Wrapper = Motion ?? "article";
  const wrapperProps = Motion
    ? {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.3 },
        transition: { duration: 0.5, delay: index * 0.05, ease: "easeOut" },
      }
    : {};

  return (
    <Wrapper
      {...(animate ? wrapperProps : {})}
      className={cn(
        "group relative overflow-hidden rounded-lg border border-ivory/10",
        "bg-gradient-to-br from-night/60 via-night/50 to-night/60 backdrop-blur-sm",
        "transition-all hover:border-ivory/20 hover:bg-night/70",
        "hover:shadow-[0_0_30px_rgba(199,169,98,0.15)]",
        className
      )}
    >
      {/* Color bar on left */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b",
          colors.gradient
        )}
      />

      {/* Animated background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <Link
        href={postUrl}
        className="block focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night rounded-lg"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail image on left */}
          {imageExists && imageUrl && (
            <div className="relative h-40 sm:h-auto sm:w-56 flex-shrink-0 overflow-hidden bg-night/80">
              {ImageComp ? (
                <ImageComp
                  src={imageUrl}
                  alt={post.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, 224px"
                />
              ) : (
                <img
                  src={imageUrl}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              )}
              {/* Overlay gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-night/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          )}

          {/* Content on right */}
          <div className="relative flex flex-1 flex-col justify-between p-6 pl-8">
            <div>
              {/* Category badge */}
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
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
              <h2 className="mb-2 text-xl font-semibold text-ivory transition-colors group-hover:text-gold line-clamp-2">
                {post.title}
              </h2>

              {/* Description */}
              <p className="mb-4 line-clamp-2 text-sm text-ivory/70">
                {post.excerpt}
              </p>
            </div>

            {/* Metadata and tags */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-4 text-xs text-ivory/60">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{post.readingTime}</span>
                </div>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-ivory/5 px-1.5 py-0.5 text-[10px] text-ivory/60"
                    >
                      {tag}
                    </span>
                  ))}
                  {post.tags.length > 3 && (
                    <span className="text-[10px] text-ivory/55">
                      +{post.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hover indicator */}
        <div className="absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 bg-gradient-to-r from-gold to-gold/50 transition-transform group-hover:scale-x-100" />
      </Link>
    </Wrapper>
  );
}

