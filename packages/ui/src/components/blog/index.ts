/**
 * Blog components for @kairn/ui
 * @module blog
 */

// Types
export type {
  BlogPostSummary,
  BlogPost,
  TocHeading,
  CategoryColors,
  GetCategoryColors,
  BlogViewMode,
  BlogSortOption,
  LinkProps,
  LinkComponent,
  ImageProps,
  ImageComponent,
} from "./types";
export { defaultCategoryColors } from "./types";

// Components
export { BlogCard, type BlogCardProps } from "./BlogCard";
export { BlogListItem, type BlogListItemProps } from "./BlogListItem";
export { FeaturedCarousel, type FeaturedCarouselProps } from "./FeaturedCarousel";
export {
  ReadingProgressBar,
  ReadingProgressBadge,
  ReadingProgress,
  type ReadingProgressBarProps,
  type ReadingProgressBadgeProps,
} from "./ReadingProgress";
export { ShareButton, type ShareButtonProps } from "./ShareButton";
export { SearchBar, type SearchBarProps } from "./SearchBar";
export { CategoryFilter, type CategoryFilterProps } from "./CategoryFilter";
export { Pagination, type PaginationProps } from "./Pagination";
export { RelatedPosts, type RelatedPostsProps } from "./RelatedPosts";
export { MobileTableOfContents, type MobileTableOfContentsProps } from "./MobileTableOfContents";
