// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Supabase Storage Module
 * Handles image upload/delete for blog articles and seminars
 * Falls back to local filesystem if Supabase is not configured
 */

import { promises as fs } from "fs";
import path from "path";
import { supabase, isSupabaseStorageConfigured } from "./client";

// Storage bucket names
export const BUCKETS = {
  BLOG_IMAGES: "blog-images",
  SEMINAR_IMAGES: "seminar-images",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

// Local fallback paths
const LOCAL_PATHS: Record<BucketName, string> = {
  [BUCKETS.BLOG_IMAGES]: "public/images/blog",
  [BUCKETS.SEMINAR_IMAGES]: "public/images/seminars",
};

// Public URL paths for local storage
const PUBLIC_URL_PATHS: Record<BucketName, string> = {
  [BUCKETS.BLOG_IMAGES]: "/images/blog",
  [BUCKETS.SEMINAR_IMAGES]: "/images/seminars",
};

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Upload an image to Supabase Storage or local filesystem
 */
export async function uploadImage(
  bucket: BucketName,
  filename: string,
  buffer: Buffer,
  contentType: string = "image/webp"
): Promise<UploadResult> {
  // Ensure filename has .webp extension
  const normalizedFilename = filename.endsWith(".webp")
    ? filename
    : `${filename}.webp`;

  if (isSupabaseStorageConfigured() && supabase) {
    try {
      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from(bucket)
        .upload(normalizedFilename, buffer, {
          contentType,
          upsert: true, // Overwrite if exists
        });

      if (error) {
        console.error(`Supabase upload error: ${error.message}`);
        return { success: false, error: error.message };
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(normalizedFilename);

      return { success: true, url: publicUrl };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown upload error";
      console.error(`Supabase upload exception: ${message}`);
      return { success: false, error: message };
    }
  }

  // Fallback to local filesystem
  return uploadImageLocal(bucket, normalizedFilename, buffer);
}

/**
 * Upload image to local filesystem (fallback)
 */
async function uploadImageLocal(
  bucket: BucketName,
  filename: string,
  buffer: Buffer
): Promise<UploadResult> {
  try {
    const localPath = LOCAL_PATHS[bucket];
    const fullPath = path.join(process.cwd(), localPath, filename);

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Write file
    await fs.writeFile(fullPath, buffer);

    // Return local URL path
    const url = `${PUBLIC_URL_PATHS[bucket]}/${filename}`;

    return { success: true, url };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown local upload error";
    console.error(`Local upload error: ${message}`);
    return { success: false, error: message };
  }
}

/**
 * Delete an image from Supabase Storage or local filesystem
 */
export async function deleteImage(
  bucket: BucketName,
  filename: string
): Promise<DeleteResult> {
  const normalizedFilename = filename.endsWith(".webp")
    ? filename
    : `${filename}.webp`;

  if (isSupabaseStorageConfigured() && supabase) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([normalizedFilename]);

      if (error) {
        console.error(`Supabase delete error: ${error.message}`);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown delete error";
      console.error(`Supabase delete exception: ${message}`);
      return { success: false, error: message };
    }
  }

  // Fallback to local filesystem
  return deleteImageLocal(bucket, normalizedFilename);
}

/**
 * Delete image from local filesystem (fallback)
 */
async function deleteImageLocal(
  bucket: BucketName,
  filename: string
): Promise<DeleteResult> {
  try {
    const localPath = LOCAL_PATHS[bucket];
    const fullPath = path.join(process.cwd(), localPath, filename);

    await fs.unlink(fullPath);

    return { success: true };
  } catch (error) {
    // File might not exist, which is OK
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { success: true };
    }

    const message =
      error instanceof Error ? error.message : "Unknown local delete error";
    console.error(`Local delete error: ${message}`);
    return { success: false, error: message };
  }
}

/**
 * Get the public URL for an image
 */
export function getImageUrl(bucket: BucketName, filename: string): string {
  const normalizedFilename = filename.endsWith(".webp")
    ? filename
    : `${filename}.webp`;

  if (isSupabaseStorageConfigured() && supabase) {
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(normalizedFilename);
    return publicUrl;
  }

  // Local URL
  return `${PUBLIC_URL_PATHS[bucket]}/${normalizedFilename}`;
}

/**
 * Check if an image exists
 */
export async function imageExists(
  bucket: BucketName,
  filename: string
): Promise<boolean> {
  const normalizedFilename = filename.endsWith(".webp")
    ? filename
    : `${filename}.webp`;

  if (isSupabaseStorageConfigured() && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list("", { search: normalizedFilename });

      if (error) return false;
      return data?.some((file) => file.name === normalizedFilename) ?? false;
    } catch {
      return false;
    }
  }

  // Check local filesystem
  try {
    const localPath = LOCAL_PATHS[bucket];
    const fullPath = path.join(process.cwd(), localPath, normalizedFilename);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Migrate a local image to Supabase Storage
 * Used during the migration process
 */
export async function migrateImageToSupabase(
  bucket: BucketName,
  filename: string
): Promise<UploadResult> {
  if (!isSupabaseStorageConfigured()) {
    return { success: false, error: "Supabase Storage not configured" };
  }

  try {
    const localPath = LOCAL_PATHS[bucket];
    const fullPath = path.join(process.cwd(), localPath, filename);

    // Read local file
    const buffer = await fs.readFile(fullPath);

    // Upload to Supabase
    return uploadImage(bucket, filename, buffer);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown migration error";
    return { success: false, error: message };
  }
}
