/**
 * Local filesystem storage provider
 *
 * Stores files on disk as a fallback when cloud storage is not configured.
 * Not suitable for Vercel Serverless (read-only filesystem except /tmp).
 */

import { promises as fs } from 'fs';
import path from 'path';

import type { StorageProvider, UploadResult, DeleteResult, LocalStorageConfig } from './types';

/** Creates a local filesystem storage provider */
export function createLocalStorageProvider(config: LocalStorageConfig): StorageProvider {
  const { localPaths, publicUrlPaths } = config;

  return {
    async upload(bucket: string, filename: string, buffer: Buffer): Promise<UploadResult> {
      try {
        const localPath = localPaths[bucket];
        if (!localPath) {
          return { success: false, error: `Unknown bucket: ${bucket}` };
        }

        const fullPath = path.join(process.cwd(), localPath, filename);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, buffer);

        const url = `${publicUrlPaths[bucket]}/${filename}`;
        return { success: true, url };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown local upload error';
        console.error(`Local upload error: ${message}`);
        return { success: false, error: message };
      }
    },

    async delete(bucket: string, filename: string): Promise<DeleteResult> {
      try {
        const localPath = localPaths[bucket];
        if (!localPath) {
          return { success: false, error: `Unknown bucket: ${bucket}` };
        }

        const fullPath = path.join(process.cwd(), localPath, filename);
        await fs.unlink(fullPath);
        return { success: true };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return { success: true };
        }
        const message = error instanceof Error ? error.message : 'Unknown local delete error';
        console.error(`Local delete error: ${message}`);
        return { success: false, error: message };
      }
    },

    getUrl(bucket: string, filename: string): string {
      return `${publicUrlPaths[bucket]}/${filename}`;
    },

    async exists(bucket: string, filename: string): Promise<boolean> {
      try {
        const localPath = localPaths[bucket];
        if (!localPath) return false;
        const fullPath = path.join(process.cwd(), localPath, filename);
        await fs.access(fullPath);
        return true;
      } catch {
        return false;
      }
    },

    isConfigured(): boolean {
      return true;
    },
  };
}
