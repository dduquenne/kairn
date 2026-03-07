/**
 * Storage module
 *
 * Provides abstracted file storage with provider pattern
 * (Supabase, local filesystem, S3-compatible).
 */

// Types
export type {
  UploadResult,
  DeleteResult,
  StorageProvider,
  StorageServiceConfig,
  LocalStorageConfig,
  SupabaseStorageConfig,
} from './types';

// Providers
export { createLocalStorageProvider } from './local-provider';
export { createSupabaseStorageProvider, type SupabaseStorageClient } from './supabase-provider';

// Service
export { StorageService, createStorageService } from './storage-service';

// Image utilities
export {
  BLUR_DATA_URL,
  BLUR_DATA_URL_GOLD,
  IMAGE_DIMENSIONS,
  ASPECT_RATIOS,
  getPlaceholderProps,
  getImageProps,
} from './image-utils';
