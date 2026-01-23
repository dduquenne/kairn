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

export interface BlogCardProps {
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
  /** Base URL for images (default: /images/blog) */
  imageBaseUrl?: string;
  /** Image resolver function (overrides default logic) */
  resolveImageUrl?: (post: BlogPostSummary) => string | null;
  /** Date format locale (default: fr-FR) */
  dateLocale?: string;
  /** Custom class name */
  className?: string;
  /** Whether to animate the card */
  animate?: boolean;
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
 * Blog card component for displaying a post in a grid
 *
 * @example
 * ```tsx
 * <BlogCard
 *   post={post}
 *   linkComponent={Link}
 *   imageComponent={Image}
 *   getCategoryColors={getCategoryColors}
 * />
 * ```
 */
export function BlogCard({
  post,
  index = 0,
  getCategoryColors,
  linkComponent: LinkComp,
  imageComponent: ImageComp,
  blogBaseUrl = "/blog",
  imageBaseUrl = "/images/blog",
  resolveImageUrl,
  dateLocale = "fr-FR",
  className,
  animate = true,
  motionComponent: Motion,
}: BlogCardProps) {
  const [imageExists, setImageExists] = useState(false);
  const colors = getCategoryColors?.(post.category) ?? defaultCategoryColors;

  // Determine image URL
  const imageUrl =
    resolveImageUrl?.(post) ??
    post.imageUrl ??
    `${imageBaseUrl}/${post.slug}.webp`;

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
    timeZone: "Europe/Paris",
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
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, delay: index * 0.1 },
      }
    : {};

  return (
    <Wrapper
      {...(animate ? wrapperProps : {})}
      className={cn(
        "group relative overflow-hidden rounded-lg border",
        colors.border,
        colors.hover,
        "bg-night/50 backdrop-blur-sm transition-all hover:bg-night/70",
        className
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
        href={postUrl}
        className="block focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night rounded-lg"
      >
        {/* Image */}
        {imageExists && ImageComp && (
          <div className="relative h-48 overflow-hidden bg-night/80">
            <ImageComp
              src={imageUrl}
              alt={post.title}
              fill
              unoptimized
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        )}

        {/* Fallback for no custom image component */}
        {imageExists && !ImageComp && (
          <div className="relative h-48 overflow-hidden bg-night/80">
            <img
              src={imageUrl}
              alt={post.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6 pl-8">
          {/* Category badge */}
          <div className="mb-4 flex items-center gap-2">
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
          <h2 className="mb-3 text-2xl font-semibold text-ivory transition-colors group-hover:text-gold">
            {post.title}
          </h2>

          {/* Description */}
          <p className="mb-4 line-clamp-3 text-ivory/70">{post.excerpt}</p>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-ivory/60">
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
            <div className="mt-3 flex flex-wrap gap-1">
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

        {/* Hover indicator */}
        <div className="absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 bg-gradient-to-r from-gold to-gold/50 transition-transform group-hover:scale-x-100" />
      </Link>
    </Wrapper>
  );
}

