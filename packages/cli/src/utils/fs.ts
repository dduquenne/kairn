/**
 * CLI Filesystem Utilities
 */

import { access, mkdir, writeFile, readFile, readdir, stat, copyFile } from 'fs/promises';
import { join, dirname } from 'path';

/**
 * Check if a file or directory exists
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a path is a directory
 */
export async function isDirectory(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Create directory if it doesn't exist
 */
export async function ensureDir(path: string): Promise<void> {
  if (!(await fileExists(path))) {
    await mkdir(path, { recursive: true });
  }
}

/**
 * Write file with directory creation
 */
export async function writeFileWithDir(path: string, content: string): Promise<void> {
  const dir = dirname(path);
  await ensureDir(dir);
  await writeFile(path, content, 'utf-8');
}

/**
 * Read JSON file
 */
export async function readJsonFile<T = unknown>(path: string): Promise<T> {
  const content = await readFile(path, 'utf-8');
  return JSON.parse(content) as T;
}

/**
 * Write JSON file
 */
export async function writeJsonFile(path: string, data: unknown): Promise<void> {
  await writeFileWithDir(path, JSON.stringify(data, null, 2) + '\n');
}

/**
 * List files in a directory
 */
export async function listFiles(dir: string): Promise<string[]> {
  try {
    return await readdir(dir);
  } catch {
    return [];
  }
}

/**
 * Copy a file
 */
export async function copyFileWithDir(src: string, dest: string): Promise<void> {
  await ensureDir(dirname(dest));
  await copyFile(src, dest);
}

/**
 * Get the project root by looking for package.json with "kairn" name
 */
export async function findProjectRoot(startDir: string = process.cwd()): Promise<string | null> {
  let currentDir = startDir;

  while (currentDir !== '/') {
    const packageJsonPath = join(currentDir, 'package.json');

    if (await fileExists(packageJsonPath)) {
      try {
        const packageJson = await readJsonFile<{ name?: string }>(packageJsonPath);
        if (packageJson.name === 'kairn') {
          return currentDir;
        }
      } catch {
        // Continue searching
      }
    }

    currentDir = dirname(currentDir);
  }

  return null;
}

/**
 * Find a site directory in the apps folder
 */
export async function findSiteDir(siteName: string, projectRoot: string): Promise<string | null> {
  const appsDir = join(projectRoot, 'apps');
  const siteDir = join(appsDir, siteName);

  if (await isDirectory(siteDir)) {
    return siteDir;
  }

  return null;
}
