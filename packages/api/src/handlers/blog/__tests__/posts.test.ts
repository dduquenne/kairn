/**
 * Blog Posts Handler Tests
 *
 * Tests for blog post CRUD operations including:
 * - List posts with pagination and filtering
 * - Get post by slug
 * - Create, update, delete posts
 * - Slug validation and availability check
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@kairn/core', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
    withScope: vi.fn(),
  }),
}));

vi.mock('@kairn/db', () => ({
  handlePrismaError: vi.fn().mockReturnValue(null),
}));

import {
  handleGetPosts,
  handleGetPostBySlug,
  handleCreatePost,
  handleUpdatePost,
  handleDeletePost,
  handleCheckSlug,
} from '../posts';
import type { BlogHandlerConfig, BlogPost } from '../types';

/**
 * Create a mock blog post
 */
function createMockPost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: 'post-123',
    title: 'Test Post',
    slug: 'test-post',
    content: '<p>Test content</p>',
    excerpt: 'Test excerpt',
    category: 'Test Category',
    tags: ['tag1', 'tag2'],
    status: 'published',
    featured: false,
    publishedAt: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    ...overrides,
  };
}

/**
 * Create a mock request
 */
function createMockRequest(body?: unknown, url = 'http://localhost:3000/api/blog/posts'): Request {
  return {
    json: vi.fn().mockResolvedValue(body ?? {}),
    clone: vi.fn().mockReturnThis(),
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    url,
  } as unknown as Request;
}

/**
 * Create a basic blog handler config
 */
function createMockConfig(overrides: Partial<BlogHandlerConfig> = {}): BlogHandlerConfig {
  return {
    getAllPosts: vi.fn().mockResolvedValue({ posts: [], total: 0 }),
    getPostBySlug: vi.fn().mockResolvedValue(null),
    getPostById: vi.fn().mockResolvedValue(null),
    createPost: vi.fn().mockResolvedValue(createMockPost()),
    updatePost: vi.fn().mockResolvedValue(createMockPost()),
    deletePost: vi.fn().mockResolvedValue(undefined),
    slugExists: vi.fn().mockResolvedValue(false),
    onCacheRevalidate: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('Blog Posts Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleGetPosts', () => {
    it('should return paginated posts', async () => {
      const mockPosts = [
        createMockPost({ id: 'post-1', title: 'Post 1', slug: 'post-1' }),
        createMockPost({ id: 'post-2', title: 'Post 2', slug: 'post-2' }),
      ];

      const config = createMockConfig({
        getAllPosts: vi.fn().mockResolvedValue({ posts: mockPosts, total: 2 }),
      });

      const request = createMockRequest(undefined, 'http://localhost:3000/api/blog/posts');
      const result = await handleGetPosts(request, config);

      expect(result.statusCode).toBe(200);
      expect(result.response).toMatchObject({
        success: true,
        data: mockPosts,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it('should apply pagination parameters', async () => {
      const getAllPosts = vi.fn().mockResolvedValue({ posts: [], total: 0 });
      const config = createMockConfig({ getAllPosts });

      const request = createMockRequest(
        undefined,
        'http://localhost:3000/api/blog/posts?page=2&limit=10'
      );
      await handleGetPosts(request, config);

      expect(getAllPosts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
        })
      );
    });

    it('should apply filtering parameters', async () => {
      const getAllPosts = vi.fn().mockResolvedValue({ posts: [], total: 0 });
      const config = createMockConfig({ getAllPosts });

      const request = createMockRequest(
        undefined,
        'http://localhost:3000/api/blog/posts?status=published&category=Tech&featured=true'
      );
      await handleGetPosts(request, config);

      expect(getAllPosts).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
          category: 'Tech',
          featured: true,
        })
      );
    });

    it('should apply search parameter', async () => {
      const getAllPosts = vi.fn().mockResolvedValue({ posts: [], total: 0 });
      const config = createMockConfig({ getAllPosts });

      const request = createMockRequest(
        undefined,
        'http://localhost:3000/api/blog/posts?search=hypnose'
      );
      await handleGetPosts(request, config);

      expect(getAllPosts).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'hypnose',
        })
      );
    });

    it('should use siteId from config', async () => {
      const getAllPosts = vi.fn().mockResolvedValue({ posts: [], total: 0 });
      const config = createMockConfig({
        getAllPosts,
        siteId: 'site-psypnos',
      });

      const request = createMockRequest(undefined, 'http://localhost:3000/api/blog/posts');
      await handleGetPosts(request, config);

      expect(getAllPosts).toHaveBeenCalledWith(
        expect.objectContaining({
          siteId: 'site-psypnos',
        })
      );
    });

    it('should set cache headers for published posts', async () => {
      const config = createMockConfig({
        getAllPosts: vi.fn().mockResolvedValue({ posts: [], total: 0 }),
      });

      const request = createMockRequest(undefined, 'http://localhost:3000/api/blog/posts');
      const result = await handleGetPosts(request, config);

      expect(result.headers['Cache-Control']).toContain('public');
    });

    it('should disable cache for unpublished posts', async () => {
      const config = createMockConfig({
        getAllPosts: vi.fn().mockResolvedValue({ posts: [], total: 0 }),
      });

      const request = createMockRequest(
        undefined,
        'http://localhost:3000/api/blog/posts?includeUnpublished=true'
      );
      const result = await handleGetPosts(request, config);

      expect(result.headers['Cache-Control']).toContain('private');
    });

    it('should return validation error for invalid query params', async () => {
      const config = createMockConfig();
      const request = createMockRequest(undefined, 'http://localhost:3000/api/blog/posts?page=-1');
      const result = await handleGetPosts(request, config);

      expect(result.statusCode).toBe(400);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      const config = createMockConfig({
        getAllPosts: vi.fn().mockRejectedValue(new Error('Database error')),
      });

      const request = createMockRequest(undefined, 'http://localhost:3000/api/blog/posts');
      const result = await handleGetPosts(request, config);

      expect(result.statusCode).toBe(500);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
        },
      });
    });
  });

  describe('handleGetPostBySlug', () => {
    it('should return a post by slug', async () => {
      const mockPost = createMockPost();
      const config = createMockConfig({
        getPostBySlug: vi.fn().mockResolvedValue(mockPost),
      });

      const result = await handleGetPostBySlug('test-post', config);

      expect(result.statusCode).toBe(200);
      expect(result.response).toMatchObject({
        success: true,
        data: mockPost,
      });
    });

    it('should return 404 for non-existent post', async () => {
      const config = createMockConfig({
        getPostBySlug: vi.fn().mockResolvedValue(null),
      });

      const result = await handleGetPostBySlug('non-existent', config);

      expect(result.statusCode).toBe(404);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND',
        },
      });
    });

    it('should set public cache for published posts', async () => {
      const mockPost = createMockPost({ status: 'published' });
      const config = createMockConfig({
        getPostBySlug: vi.fn().mockResolvedValue(mockPost),
      });

      const result = await handleGetPostBySlug('test-post', config);

      expect(result.headers['Cache-Control']).toContain('public');
    });

    it('should set private cache for draft posts', async () => {
      const mockPost = createMockPost({ status: 'draft' });
      const config = createMockConfig({
        getPostBySlug: vi.fn().mockResolvedValue(mockPost),
      });

      const result = await handleGetPostBySlug('test-post', config);

      expect(result.headers['Cache-Control']).toContain('private');
    });

    it('should handle database errors gracefully', async () => {
      const config = createMockConfig({
        getPostBySlug: vi.fn().mockRejectedValue(new Error('Database error')),
      });

      const result = await handleGetPostBySlug('test-post', config);

      expect(result.statusCode).toBe(500);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
        },
      });
    });
  });

  describe('handleCreatePost', () => {
    it('should create a new post', async () => {
      const newPost = createMockPost();
      const createPost = vi.fn().mockResolvedValue(newPost);
      const config = createMockConfig({
        createPost,
        slugExists: vi.fn().mockResolvedValue(false),
      });

      const request = createMockRequest({
        title: 'New Post',
        slug: 'new-post',
        content: '<p>New content</p>',
        status: 'draft',
      });

      const result = await handleCreatePost(request, config);

      expect(result.statusCode).toBe(201);
      expect(result.response).toMatchObject({
        success: true,
        data: newPost,
      });
    });

    it('should return 409 if slug already exists', async () => {
      const config = createMockConfig({
        slugExists: vi.fn().mockResolvedValue(true),
      });

      const request = createMockRequest({
        title: 'New Post',
        slug: 'existing-post',
        content: '<p>Content</p>',
      });

      const result = await handleCreatePost(request, config);

      expect(result.statusCode).toBe(409);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'CONFLICT',
        },
      });
    });

    it('should return validation error for invalid slug format', async () => {
      const config = createMockConfig();

      const request = createMockRequest({
        title: 'New Post',
        slug: 'Invalid Slug With Spaces',
        content: '<p>Content</p>',
      });

      const result = await handleCreatePost(request, config);

      expect(result.statusCode).toBe(400);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
        },
      });
    });

    it('should return validation error for missing required fields', async () => {
      const config = createMockConfig();

      const request = createMockRequest({
        title: 'New Post',
        // Missing slug and content
      });

      const result = await handleCreatePost(request, config);

      expect(result.statusCode).toBe(400);
    });

    it('should trigger cache revalidation after creation', async () => {
      const newPost = createMockPost({ slug: 'new-post' });
      const onCacheRevalidate = vi.fn().mockResolvedValue(undefined);
      const config = createMockConfig({
        createPost: vi.fn().mockResolvedValue(newPost),
        slugExists: vi.fn().mockResolvedValue(false),
        onCacheRevalidate,
      });

      const request = createMockRequest({
        title: 'New Post',
        slug: 'new-post',
        content: '<p>Content</p>',
      });

      await handleCreatePost(request, config);

      expect(onCacheRevalidate).toHaveBeenCalledWith(
        expect.arrayContaining(['/api/blog/posts', '/blog', '/blog/new-post', '/'])
      );
    });

    it('should add siteId to post data when configured', async () => {
      const createPost = vi.fn().mockResolvedValue(createMockPost());
      const config = createMockConfig({
        createPost,
        slugExists: vi.fn().mockResolvedValue(false),
        siteId: 'site-psypnos',
      });

      const request = createMockRequest({
        title: 'New Post',
        slug: 'new-post',
        content: '<p>Content</p>',
      });

      await handleCreatePost(request, config);

      expect(createPost).toHaveBeenCalledWith(
        expect.objectContaining({
          siteId: 'site-psypnos',
        })
      );
    });
  });

  describe('handleUpdatePost', () => {
    it('should update an existing post', async () => {
      const existingPost = createMockPost({ id: 'post-123' });
      const updatedPost = { ...existingPost, title: 'Updated Title' };

      const config = createMockConfig({
        getPostById: vi.fn().mockResolvedValue(existingPost),
        updatePost: vi.fn().mockResolvedValue(updatedPost),
      });

      const request = createMockRequest({
        title: 'Updated Title',
      });

      const result = await handleUpdatePost('post-123', request, config);

      expect(result.statusCode).toBe(200);
      expect(result.response).toMatchObject({
        success: true,
        data: expect.objectContaining({ title: 'Updated Title' }),
      });
    });

    it('should return 404 for non-existent post', async () => {
      const config = createMockConfig({
        getPostById: vi.fn().mockResolvedValue(null),
      });

      const request = createMockRequest({
        title: 'Updated Title',
      });

      const result = await handleUpdatePost('non-existent', request, config);

      expect(result.statusCode).toBe(404);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND',
        },
      });
    });

    it('should return validation error for invalid data', async () => {
      const existingPost = createMockPost({ id: 'post-123' });
      const config = createMockConfig({
        getPostById: vi.fn().mockResolvedValue(existingPost),
      });

      const request = createMockRequest({
        title: '', // Title too short
      });

      // This should fail validation since title min length is 1
      const result = await handleUpdatePost('post-123', request, config);

      // When validation passes but title is empty string, it might be accepted
      // Let's check the behavior
      expect(result.statusCode).toBe(400);
    });

    it('should trigger cache revalidation after update', async () => {
      const existingPost = createMockPost({ id: 'post-123', slug: 'old-slug' });
      const updatedPost = { ...existingPost, slug: 'old-slug' };
      const onCacheRevalidate = vi.fn().mockResolvedValue(undefined);

      const config = createMockConfig({
        getPostById: vi.fn().mockResolvedValue(existingPost),
        updatePost: vi.fn().mockResolvedValue(updatedPost),
        onCacheRevalidate,
      });

      const request = createMockRequest({
        title: 'Updated Title',
      });

      await handleUpdatePost('post-123', request, config);

      expect(onCacheRevalidate).toHaveBeenCalled();
    });
  });

  describe('handleDeletePost', () => {
    it('should delete an existing post', async () => {
      const existingPost = createMockPost({ id: 'post-123' });
      const deletePost = vi.fn().mockResolvedValue(undefined);

      const config = createMockConfig({
        getPostById: vi.fn().mockResolvedValue(existingPost),
        deletePost,
      });

      const result = await handleDeletePost('post-123', config);

      expect(result.statusCode).toBe(200);
      expect(result.response).toMatchObject({
        success: true,
        data: { deleted: true },
      });
      expect(deletePost).toHaveBeenCalledWith('post-123');
    });

    it('should return 404 for non-existent post', async () => {
      const config = createMockConfig({
        getPostById: vi.fn().mockResolvedValue(null),
      });

      const result = await handleDeletePost('non-existent', config);

      expect(result.statusCode).toBe(404);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND',
        },
      });
    });

    it('should trigger cache revalidation after deletion', async () => {
      const existingPost = createMockPost({ id: 'post-123', slug: 'test-post' });
      const onCacheRevalidate = vi.fn().mockResolvedValue(undefined);

      const config = createMockConfig({
        getPostById: vi.fn().mockResolvedValue(existingPost),
        deletePost: vi.fn().mockResolvedValue(undefined),
        onCacheRevalidate,
      });

      await handleDeletePost('post-123', config);

      expect(onCacheRevalidate).toHaveBeenCalledWith(
        expect.arrayContaining(['/api/blog/posts', '/blog', '/blog/test-post', '/'])
      );
    });

    it('should handle database errors gracefully', async () => {
      const existingPost = createMockPost({ id: 'post-123' });
      const config = createMockConfig({
        getPostById: vi.fn().mockResolvedValue(existingPost),
        deletePost: vi.fn().mockRejectedValue(new Error('Database error')),
      });

      const result = await handleDeletePost('post-123', config);

      expect(result.statusCode).toBe(500);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
        },
      });
    });
  });

  describe('handleCheckSlug', () => {
    it('should return available true for unique slug', async () => {
      const config = createMockConfig({
        slugExists: vi.fn().mockResolvedValue(false),
      });

      const request = createMockRequest({
        slug: 'unique-slug',
      });

      const result = await handleCheckSlug(request, config);

      expect(result.statusCode).toBe(200);
      expect(result.response).toMatchObject({
        success: true,
        data: { available: true },
      });
    });

    it('should return available false with suggestion for existing slug', async () => {
      const config = createMockConfig({
        slugExists: vi.fn().mockResolvedValue(true),
      });

      const request = createMockRequest({
        slug: 'existing-slug',
      });

      const result = await handleCheckSlug(request, config);

      expect(result.statusCode).toBe(200);
      expect(result.response).toMatchObject({
        success: true,
        data: {
          available: false,
          suggestion: expect.stringContaining('existing-slug-'),
        },
      });
    });

    it('should exclude specified post ID from slug check', async () => {
      const slugExists = vi.fn().mockResolvedValue(false);
      const config = createMockConfig({ slugExists });

      const request = createMockRequest({
        slug: 'my-slug',
        excludeId: 'post-123',
      });

      await handleCheckSlug(request, config);

      expect(slugExists).toHaveBeenCalledWith('my-slug', 'post-123', undefined);
    });

    it('should return available false for invalid slug format', async () => {
      const config = createMockConfig();

      const request = createMockRequest({
        slug: 'Invalid Slug',
      });

      const result = await handleCheckSlug(request, config);

      expect(result.statusCode).toBe(200);
      expect(result.response).toMatchObject({
        success: true,
        data: { available: false },
      });
    });

    it('should return validation error for invalid JSON body', async () => {
      const config = createMockConfig();

      const request = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        clone: vi.fn().mockReturnThis(),
        headers: new Headers({ 'Content-Type': 'application/json' }),
        url: 'http://localhost:3000/api/blog/check-slug',
      } as unknown as Request;

      const result = await handleCheckSlug(request, config);

      expect(result.statusCode).toBe(400);
      expect(result.response).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
        },
      });
    });
  });
});
