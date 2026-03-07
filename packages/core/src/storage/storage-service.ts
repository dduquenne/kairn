/**
 * Storage service
 *
 * Orchestrates file operations using primary provider with fallback.
 * The primary provider (e.g. Supabase) is used when configured,
 * otherwise falls back to the fallback provider (e.g. local filesystem).
 */

import type { StorageProvider, StorageServiceConfig, UploadResult, DeleteResult } from './types';

/** Storage service that delegates to the configured provider */
export class StorageService {
  private readonly provider: StorageProvider;
  private readonly fallback: StorageProvider;

  constructor(config: StorageServiceConfig) {
    this.provider = config.provider ?? config.fallback;
    this.fallback = config.fallback;
  }

  /** Returns the active provider (primary if configured, otherwise fallback) */
  private getActiveProvider(): StorageProvider {
    return this.provider.isConfigured() ? this.provider : this.fallback;
  }

  /** Whether the primary cloud provider is active */
  isCloudStorageConfigured(): boolean {
    return this.provider !== this.fallback && this.provider.isConfigured();
  }

  /** Upload a file */
  async upload(
    bucket: string,
    filename: string,
    buffer: Buffer,
    contentType?: string
  ): Promise<UploadResult> {
    return this.getActiveProvider().upload(bucket, filename, buffer, contentType);
  }

  /** Delete a file */
  async delete(bucket: string, filename: string): Promise<DeleteResult> {
    return this.getActiveProvider().delete(bucket, filename);
  }

  /** Get the public URL for a file */
  getUrl(bucket: string, filename: string): string {
    return this.getActiveProvider().getUrl(bucket, filename);
  }

  /** Check if a file exists */
  async exists(bucket: string, filename: string): Promise<boolean> {
    return this.getActiveProvider().exists(bucket, filename);
  }

  /**
   * Migrate a file from fallback (local) to primary (cloud) provider.
   * Reads from fallback, uploads to primary.
   */
  async migrateToCloud(
    bucket: string,
    filename: string,
    buffer: Buffer,
    contentType?: string
  ): Promise<UploadResult> {
    if (!this.isCloudStorageConfigured()) {
      return { success: false, error: 'Cloud storage not configured' };
    }
    return this.provider.upload(bucket, filename, buffer, contentType);
  }
}

/** Creates a storage service instance */
export function createStorageService(config: StorageServiceConfig): StorageService {
  return new StorageService(config);
}
