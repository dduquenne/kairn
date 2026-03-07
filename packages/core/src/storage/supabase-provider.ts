/**
 * Supabase storage provider
 *
 * Handles file upload/delete/URL via Supabase Storage.
 * Falls back gracefully when credentials are missing.
 */

import type { StorageProvider, UploadResult, DeleteResult } from './types';

/**
 * Supabase client interface — only the storage subset we need.
 * Avoids importing @supabase/supabase-js in this package.
 */
export interface SupabaseStorageClient {
  storage: {
    from(bucket: string): {
      upload(
        path: string,
        body: Buffer,
        options?: { contentType?: string; upsert?: boolean }
      ): Promise<{ data: unknown; error: { message: string } | null }>;
      remove(paths: string[]): Promise<{ error: { message: string } | null }>;
      getPublicUrl(path: string): { data: { publicUrl: string } };
      list(
        prefix: string,
        options?: { search?: string }
      ): Promise<{
        data: Array<{ name: string }> | null;
        error: { message: string } | null;
      }>;
    };
  };
}

/** Creates a Supabase storage provider from an existing client instance */
export function createSupabaseStorageProvider(client: SupabaseStorageClient): StorageProvider {
  return {
    async upload(
      bucket: string,
      filename: string,
      buffer: Buffer,
      contentType = 'image/webp'
    ): Promise<UploadResult> {
      try {
        const { error } = await client.storage
          .from(bucket)
          .upload(filename, buffer, { contentType, upsert: true });

        if (error) {
          console.error(`Supabase upload error: ${error.message}`);
          return { success: false, error: error.message };
        }

        const {
          data: { publicUrl },
        } = client.storage.from(bucket).getPublicUrl(filename);

        return { success: true, url: publicUrl };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown upload error';
        console.error(`Supabase upload exception: ${message}`);
        return { success: false, error: message };
      }
    },

    async delete(bucket: string, filename: string): Promise<DeleteResult> {
      try {
        const { error } = await client.storage.from(bucket).remove([filename]);

        if (error) {
          console.error(`Supabase delete error: ${error.message}`);
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown delete error';
        console.error(`Supabase delete exception: ${message}`);
        return { success: false, error: message };
      }
    },

    getUrl(bucket: string, filename: string): string {
      const {
        data: { publicUrl },
      } = client.storage.from(bucket).getPublicUrl(filename);
      return publicUrl;
    },

    async exists(bucket: string, filename: string): Promise<boolean> {
      try {
        const { data, error } = await client.storage.from(bucket).list('', { search: filename });

        if (error) return false;
        return data?.some(file => file.name === filename) ?? false;
      } catch {
        return false;
      }
    },

    isConfigured(): boolean {
      return true;
    },
  };
}
