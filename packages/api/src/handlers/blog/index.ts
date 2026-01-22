/**
 * Blog Handlers
 *
 * Reusable blog API handlers for posts and tags.
 */

// Types and schemas
export {
  blogPostSchema,
  blogPostUpdateSchema,
  tagSchema,
  checkSlugSchema,
  postsQuerySchema,
  validateSlug,
  generateSlug,
  type PostStatus,
  type BlogPostInput,
  type BlogPostUpdateInput,
  type TagInput,
  type CheckSlugInput,
  type PostsQueryParams,
  type BlogPost,
  type Tag,
  type BlogHandlerConfig,
} from './types';

// Posts handlers
export {
  handleGetPosts,
  handleGetPostBySlug,
  handleCreatePost,
  handleUpdatePost,
  handleDeletePost,
  handleCheckSlug,
  createBlogHandlers,
  type BlogHandlerResult,
} from './posts';

// Tags handlers
export {
  handleGetTags,
  handleCreateTag,
  handleUpdateTag,
  handleDeleteTag,
  createTagHandlers,
  type TagHandlerResult,
} from './tags';
