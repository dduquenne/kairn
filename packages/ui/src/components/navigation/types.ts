/**
 * Types for navigation components
 * @package @kairn/ui
 */

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** URL to navigate to (optional - if not provided, renders as text) */
  href?: string;
}

/**
 * Schema.org BreadcrumbList item
 */
export interface SchemaOrgBreadcrumbItem {
  "@type": "ListItem";
  position: number;
  name: string;
  item: string;
}
