/**
 * Blog Handler Types
 */

import { z } from 'zod';

/**
 * Blog post status
 */
export type PostStatus = 'draft' | 'published' | 'archived';

/**
 * Blog post schema for creation/update
 */
export const blogPostSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  slug: z
    .string()
    .min(1, 'Le slug est requis')
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Le slug doit être en minuscules avec des tirets'),
  content: z.string().min(1, 'Le contenu est requis'),
  excerpt: z.string().max(500).optional(),
  coverImage: z.string().url().optional().nullable(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  featured: z.boolean().default(false),
  publishedAt: z.string().datetime().optional().nullable(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;

/**
 * Blog post update schema (all fields optional)
 */
export const blogPostUpdateSchema = blogPostSchema.partial().omit({ slug: true });

export type BlogPostUpdateInput = z.infer<typeof blogPostUpdateSchema>;

/**
 * Blog tag schema
 */
export const tagSchema = z.object({
  name: z.string().min(1, 'Le nom du tag est requis').max(50),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Le slug doit être en minuscules avec des tirets'),
  description: z.string().max(200).optional(),
});

export type TagInput = z.infer<typeof tagSchema>;

/**
 * Check slug schema
 */
export const checkSlugSchema = z.object({
  slug: z.string().min(1).max(200),
  excludeId: z.string().optional(), // Exclude current post when updating
});

export type CheckSlugInput = z.infer<typeof checkSlugSchema>;

/**
 * Blog post list query params
 */
export const postsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['draft', 'published', 'archived', 'all']).optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform(v => (v === 'true' ? true : v === 'false' ? false : undefined)),
  search: z.string().max(200).optional(),
  includeUnpublished: z
    .enum(['true', 'false'])
    .optional()
    .transform(v => v === 'true'),
  featuredFirst: z
    .enum(['true', 'false'])
    .optional()
    .transform(v => v === 'true'),
});

export type PostsQueryParams = z.infer<typeof postsQuerySchema>;

/**
 * Blog post returned from API
 */
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  coverImage?: string | null;
  category?: string | null;
  tags: string[];
  status: PostStatus;
  featured: boolean;
  publishedAt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  readingTime?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tag returned from API
 */
export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  postCount?: number;
}

/**
 * Blog handler configuration
 */
export interface BlogHandlerConfig {
  /** Site ID for multi-tenant filtering (required) */
  siteId: string;
  /** Function to get all posts */
  getAllPosts: (options: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    tag?: string;
    featured?: boolean;
    search?: string;
    includeUnpublished?: boolean;
    featuredFirst?: boolean;
    siteId?: string;
  }) => Promise<{ posts: BlogPost[]; total: number }>;
  /** Function to get post by slug */
  getPostBySlug: (slug: string, siteId?: string) => Promise<BlogPost | null>;
  /** Function to get post by ID */
  getPostById: (id: string) => Promise<BlogPost | null>;
  /** Function to create a post */
  createPost: (data: BlogPostInput) => Promise<BlogPost>;
  /** Function to update a post */
  updatePost: (id: string, data: BlogPostUpdateInput) => Promise<BlogPost>;
  /** Function to delete a post */
  deletePost: (id: string) => Promise<void>;
  /** Function to check if slug exists */
  slugExists: (slug: string, excludeId?: string, siteId?: string) => Promise<boolean>;
  /** Function to get all tags */
  getAllTags?: (siteId?: string) => Promise<Tag[]>;
  /** Function to create a tag */
  createTag?: (data: TagInput) => Promise<Tag>;
  /** Function to update a tag */
  updateTag?: (id: string, data: Partial<TagInput>) => Promise<Tag>;
  /** Function to delete a tag */
  deleteTag?: (id: string) => Promise<void>;
  /** Cache revalidation callback */
  onCacheRevalidate?: (paths: string[]) => Promise<void>;
}

/**
 * Validate slug format
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug) {
    return { valid: false, error: 'Le slug est requis' };
  }

  if (slug.length > 200) {
    return { valid: false, error: 'Le slug ne doit pas dépasser 200 caractères' };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      valid: false,
      error: 'Le slug doit être en minuscules, avec uniquement des lettres, chiffres et tirets',
    };
  }

  return { valid: true };
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}
