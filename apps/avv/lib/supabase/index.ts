/**
 * Supabase module exports
 *
 * Re-exports storage operations backed by @kairn/core/storage.
 */

export { supabase, isSupabaseStorageConfigured } from './client';
export {
  uploadImage,
  deleteImage,
  getImageUrl,
  imageExists,
  migrateImageToSupabase,
  BUCKETS,
  type BucketName,
} from './storage';
