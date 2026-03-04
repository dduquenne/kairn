/**
 * Enable Row Level Security (RLS) on all tables.
 *
 * Loads DATABASE_URL from .env.local / .env at the monorepo root,
 * then executes the enable-rls.sql migration via Prisma.
 *
 * Run with: pnpm db:enable-rls
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/** Parses a .env file and returns key-value pairs. */
function loadEnv(filePath: string): void {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const MONOREPO_ROOT = resolve(__dirname, '../../..');
const PACKAGE_ROOT = resolve(__dirname, '..');
const SQL_FILE = resolve(PACKAGE_ROOT, 'prisma/sql/enable-rls.sql');

// Load env files (most specific wins — .env.local overrides .env)
// .env.local has priority: loaded first so its values are kept
loadEnv(resolve(MONOREPO_ROOT, '.env.local'));
loadEnv(resolve(MONOREPO_ROOT, '.env'));
loadEnv(resolve(PACKAGE_ROOT, '.env.local'));
loadEnv(resolve(PACKAGE_ROOT, '.env'));

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Error: DATABASE_URL is not defined. Set it in your .env file or environment.');
  process.exit(1);
}

console.warn('Applying RLS migration...');
execSync(`prisma db execute --file "${SQL_FILE}" --url "${databaseUrl}"`, {
  stdio: 'inherit',
  cwd: PACKAGE_ROOT,
});
console.warn('RLS enabled on all tables.');
