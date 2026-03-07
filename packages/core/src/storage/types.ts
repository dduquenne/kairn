/**
 * Storage module types
 *
 * Abstraction layer for file storage providers (Supabase, local filesystem, S3).
 */

/** Result of an upload operation */
export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/** Result of a delete operation */
export interface DeleteResult {
  success: boolean;
  error?: string;
}

/** Storage provider interface — implementations handle the actual I/O */
export interface StorageProvider {
  /** Upload a file to the given bucket */
  upload(
    bucket: string,
    filename: string,
    buffer: Buffer,
    contentType?: string
  ): Promise<UploadResult>;

  /** Delete a file from the given bucket */
  delete(bucket: string, filename: string): Promise<DeleteResult>;

  /** Get the public URL for a file */
  getUrl(bucket: string, filename: string): string;

  /** Check if a file exists in the given bucket */
  exists(bucket: string, filename: string): Promise<boolean>;

  /** Whether this provider is properly configured and ready */
  isConfigured(): boolean;
}

/** Configuration for the storage service */
export interface StorageServiceConfig {
  /** Primary storage provider (e.g. Supabase) */
  provider?: StorageProvider | null;
  /** Fallback provider when primary is unavailable (e.g. local filesystem) */
  fallback: StorageProvider;
}

/** Configuration for the local filesystem provider */
export interface LocalStorageConfig {
  /** Mapping of bucket name to local directory path (relative to cwd) */
  localPaths: Record<string, string>;
  /** Mapping of bucket name to public URL prefix */
  publicUrlPaths: Record<string, string>;
}

/** Configuration for the Supabase storage provider */
export interface SupabaseStorageConfig {
  url: string;
  serviceKey: string;
}
