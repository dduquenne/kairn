/**
 * Supabase Storage Module — Appréciez Votre Vie site wrapper
 *
 * Delegates to @kairn/core/storage for the actual storage operations.
 * Configures site-specific buckets and paths.
 *
 * Les noms de fichier sont utilisés tels quels (pas de normalisation d'extension).
 * Les appelants sont responsables de fournir l'extension correcte.
 */

import { promises as fs } from 'fs';
import path from 'path';

import { createSupabaseStorageProvider, createLocalStorageProvider } from '@kairn/core/storage';
import type {
  UploadResult,
  DeleteResult,
  StorageProvider,
  SupabaseStorageClient,
} from '@kairn/core/storage';

import { supabase, isSupabaseStorageConfigured } from './client';

/** Storage bucket names for Appréciez Votre Vie */
export const BUCKETS = {
  BLOG_IMAGES: 'blog-images',
  SEMINAR_IMAGES: 'seminar-images',
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/** Local fallback paths */
const LOCAL_PATHS: Record<BucketName, string> = {
  [BUCKETS.BLOG_IMAGES]: 'public/images/blog',
  [BUCKETS.SEMINAR_IMAGES]: 'public/images/seminars',
};

/** Public URL paths for local storage */
const PUBLIC_URL_PATHS: Record<BucketName, string> = {
  [BUCKETS.BLOG_IMAGES]: '/images/blog',
  [BUCKETS.SEMINAR_IMAGES]: '/images/seminars',
};

/** Local fallback provider */
const localProvider = createLocalStorageProvider({
  localPaths: LOCAL_PATHS,
  publicUrlPaths: PUBLIC_URL_PATHS,
});

/** Get the active provider — fresh on each call for testability */
function getProvider(): StorageProvider {
  if (isSupabaseStorageConfigured() && supabase) {
    return createSupabaseStorageProvider(supabase as unknown as SupabaseStorageClient);
  }
  return localProvider;
}

/** Upload an image to Supabase Storage or local filesystem */
export async function uploadImage(
  bucket: BucketName,
  filename: string,
  buffer: Buffer,
  contentType: string = 'image/webp'
): Promise<UploadResult> {
  return getProvider().upload(bucket, filename, buffer, contentType);
}

/** Delete an image from Supabase Storage or local filesystem */
export async function deleteImage(bucket: BucketName, filename: string): Promise<DeleteResult> {
  return getProvider().delete(bucket, filename);
}

/** Get the public URL for an image */
export function getImageUrl(bucket: BucketName, filename: string): string {
  return getProvider().getUrl(bucket, filename);
}

/** Check if an image exists */
export async function imageExists(bucket: BucketName, filename: string): Promise<boolean> {
  return getProvider().exists(bucket, filename);
}

/**
 * Migrate a local image to Supabase Storage.
 * Reads from local filesystem and uploads to cloud.
 */
export async function migrateImageToSupabase(
  bucket: BucketName,
  filename: string
): Promise<UploadResult> {
  if (!isSupabaseStorageConfigured()) {
    return { success: false, error: 'Supabase Storage not configured' };
  }

  try {
    const localPath = LOCAL_PATHS[bucket];
    const fullPath = path.join(process.cwd(), localPath, filename);
    const buffer = await fs.readFile(fullPath);
    return uploadImage(bucket, filename, buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown migration error';
    return { success: false, error: message };
  }
}

export { type UploadResult, type DeleteResult };
