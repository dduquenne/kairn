// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Supabase module exports
 */

export { supabase, isSupabaseStorageConfigured } from "./client";
export {
  uploadImage,
  deleteImage,
  getImageUrl,
  imageExists,
  migrateImageToSupabase,
  BUCKETS,
  type BucketName,
} from "./storage";
