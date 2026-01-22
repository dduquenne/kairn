/**
 * Types for blog components
 * @package @kairn/ui
 */

/**
 * Blog post summary for list displays
 */
export interface BlogPostSummary {
  /** Unique identifier */
  id?: string;
  /** URL-friendly slug */
  slug: string;
  /** Post title */
  title: string;
  /** Short excerpt/description */
  excerpt: string;
  /** Publication date (ISO string) */
  date: string;
  /** Category name */
  category: string;
  /** Array of tags */
  tags: string[];
  /** Reading time (e.g., "5 min read") */
  readingTime: string;
  /** Featured image URL (optional) */
  imageUrl?: string;
  /** Whether this post is featured */
  featured?: boolean;
  /** Author name (optional) */
  author?: string;
}

/**
 * Full blog post with content
 */
export interface BlogPost extends BlogPostSummary {
  /** Full content (HTML or markdown) */
  content: string;
  /** Meta description for SEO */
  metaDescription?: string;
  /** Last modified date (ISO string) */
  lastModified?: string;
}

/**
 * Table of contents heading
 */
export interface TocHeading {
  /** Unique ID for the heading (used for anchor links) */
  id: string;
  /** Heading text */
  text: string;
  /** Heading level (1-6) */
  level: number;
}

/**
 * Category colors configuration
 */
export interface CategoryColors {
  /** Background color class */
  bg: string;
  /** Text color class */
  text: string;
  /** Border color class */
  border: string;
  /** Hover state classes */
  hover: string;
  /** Gradient classes (for accents) */
  gradient: string;
}

/**
 * Default category colors
 */
export const defaultCategoryColors: CategoryColors = {
  bg: "bg-gold/10",
  text: "text-gold",
  border: "border-gold/20",
  hover: "hover:border-gold/40",
  gradient: "from-gold to-gold/50",
};

/**
 * Function type for getting category colors
 */
export type GetCategoryColors = (category: string) => CategoryColors;

/**
 * Blog list view mode
 */
export type BlogViewMode = "grid" | "list";

/**
 * Sort options for blog posts
 */
export type BlogSortOption = "date-desc" | "date-asc" | "title";

/**
 * Props for link components (to support different routing libraries)
 */
export interface LinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
}

/**
 * Link component type (for dependency injection)
 */
export type LinkComponent = React.ComponentType<LinkProps>;

/**
 * Image component props (to support different image libraries)
 */
export interface ImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  unoptimized?: boolean;
}

/**
 * Image component type (for dependency injection)
 */
export type ImageComponent = React.ComponentType<ImageProps>;
