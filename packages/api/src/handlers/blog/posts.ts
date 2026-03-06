/**
 * Blog Posts Handler
 *
 * CRUD operations for blog posts.
 */

import type { ApiRequest, AuthContext } from '../../middleware/types';
import { withBodyValidation, withQueryValidation } from '../../middleware/with-validation';
import { error, paginated, success } from '../../utils/response';

import {
  blogPostSchema,
  blogPostUpdateSchema,
  postsQuerySchema,
  validateSlug,
  type BlogHandlerConfig,
  type BlogPost,
} from './types';

/**
 * Handler result type
 */
export interface BlogHandlerResult<T = unknown> {
  response:
    | { success: true; data: T; pagination?: unknown }
    | { success: false; error: { code: string; message: string; details?: unknown } };
  statusCode: number;
  headers: Record<string, string>;
}

/**
 * Get all blog posts with filtering and pagination
 *
 * @param request - The incoming request
 * @param config - Handler configuration
 * @returns List of posts with pagination
 */
export async function handleGetPosts(
  request: ApiRequest,
  config: BlogHandlerConfig
): Promise<BlogHandlerResult<BlogPost[]>> {
  const { getAllPosts, siteId: configSiteId } = config;

  // Parse query parameters
  const queryResult = withQueryValidation(request, postsQuerySchema);

  if (!queryResult.success) {
    return {
      response: error('VALIDATION_ERROR', 'Paramètres de requête invalides', {
        details: queryResult.error.details,
      }),
      statusCode: 400,
      headers: {},
    };
  }

  const {
    page,
    limit,
    status,
    category,
    tag,
    featured,
    search,
    includeUnpublished,
    featuredFirst,
  } = queryResult.query;

  try {
    const { posts, total } = await getAllPosts({
      page,
      limit,
      status,
      category,
      tag,
      featured,
      search,
      includeUnpublished,
      featuredFirst,
      siteId: configSiteId,
    });

    // Cache strategy based on context
    const cacheControl = includeUnpublished
      ? 'private, no-cache, no-store, must-revalidate'
      : 'public, max-age=300, stale-while-revalidate=3600';

    return {
      response: paginated(posts, { page, limit, total }),
      statusCode: 200,
      headers: {
        'Cache-Control': cacheControl,
      },
    };
  } catch (e) {
    console.error('Error fetching posts:', e);
    return {
      response: error('INTERNAL_ERROR', 'Erreur lors de la récupération des articles'),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Get a single blog post by slug
 *
 * @param slug - The post slug
 * @param config - Handler configuration
 * @returns The post or error
 */
export async function handleGetPostBySlug(
  slug: string,
  config: BlogHandlerConfig
): Promise<BlogHandlerResult<BlogPost>> {
  const { getPostBySlug, siteId } = config;

  try {
    const post = await getPostBySlug(slug, siteId);

    if (!post) {
      return {
        response: error('NOT_FOUND', 'Article non trouvé'),
        statusCode: 404,
        headers: {},
      };
    }

    // Only published posts are cached publicly
    const cacheControl =
      post.status === 'published'
        ? 'public, max-age=300, stale-while-revalidate=3600'
        : 'private, no-cache';

    return {
      response: success(post),
      statusCode: 200,
      headers: {
        'Cache-Control': cacheControl,
      },
    };
  } catch (e) {
    console.error('Error fetching post:', e);
    return {
      response: error('INTERNAL_ERROR', "Erreur lors de la récupération de l'article"),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Create a new blog post (requires admin)
 *
 * @param request - The incoming request
 * @param config - Handler configuration
 * @param _authContext - Auth context (for future use)
 * @returns The created post
 */
export async function handleCreatePost(
  request: ApiRequest,
  config: BlogHandlerConfig,
  _authContext?: AuthContext
): Promise<BlogHandlerResult<BlogPost>> {
  const { createPost, slugExists, siteId, onCacheRevalidate } = config;

  // Validate request body
  const bodyResult = await withBodyValidation(request, blogPostSchema);

  if (!bodyResult.success) {
    return {
      response: error('VALIDATION_ERROR', 'Données invalides', {
        details: bodyResult.error.details,
      }),
      statusCode: 400,
      headers: {},
    };
  }

  const data = bodyResult.body;

  // Validate slug format
  const slugValidation = validateSlug(data.slug);
  if (!slugValidation.valid) {
    return {
      response: error('VALIDATION_ERROR', slugValidation.error || 'Slug invalide'),
      statusCode: 400,
      headers: {},
    };
  }

  // Check if slug already exists
  const exists = await slugExists(data.slug, undefined, siteId);
  if (exists) {
    return {
      response: error('CONFLICT', 'Un article avec ce slug existe déjà'),
      statusCode: 409,
      headers: {},
    };
  }

  try {
    const postData = { ...data, siteId };
    const post = await createPost(postData);

    // Invalidate cache
    if (onCacheRevalidate) {
      await onCacheRevalidate(['/api/blog/posts', '/blog', `/blog/${post.slug}`, '/']);
    }

    return {
      response: success(post),
      statusCode: 201,
      headers: {},
    };
  } catch (e) {
    console.error('Error creating post:', e);
    const message = e instanceof Error ? e.message : 'Erreur lors de la création';

    return {
      response: error('INTERNAL_ERROR', message),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Update a blog post (requires admin)
 *
 * @param postId - The post ID
 * @param request - The incoming request
 * @param config - Handler configuration
 * @param _authContext - Auth context (for future use)
 * @returns The updated post
 */
export async function handleUpdatePost(
  postId: string,
  request: ApiRequest,
  config: BlogHandlerConfig,
  _authContext?: AuthContext
): Promise<BlogHandlerResult<BlogPost>> {
  const { getPostById, updatePost, onCacheRevalidate } = config;

  // Validate request body
  const bodyResult = await withBodyValidation(request, blogPostUpdateSchema);

  if (!bodyResult.success) {
    return {
      response: error('VALIDATION_ERROR', 'Données invalides', {
        details: bodyResult.error.details,
      }),
      statusCode: 400,
      headers: {},
    };
  }

  const data = bodyResult.body;

  // Check if post exists
  const existingPost = await getPostById(postId);
  if (!existingPost) {
    return {
      response: error('NOT_FOUND', 'Article non trouvé'),
      statusCode: 404,
      headers: {},
    };
  }

  try {
    const post = await updatePost(postId, data);

    // Invalidate cache
    if (onCacheRevalidate) {
      await onCacheRevalidate([
        '/api/blog/posts',
        '/blog',
        `/blog/${existingPost.slug}`,
        `/blog/${post.slug}`,
        '/',
      ]);
    }

    return {
      response: success(post),
      statusCode: 200,
      headers: {},
    };
  } catch (e) {
    console.error('Error updating post:', e);
    const message = e instanceof Error ? e.message : 'Erreur lors de la mise à jour';

    return {
      response: error('INTERNAL_ERROR', message),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Delete a blog post (requires admin)
 *
 * @param postId - The post ID
 * @param config - Handler configuration
 * @param _authContext - Auth context (for future use)
 * @returns Success response
 */
export async function handleDeletePost(
  postId: string,
  config: BlogHandlerConfig,
  _authContext?: AuthContext
): Promise<BlogHandlerResult<{ deleted: boolean }>> {
  const { getPostById, deletePost, onCacheRevalidate } = config;

  // Check if post exists
  const existingPost = await getPostById(postId);
  if (!existingPost) {
    return {
      response: error('NOT_FOUND', 'Article non trouvé'),
      statusCode: 404,
      headers: {},
    };
  }

  try {
    await deletePost(postId);

    // Invalidate cache
    if (onCacheRevalidate) {
      await onCacheRevalidate(['/api/blog/posts', '/blog', `/blog/${existingPost.slug}`, '/']);
    }

    return {
      response: success({ deleted: true }),
      statusCode: 200,
      headers: {},
    };
  } catch (e) {
    console.error('Error deleting post:', e);
    return {
      response: error('INTERNAL_ERROR', 'Erreur lors de la suppression'),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Check if a slug is available
 *
 * @param request - The incoming request
 * @param config - Handler configuration
 * @returns Availability result
 */
export async function handleCheckSlug(
  request: ApiRequest,
  config: BlogHandlerConfig
): Promise<BlogHandlerResult<{ available: boolean; suggestion?: string }>> {
  const { slugExists, siteId } = config;

  let slug: string;
  let excludeId: string | undefined;

  try {
    const body = (await request.json()) as { slug?: string; excludeId?: string };
    slug = body.slug || '';
    excludeId = body.excludeId;
  } catch {
    return {
      response: error('VALIDATION_ERROR', 'Body JSON invalide'),
      statusCode: 400,
      headers: {},
    };
  }

  // Validate slug format
  const slugValidation = validateSlug(slug);
  if (!slugValidation.valid) {
    return {
      response: success({ available: false, suggestion: undefined }),
      statusCode: 200,
      headers: {},
    };
  }

  const exists = await slugExists(slug, excludeId, siteId);

  if (exists) {
    // Generate a suggestion
    const suggestion = `${slug}-${Date.now().toString(36)}`;
    return {
      response: success({ available: false, suggestion }),
      statusCode: 200,
      headers: {},
    };
  }

  return {
    response: success({ available: true }),
    statusCode: 200,
    headers: {},
  };
}

/**
 * Create blog handlers with preset configuration
 */
export function createBlogHandlers(config: BlogHandlerConfig) {
  return {
    getPosts: (request: ApiRequest) => handleGetPosts(request, config),
    getPostBySlug: (slug: string) => handleGetPostBySlug(slug, config),
    createPost: (request: ApiRequest, authContext?: AuthContext) =>
      handleCreatePost(request, config, authContext),
    updatePost: (postId: string, request: ApiRequest, authContext?: AuthContext) =>
      handleUpdatePost(postId, request, config, authContext),
    deletePost: (postId: string, authContext?: AuthContext) =>
      handleDeletePost(postId, config, authContext),
    checkSlug: (request: ApiRequest) => handleCheckSlug(request, config),
  };
}
