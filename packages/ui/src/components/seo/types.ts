import type { ReactNode } from 'react';

/**
 * Service type for geo pages
 */
export type GeoServiceType = string;

/**
 * Location information
 */
export interface GeoLocation {
  city: string;
  department?: string;
  region?: string;
  country?: string;
}

/**
 * Practical information for reaching the location
 */
export interface PracticalInfo {
  distance: string;
  duration: string;
  directions: string;
}

/**
 * Testimonial for geo page
 */
export interface GeoTestimonial {
  content: string;
  author: string;
  location: string;
}

/**
 * Related link
 */
export interface RelatedLink {
  label: string;
  href: string;
}

/**
 * Pricing tier
 */
export interface PricingTier {
  label: string;
  price: string;
  note?: string;
}

/**
 * Contact information
 */
export interface ContactInfo {
  address: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  email?: string;
  phone?: string;
  hours?: Array<{ days: string; hours: string }>;
}

/**
 * Breadcrumb item
 */
export interface GeoBreadcrumbItem {
  name: string;
  href: string;
}

/**
 * Service configuration for geo pages
 */
export interface ServiceConfig {
  type: GeoServiceType;
  label: string;
  href: string;
}

/**
 * Props for the GeoPage component
 */
export interface GeoPageProps {
  // SEO and content
  title: string;
  subtitle: string;
  description: string;
  service: ServiceConfig;
  location: GeoLocation;

  // Breadcrumb
  breadcrumbItems: GeoBreadcrumbItem[];
  baseUrl: string;

  // Main content (HTML string)
  mainContent: string;
  benefits: string[];

  // Testimonials
  testimonials?: GeoTestimonial[];

  // Practical information
  practicalInfo: PracticalInfo;
  contactInfo: ContactInfo;

  // Pricing (optional)
  pricing?: PricingTier[];

  // Related links
  relatedLinks?: RelatedLink[];

  // Google Maps embed URL
  mapsEmbedUrl?: string;

  // Schema JSON-LD
  schemaData?: object;

  // Slots for custom components
  navigationSlot?: ReactNode;
  footerSlot?: ReactNode;

  // Custom class names
  className?: string;

  // Custom colors
  colors?: {
    primary?: string;
    background?: string;
    text?: string;
    border?: string;
  };

  // Hero background image
  heroImage?: string;

  // CTA configuration
  ctaHref?: string;
  ctaLabel?: string;
  ctaSubtext?: string;
}
