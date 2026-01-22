/**
 * Blog Tags Handler
 *
 * CRUD operations for blog tags.
 */

import type { ApiRequest, AuthContext } from '../../middleware/types';
import { withBodyValidation } from '../../middleware/with-validation';
import { error, success } from '../../utils/response';

import { tagSchema, type BlogHandlerConfig, type Tag, type TagInput } from './types';

/**
 * Handler result type
 */
export interface TagHandlerResult<T = unknown> {
  response:
    | { success: true; data: T }
    | { success: false; error: { code: string; message: string; details?: unknown } };
  statusCode: number;
  headers: Record<string, string>;
}

/**
 * Get all tags
 *
 * @param config - Handler configuration
 * @returns List of tags
 */
export async function handleGetTags(config: BlogHandlerConfig): Promise<TagHandlerResult<Tag[]>> {
  const { getAllTags, siteId } = config;

  if (!getAllTags) {
    return {
      response: error('NOT_IMPLEMENTED', 'Tags non supportés'),
      statusCode: 501,
      headers: {},
    };
  }

  try {
    const tags = await getAllTags(siteId);

    return {
      response: success(tags),
      statusCode: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      },
    };
  } catch (e) {
    console.error('Error fetching tags:', e);
    return {
      response: error('INTERNAL_ERROR', 'Erreur lors de la récupération des tags'),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Create a new tag (requires admin)
 *
 * @param request - The incoming request
 * @param config - Handler configuration
 * @param _authContext - Auth context (for future use)
 * @returns The created tag
 */
export async function handleCreateTag(
  request: ApiRequest,
  config: BlogHandlerConfig,
  _authContext?: AuthContext
): Promise<TagHandlerResult<Tag>> {
  const { createTag, onCacheRevalidate } = config;

  if (!createTag) {
    return {
      response: error('NOT_IMPLEMENTED', 'Création de tags non supportée'),
      statusCode: 501,
      headers: {},
    };
  }

  // Validate request body
  const bodyResult = await withBodyValidation(request, tagSchema);

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

  try {
    const tag = await createTag(data);

    // Invalidate cache
    if (onCacheRevalidate) {
      await onCacheRevalidate(['/api/blog/tags']);
    }

    return {
      response: success(tag),
      statusCode: 201,
      headers: {},
    };
  } catch (e) {
    console.error('Error creating tag:', e);
    const message = e instanceof Error ? e.message : 'Erreur lors de la création';

    // Check for duplicate error
    if (message.includes('existe déjà') || message.includes('duplicate')) {
      return {
        response: error('CONFLICT', 'Un tag avec ce nom ou slug existe déjà'),
        statusCode: 409,
        headers: {},
      };
    }

    return {
      response: error('INTERNAL_ERROR', message),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Update a tag (requires admin)
 *
 * @param tagId - The tag ID
 * @param request - The incoming request
 * @param config - Handler configuration
 * @param _authContext - Auth context (for future use)
 * @returns The updated tag
 */
export async function handleUpdateTag(
  tagId: string,
  request: ApiRequest,
  config: BlogHandlerConfig,
  _authContext?: AuthContext
): Promise<TagHandlerResult<Tag>> {
  const { updateTag, onCacheRevalidate } = config;

  if (!updateTag) {
    return {
      response: error('NOT_IMPLEMENTED', 'Mise à jour de tags non supportée'),
      statusCode: 501,
      headers: {},
    };
  }

  // Validate request body (partial schema)
  const bodyResult = await withBodyValidation(request, tagSchema.partial());

  if (!bodyResult.success) {
    return {
      response: error('VALIDATION_ERROR', 'Données invalides', {
        details: bodyResult.error.details,
      }),
      statusCode: 400,
      headers: {},
    };
  }

  const data = bodyResult.body as Partial<TagInput>;

  try {
    const tag = await updateTag(tagId, data);

    // Invalidate cache
    if (onCacheRevalidate) {
      await onCacheRevalidate(['/api/blog/tags']);
    }

    return {
      response: success(tag),
      statusCode: 200,
      headers: {},
    };
  } catch (e) {
    console.error('Error updating tag:', e);
    const message = e instanceof Error ? e.message : 'Erreur lors de la mise à jour';

    if (message.includes('not found') || message.includes('introuvable')) {
      return {
        response: error('NOT_FOUND', 'Tag non trouvé'),
        statusCode: 404,
        headers: {},
      };
    }

    return {
      response: error('INTERNAL_ERROR', message),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Delete a tag (requires admin)
 *
 * @param tagId - The tag ID
 * @param config - Handler configuration
 * @param _authContext - Auth context (for future use)
 * @returns Success response
 */
export async function handleDeleteTag(
  tagId: string,
  config: BlogHandlerConfig,
  _authContext?: AuthContext
): Promise<TagHandlerResult<{ deleted: boolean }>> {
  const { deleteTag, onCacheRevalidate } = config;

  if (!deleteTag) {
    return {
      response: error('NOT_IMPLEMENTED', 'Suppression de tags non supportée'),
      statusCode: 501,
      headers: {},
    };
  }

  try {
    await deleteTag(tagId);

    // Invalidate cache
    if (onCacheRevalidate) {
      await onCacheRevalidate(['/api/blog/tags']);
    }

    return {
      response: success({ deleted: true }),
      statusCode: 200,
      headers: {},
    };
  } catch (e) {
    console.error('Error deleting tag:', e);
    const message = e instanceof Error ? e.message : 'Erreur lors de la suppression';

    if (message.includes('not found') || message.includes('introuvable')) {
      return {
        response: error('NOT_FOUND', 'Tag non trouvé'),
        statusCode: 404,
        headers: {},
      };
    }

    return {
      response: error('INTERNAL_ERROR', message),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Create tag handlers with preset configuration
 */
export function createTagHandlers(config: BlogHandlerConfig) {
  return {
    getTags: () => handleGetTags(config),
    createTag: (request: ApiRequest, authContext?: AuthContext) =>
      handleCreateTag(request, config, authContext),
    updateTag: (tagId: string, request: ApiRequest, authContext?: AuthContext) =>
      handleUpdateTag(tagId, request, config, authContext),
    deleteTag: (tagId: string, authContext?: AuthContext) =>
      handleDeleteTag(tagId, config, authContext),
  };
}
