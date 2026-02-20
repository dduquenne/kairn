/**
 * Blog Flow Integration Tests
 *
 * Tests the complete blog workflow logic:
 * - Create post (authenticated)
 * - Publish post
 * - View post (public)
 * - Update post
 * - Delete post
 */

import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Simulated blog service that mirrors the actual blog route behavior
 * without depending on Next.js route handlers
 */

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  published: boolean;
  featured: boolean;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  role: string;
}

interface CreatePostInput {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  published?: boolean;
  featured?: boolean;
}

interface UpdatePostInput {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  published?: boolean;
  featured?: boolean;
}

interface BlogResult<T = BlogPost> {
  success: boolean;
  status: number;
  data?: T;
  error?: { code: string; message: string };
}

// Mock data stores
const mockPostStore: Map<string, BlogPost> = new Map();
let currentUser: User | null = null;

// Slug validation
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

function slugExists(slug: string): boolean {
  return mockPostStore.has(slug);
}

// Generate unique ID
function generateId(): string {
  return `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Calculate reading time
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

// Sanitize content
function sanitizeContent(content: string): string {
  // Simple sanitization - remove script tags
  return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

// Create post handler
async function handleCreatePost(input: CreatePostInput, user: User | null): Promise<BlogResult> {
  // Check authentication
  if (!user || user.role !== 'admin') {
    return {
      success: false,
      status: 401,
      error: { code: 'UNAUTHORIZED', message: 'Non autorisé' },
    };
  }

  // Validate required fields
  if (!input.title || !input.slug || !input.content) {
    return {
      success: false,
      status: 400,
      error: { code: 'INVALID_INPUT', message: 'Champs requis manquants' },
    };
  }

  // Validate slug format
  if (!isValidSlug(input.slug)) {
    return {
      success: false,
      status: 400,
      error: {
        code: 'INVALID_SLUG',
        message: 'Le slug doit être en minuscules avec des tirets',
      },
    };
  }

  // Check for duplicate slug
  if (slugExists(input.slug)) {
    return {
      success: false,
      status: 409,
      error: {
        code: 'DUPLICATE_SLUG',
        message: 'Un article avec ce slug existe déjà',
      },
    };
  }

  // Create the post
  const now = new Date().toISOString();
  const post: BlogPost = {
    id: generateId(),
    slug: input.slug,
    title: input.title,
    content: sanitizeContent(input.content),
    excerpt: input.excerpt || input.content.substring(0, 160),
    category: input.category || 'Général',
    tags: input.tags || [],
    published: input.published || false,
    featured: input.featured || false,
    readingTime: calculateReadingTime(input.content),
    createdAt: now,
    updatedAt: now,
  };

  mockPostStore.set(post.slug, post);

  return {
    success: true,
    status: 201,
    data: post,
  };
}

// Get all posts handler
async function handleGetAllPosts(options: {
  includeUnpublished?: boolean;
  category?: string;
  featured?: boolean;
  limit?: number;
}): Promise<BlogResult<BlogPost[]>> {
  let posts = Array.from(mockPostStore.values());

  // Filter unpublished unless requested
  if (!options.includeUnpublished) {
    posts = posts.filter(p => p.published);
  }

  // Filter by category
  if (options.category) {
    posts = posts.filter(p => p.category === options.category);
  }

  // Filter featured
  if (options.featured !== undefined) {
    posts = posts.filter(p => p.featured === options.featured);
  }

  // Apply limit
  if (options.limit && options.limit > 0) {
    posts = posts.slice(0, options.limit);
  }

  // Sort by creation date (newest first)
  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    success: true,
    status: 200,
    data: posts,
  };
}

// Get single post handler
async function handleGetPost(slug: string, includeUnpublished = false): Promise<BlogResult> {
  const post = mockPostStore.get(slug);

  if (!post) {
    return {
      success: false,
      status: 404,
      error: { code: 'NOT_FOUND', message: 'Article non trouvé' },
    };
  }

  // Check if post is published or user requested unpublished
  if (!post.published && !includeUnpublished) {
    return {
      success: false,
      status: 404,
      error: { code: 'NOT_FOUND', message: 'Article non trouvé' },
    };
  }

  return {
    success: true,
    status: 200,
    data: post,
  };
}

// Update post handler
async function handleUpdatePost(
  slug: string,
  input: UpdatePostInput,
  user: User | null
): Promise<BlogResult> {
  // Check authentication
  if (!user || user.role !== 'admin') {
    return {
      success: false,
      status: 401,
      error: { code: 'UNAUTHORIZED', message: 'Non autorisé' },
    };
  }

  // Find the post
  const post = mockPostStore.get(slug);
  if (!post) {
    return {
      success: false,
      status: 404,
      error: { code: 'NOT_FOUND', message: 'Article non trouvé' },
    };
  }

  // Validate new slug if provided
  if (input.slug && input.slug !== slug) {
    if (!isValidSlug(input.slug)) {
      return {
        success: false,
        status: 400,
        error: {
          code: 'INVALID_SLUG',
          message: 'Le slug doit être en minuscules avec des tirets',
        },
      };
    }
    if (slugExists(input.slug)) {
      return {
        success: false,
        status: 409,
        error: {
          code: 'DUPLICATE_SLUG',
          message: 'Un article avec ce slug existe déjà',
        },
      };
    }
  }

  // Update the post
  const updatedPost: BlogPost = {
    ...post,
    title: input.title ?? post.title,
    slug: input.slug ?? post.slug,
    content: input.content ? sanitizeContent(input.content) : post.content,
    excerpt: input.excerpt ?? post.excerpt,
    category: input.category ?? post.category,
    tags: input.tags ?? post.tags,
    published: input.published ?? post.published,
    featured: input.featured ?? post.featured,
    readingTime: input.content ? calculateReadingTime(input.content) : post.readingTime,
    updatedAt: new Date().toISOString(),
  };

  // Handle slug change
  if (input.slug && input.slug !== slug) {
    mockPostStore.delete(slug);
  }
  mockPostStore.set(updatedPost.slug, updatedPost);

  return {
    success: true,
    status: 200,
    data: updatedPost,
  };
}

// Patch post handler (for publish/feature only)
async function handlePatchPost(
  slug: string,
  input: { published?: boolean; featured?: boolean },
  user: User | null
): Promise<BlogResult> {
  // Check authentication
  if (!user || user.role !== 'admin') {
    return {
      success: false,
      status: 401,
      error: { code: 'UNAUTHORIZED', message: 'Non autorisé' },
    };
  }

  // Validate only allowed fields
  const allowedFields = ['published', 'featured'];
  const inputFields = Object.keys(input);
  const hasInvalidFields = inputFields.some(f => !allowedFields.includes(f));

  if (hasInvalidFields || inputFields.length === 0) {
    return {
      success: false,
      status: 400,
      error: {
        code: 'INVALID_INPUT',
        message: 'Seuls les champs published et featured sont autorisés',
      },
    };
  }

  // Find the post
  const post = mockPostStore.get(slug);
  if (!post) {
    return {
      success: false,
      status: 404,
      error: { code: 'NOT_FOUND', message: 'Article non trouvé' },
    };
  }

  // Update only allowed fields
  const updatedPost: BlogPost = {
    ...post,
    published: input.published ?? post.published,
    featured: input.featured ?? post.featured,
    updatedAt: new Date().toISOString(),
  };

  mockPostStore.set(slug, updatedPost);

  return {
    success: true,
    status: 200,
    data: updatedPost,
  };
}

// Delete post handler
async function handleDeletePost(
  slug: string,
  user: User | null
): Promise<BlogResult<{ message: string }>> {
  // Check authentication
  if (!user || user.role !== 'admin') {
    return {
      success: false,
      status: 401,
      error: { code: 'UNAUTHORIZED', message: 'Non autorisé' },
    };
  }

  // Find and delete the post
  const post = mockPostStore.get(slug);
  if (!post) {
    return {
      success: false,
      status: 404,
      error: { code: 'NOT_FOUND', message: 'Article non trouvé' },
    };
  }

  mockPostStore.delete(slug);

  return {
    success: true,
    status: 200,
    data: { message: 'Article supprimé avec succès' },
  };
}

describe('Blog Flow Integration', () => {
  const adminUser: User = {
    id: 'user-123',
    email: 'admin@psypnos.fr',
    role: 'admin',
  };

  const regularUser: User = {
    id: 'user-456',
    email: 'user@example.com',
    role: 'user',
  };

  beforeEach(() => {
    // Clear all stores
    mockPostStore.clear();
    currentUser = null;
  });

  describe('Create Post Flow', () => {
    it('should create a new blog post when authenticated as admin', async () => {
      const result = await handleCreatePost(
        {
          title: 'Article de test',
          slug: 'test-article',
          content: '<p>Contenu de test</p>',
        },
        adminUser
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(201);
      expect(result.data?.slug).toBe('test-article');
      expect(result.data?.title).toBe('Article de test');
    });

    it('should return 401 when not authenticated', async () => {
      const result = await handleCreatePost(
        {
          title: 'Test',
          slug: 'test',
          content: 'Content',
        },
        null
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for non-admin user', async () => {
      const result = await handleCreatePost(
        {
          title: 'Test',
          slug: 'test',
          content: 'Content',
        },
        regularUser
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });

    it('should return 400 for invalid slug format', async () => {
      const result = await handleCreatePost(
        {
          title: 'Test',
          slug: 'Invalid Slug!',
          content: 'Content',
        },
        adminUser
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error?.code).toBe('INVALID_SLUG');
    });

    it('should return 409 for duplicate slug', async () => {
      // First create a post
      await handleCreatePost(
        {
          title: 'First',
          slug: 'existing-post',
          content: 'Content',
        },
        adminUser
      );

      // Try to create with same slug
      const result = await handleCreatePost(
        {
          title: 'Second',
          slug: 'existing-post',
          content: 'Different content',
        },
        adminUser
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(409);
      expect(result.error?.code).toBe('DUPLICATE_SLUG');
    });

    it('should return 400 for missing required fields', async () => {
      const result = await handleCreatePost(
        {
          title: '',
          slug: 'test',
          content: '',
        },
        adminUser
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
    });

    it('should calculate reading time', async () => {
      const longContent = 'word '.repeat(400); // 400 words + extra spaces = ~3 minutes
      const result = await handleCreatePost(
        {
          title: 'Long Article',
          slug: 'long-article',
          content: longContent,
        },
        adminUser
      );

      expect(result.success).toBe(true);
      expect(result.data?.readingTime).toBeGreaterThanOrEqual(2);
    });

    it('should sanitize content', async () => {
      const result = await handleCreatePost(
        {
          title: 'Test',
          slug: 'test-sanitize',
          content: '<p>Safe content</p><script>alert("xss")</script>',
        },
        adminUser
      );

      expect(result.success).toBe(true);
      expect(result.data?.content).not.toContain('<script>');
    });
  });

  describe('List Posts Flow', () => {
    beforeEach(async () => {
      // Create some test posts
      await handleCreatePost(
        {
          title: 'Published Post 1',
          slug: 'published-1',
          content: 'Content 1',
          category: 'Hypnose',
          published: true,
          featured: true,
        },
        adminUser
      );
      await handleCreatePost(
        {
          title: 'Published Post 2',
          slug: 'published-2',
          content: 'Content 2',
          category: 'Psychothérapie',
          published: true,
        },
        adminUser
      );
      await handleCreatePost(
        {
          title: 'Draft Post',
          slug: 'draft-post',
          content: 'Draft content',
          published: false,
        },
        adminUser
      );
    });

    it('should return only published posts by default', async () => {
      const result = await handleGetAllPosts({});

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(2);
      expect(result.data?.every(p => p.published)).toBe(true);
    });

    it('should return all posts including unpublished when requested', async () => {
      const result = await handleGetAllPosts({ includeUnpublished: true });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(3);
    });

    it('should filter posts by category', async () => {
      const result = await handleGetAllPosts({ category: 'Hypnose' });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
      expect(result.data?.[0]?.category).toBe('Hypnose');
    });

    it('should filter featured posts', async () => {
      const result = await handleGetAllPosts({ featured: true });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
      expect(result.data?.[0]?.featured).toBe(true);
    });

    it('should limit results', async () => {
      const result = await handleGetAllPosts({ limit: 1 });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
    });
  });

  describe('Get Single Post Flow', () => {
    beforeEach(async () => {
      await handleCreatePost(
        {
          title: 'Published Post',
          slug: 'published-post',
          content: 'Published content',
          published: true,
        },
        adminUser
      );
      await handleCreatePost(
        {
          title: 'Draft Post',
          slug: 'draft-post',
          content: 'Draft content',
          published: false,
        },
        adminUser
      );
    });

    it('should return a published post by slug', async () => {
      const result = await handleGetPost('published-post');

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data?.slug).toBe('published-post');
    });

    it('should return 404 for non-existent post', async () => {
      const result = await handleGetPost('non-existent');

      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
    });

    it('should return 404 for unpublished post by default', async () => {
      const result = await handleGetPost('draft-post');

      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
    });

    it('should return unpublished post when includeUnpublished is true', async () => {
      const result = await handleGetPost('draft-post', true);

      expect(result.success).toBe(true);
      expect(result.data?.slug).toBe('draft-post');
    });
  });

  describe('Update Post Flow', () => {
    beforeEach(async () => {
      await handleCreatePost(
        {
          title: 'Original Title',
          slug: 'test-post',
          content: 'Original content',
        },
        adminUser
      );
    });

    it('should update a post when authenticated as admin', async () => {
      const result = await handleUpdatePost('test-post', { title: 'Updated Title' }, adminUser);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data?.title).toBe('Updated Title');
    });

    it('should return 401 when not authenticated', async () => {
      const result = await handleUpdatePost('test-post', { title: 'Updated' }, null);

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });

    it('should return 404 when post not found', async () => {
      const result = await handleUpdatePost('non-existent', { title: 'Updated' }, adminUser);

      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
    });

    it('should handle slug change', async () => {
      const result = await handleUpdatePost('test-post', { slug: 'new-slug' }, adminUser);

      expect(result.success).toBe(true);
      expect(result.data?.slug).toBe('new-slug');

      // Old slug should not exist
      const oldResult = await handleGetPost('test-post', true);
      expect(oldResult.success).toBe(false);

      // New slug should work
      const newResult = await handleGetPost('new-slug', true);
      expect(newResult.success).toBe(true);
    });

    it('should reject invalid new slug', async () => {
      const result = await handleUpdatePost('test-post', { slug: 'Invalid Slug!' }, adminUser);

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
    });
  });

  describe('Patch Post Flow', () => {
    beforeEach(async () => {
      await handleCreatePost(
        {
          title: 'Test Post',
          slug: 'test-post',
          content: 'Content',
          published: false,
          featured: false,
        },
        adminUser
      );
    });

    it('should publish a post', async () => {
      const result = await handlePatchPost('test-post', { published: true }, adminUser);

      expect(result.success).toBe(true);
      expect(result.data?.published).toBe(true);
    });

    it('should feature a post', async () => {
      const result = await handlePatchPost('test-post', { featured: true }, adminUser);

      expect(result.success).toBe(true);
      expect(result.data?.featured).toBe(true);
    });

    it('should reject invalid fields', async () => {
      const result = await handlePatchPost(
        'test-post',
        { title: 'Not allowed' } as { published?: boolean; featured?: boolean },
        adminUser
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
    });

    it('should reject empty patch', async () => {
      const result = await handlePatchPost('test-post', {}, adminUser);

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
      const result = await handlePatchPost('test-post', { published: true }, null);

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  describe('Delete Post Flow', () => {
    beforeEach(async () => {
      await handleCreatePost(
        {
          title: 'To Delete',
          slug: 'to-delete',
          content: 'Content',
        },
        adminUser
      );
    });

    it('should delete a post when authenticated as admin', async () => {
      const result = await handleDeletePost('to-delete', adminUser);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data?.message).toContain('supprimé');

      // Post should no longer exist
      const getResult = await handleGetPost('to-delete', true);
      expect(getResult.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const result = await handleDeletePost('to-delete', null);

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });

    it('should return 404 when post not found', async () => {
      const result = await handleDeletePost('non-existent', adminUser);

      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
    });
  });

  describe('Complete Create-Publish-View Flow', () => {
    it('should create, publish, and view a post', async () => {
      // Step 1: Create post (unpublished by default)
      const createResult = await handleCreatePost(
        {
          title: 'Full Flow Article',
          slug: 'full-flow',
          content: 'Test content for full flow',
        },
        adminUser
      );

      expect(createResult.success).toBe(true);
      expect(createResult.status).toBe(201);
      expect(createResult.data?.published).toBe(false);

      // Step 2: Try to view unpublished post (should fail)
      const viewUnpublishedResult = await handleGetPost('full-flow');
      expect(viewUnpublishedResult.success).toBe(false);
      expect(viewUnpublishedResult.status).toBe(404);

      // Step 3: Publish the post
      const publishResult = await handlePatchPost('full-flow', { published: true }, adminUser);

      expect(publishResult.success).toBe(true);
      expect(publishResult.data?.published).toBe(true);

      // Step 4: View published post (should succeed)
      const viewPublishedResult = await handleGetPost('full-flow');

      expect(viewPublishedResult.success).toBe(true);
      expect(viewPublishedResult.status).toBe(200);
      expect(viewPublishedResult.data?.title).toBe('Full Flow Article');
    });

    it('should create, update, feature, and list featured posts', async () => {
      // Step 1: Create multiple posts
      await handleCreatePost(
        {
          title: 'Regular Post',
          slug: 'regular-post',
          content: 'Regular content',
          published: true,
        },
        adminUser
      );

      await handleCreatePost(
        {
          title: 'Feature Candidate',
          slug: 'feature-candidate',
          content: 'Feature content',
          published: true,
        },
        adminUser
      );

      // Step 2: Feature one post
      await handlePatchPost('feature-candidate', { featured: true }, adminUser);

      // Step 3: List only featured posts
      const result = await handleGetAllPosts({ featured: true });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
      expect(result.data?.[0]?.slug).toBe('feature-candidate');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in content', async () => {
      const result = await handleCreatePost(
        {
          title: 'Article avec des caractères spéciaux: é, è, ê, à, ù, ç, œ, €',
          slug: 'caracteres-speciaux',
          content: '<p>Contenu avec des émojis: 🎉🚀💡</p>',
        },
        adminUser
      );

      expect(result.success).toBe(true);
      expect(result.data?.title).toContain('é');
      expect(result.data?.content).toContain('🎉');
    });

    it('should handle very long content', async () => {
      const longContent = 'word '.repeat(10000); // Very long content
      const result = await handleCreatePost(
        {
          title: 'Long Article',
          slug: 'long-article',
          content: longContent,
        },
        adminUser
      );

      expect(result.success).toBe(true);
      expect(result.data?.readingTime).toBeGreaterThan(40);
    });

    it('should preserve all fields when updating single field', async () => {
      const original = await handleCreatePost(
        {
          title: 'Original',
          slug: 'preserve-fields',
          content: 'Content',
          category: 'Hypnose',
          tags: ['tag1', 'tag2'],
          published: true,
          featured: true,
        },
        adminUser
      );

      const updated = await handleUpdatePost(
        'preserve-fields',
        { title: 'Updated Title' },
        adminUser
      );

      expect(updated.success).toBe(true);
      expect(updated.data?.title).toBe('Updated Title');
      expect(updated.data?.category).toBe('Hypnose');
      expect(updated.data?.tags).toEqual(['tag1', 'tag2']);
      expect(updated.data?.published).toBe(true);
      expect(updated.data?.featured).toBe(true);
    });
  });
});
