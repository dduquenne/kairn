// Components
export { ToastProvider, useToast, type Toast, type ToastVariant, type ToastProviderProps } from './components/toast';
export { Skeleton, type SkeletonProps } from './components/skeleton';
export { Tabs, type TabItem, type TabsProps } from './components/tabs';
export { Accordion, type AccordionItem, type AccordionProps } from './components/accordion';

// Layout Components
export { Header, type HeaderProps, type HeaderContext } from './components/header';
export { Footer, type FooterProps, type FooterLink } from './components/footer';
export { SocialLinks, type SocialLinksProps, type SocialLink, type SocialPlatform } from './components/social-links';
export { CTAButton, type CTAButtonProps, type CTAButtonVariant } from './components/cta-button';

// Admin Components
export { AdminSidebar, type AdminSidebarProps, type NavigationItem, defaultAdminNavigation } from './components/admin-sidebar';
export { MobileNav, type MobileNavProps } from './components/mobile-nav';

// Form Components
export {
  FormField,
  FormSection,
  ContactForm,
  useFormValidation,
  type FormFieldProps,
  type FormSectionProps,
  type ContactFormProps,
  type UseFormValidationReturn,
  type FormFieldConfig,
  type FormSectionConfig,
  type FormSubmissionStatus,
  type FormState,
  type FormConfig,
  type FormMessages,
  type FormColors,
} from './components/forms';

// Blog Components
export {
  BlogCard,
  BlogListItem,
  FeaturedCarousel,
  ReadingProgressBar,
  ReadingProgressBadge,
  ReadingProgress,
  ShareButton,
  SearchBar,
  CategoryFilter,
  Pagination,
  RelatedPosts,
  MobileTableOfContents,
  defaultCategoryColors,
  type BlogCardProps,
  type BlogListItemProps,
  type FeaturedCarouselProps,
  type ReadingProgressBarProps,
  type ReadingProgressBadgeProps,
  type ShareButtonProps,
  type SearchBarProps,
  type CategoryFilterProps,
  type PaginationProps,
  type RelatedPostsProps,
  type MobileTableOfContentsProps,
  type BlogPostSummary,
  type BlogPost,
  type TocHeading,
  type CategoryColors,
  type GetCategoryColors,
  type BlogViewMode,
  type BlogSortOption,
  type LinkProps,
  type LinkComponent,
  type ImageProps,
  type ImageComponent,
} from './components/blog';

// Testimonial Components
export {
  TestimonialCard,
  TestimonialCardFromData,
  TestimonialsCarousel,
  type TestimonialCardProps,
  type TestimonialsCarouselProps,
  type Testimonial,
} from './components/testimonials';

// Navigation Components
export {
  Breadcrumb,
  BreadcrumbStructuredData,
  BackButton,
  type BreadcrumbProps,
  type BreadcrumbStructuredDataProps,
  type BackButtonProps,
  type BreadcrumbItem,
  type SchemaOrgBreadcrumbItem,
} from './components/navigation';

// Utils
export { cn } from './utils/cn';
