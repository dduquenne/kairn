'use client';

/**
 * Blog Admin Context
 *
 * Provides site-specific configuration for blog admin components.
 * This context allows the shared blog editor to be parameterized
 * per site (categories, author, publisher, style label, etc.).
 */

import type { ToneDefinition } from '@kairn/config';
import { createContext, useContext, type ReactNode } from 'react';

/**
 * Toast notification interface for dependency injection
 */
export interface BlogAdminToast {
  addToast: (toast: {
    title: string;
    description: string;
    variant: 'success' | 'error' | 'info' | 'warning';
  }) => void;
}

/**
 * Configuration for the blog admin editor.
 * Each site provides its own values via BlogAdminProvider.
 */
export interface BlogAdminConfig {
  /** Available blog categories (e.g., ['Comprendre', 'Traverser', ...]) */
  categories: string[];
  /** Map from category name to slug abbreviation */
  categorySlugMap: Record<string, string>;
  /** Default author name for new articles */
  defaultAuthor: string;
  /** Default category for new articles */
  defaultCategory: string;
  /** Publisher name for JSON-LD (e.g., 'Psypnos') */
  publisherName: string;
  /** Publisher URL for JSON-LD (e.g., 'https://psypnos.fr/') */
  publisherUrl: string;
  /** Site style label for the style checkbox (e.g., 'PSYPNOS') */
  siteStyleLabel: string;
  /** Suggested topics for article generation */
  suggestedTopics: string[];
  /** Available tones (from @kairn/config, can be overridden) */
  availableTones: ToneDefinition[];
  /** Toast notification handler */
  toast: BlogAdminToast;
  /** Optional custom social section renderer */
  renderSocialSection?: (props: { blogSlug?: string; isNewPost: boolean }) => ReactNode;
}

const BlogAdminContext = createContext<BlogAdminConfig | null>(null);

/**
 * Hook to access the blog admin configuration.
 * Must be used within a BlogAdminProvider.
 *
 * @returns Blog admin configuration
 * @throws Error if used outside BlogAdminProvider
 */
export function useBlogAdminConfig(): BlogAdminConfig {
  const config = useContext(BlogAdminContext);
  if (!config) {
    throw new Error('useBlogAdminConfig must be used within a BlogAdminProvider');
  }
  return config;
}

interface BlogAdminProviderProps {
  config: BlogAdminConfig;
  children: ReactNode;
}

/**
 * Provider for blog admin configuration.
 * Wrap your blog admin pages with this provider to supply
 * site-specific settings to all blog editor components.
 *
 * @example
 * ```tsx
 * <BlogAdminProvider config={{
 *   categories: ['Comprendre', 'Traverser', 'Découvrir', 'Cheminer'],
 *   categorySlugMap: { Comprendre: 'comprendre', ... },
 *   defaultAuthor: 'David Duquenne',
 *   defaultCategory: 'Comprendre',
 *   publisherName: 'Psypnos',
 *   publisherUrl: 'https://psypnos.fr/',
 *   siteStyleLabel: 'PSYPNOS',
 *   suggestedTopics: ['Les bienfaits de l\'hypnose...'],
 *   availableTones: AVAILABLE_TONES,
 *   toast: { addToast },
 * }}>
 *   <BlogPostForm post={post} />
 * </BlogAdminProvider>
 * ```
 */
export function BlogAdminProvider({ config, children }: BlogAdminProviderProps) {
  return <BlogAdminContext.Provider value={config}>{children}</BlogAdminContext.Provider>;
}
