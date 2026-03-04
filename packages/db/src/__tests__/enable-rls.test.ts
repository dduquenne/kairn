import { readFileSync } from 'fs';
import { resolve } from 'path';

import { describe, expect, it } from 'vitest';

/**
 * Extracts model names from the Prisma schema file.
 * Parses lines matching `model <Name> {` and returns the list of names.
 */
function extractPrismaModels(schemaPath: string): string[] {
  const schema = readFileSync(schemaPath, 'utf-8');
  const modelRegex = /^model\s+(\w+)\s+\{/gm;
  const models: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = modelRegex.exec(schema)) !== null) {
    models.push(match[1] as string);
  }
  return models.sort();
}

/**
 * Extracts table names from the enable-rls.sql migration file.
 * Parses lines matching `ALTER TABLE IF EXISTS "TableName" ENABLE ROW LEVEL SECURITY;`.
 */
function extractRlsTables(sqlPath: string): string[] {
  const sql = readFileSync(sqlPath, 'utf-8');
  const alterRegex =
    /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?"(\w+)"\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
  const tables: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = alterRegex.exec(sql)) !== null) {
    tables.push(match[1] as string);
  }
  return tables.sort();
}

const DB_PACKAGE_ROOT = resolve(__dirname, '../..');
const SCHEMA_PATH = resolve(DB_PACKAGE_ROOT, 'prisma/schema.prisma');
const RLS_SQL_PATH = resolve(DB_PACKAGE_ROOT, 'prisma/sql/enable-rls.sql');

describe('enable-rls.sql', () => {
  const prismaModels = extractPrismaModels(SCHEMA_PATH);
  const rlsTables = extractRlsTables(RLS_SQL_PATH);

  it('should contain valid ALTER TABLE statements', () => {
    expect(rlsTables.length).toBeGreaterThan(0);
  });

  it('should cover every Prisma model with an ENABLE ROW LEVEL SECURITY statement', () => {
    const missingTables = prismaModels.filter(model => !rlsTables.includes(model));
    expect(missingTables).toEqual([]);
  });

  it('should not reference tables that do not exist in the Prisma schema', () => {
    const extraTables = rlsTables.filter(table => !prismaModels.includes(table));
    expect(extraTables).toEqual([]);
  });

  it('should not have duplicate ALTER TABLE statements', () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const table of rlsTables) {
      if (seen.has(table)) {
        duplicates.push(table);
      }
      seen.add(table);
    }
    expect(duplicates).toEqual([]);
  });

  it('should use ENABLE (not DISABLE) for all tables', () => {
    const sql = readFileSync(RLS_SQL_PATH, 'utf-8');
    const disableMatches = sql.match(
      /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?"\w+"\s+DISABLE\s+ROW\s+LEVEL\s+SECURITY/gi
    );
    expect(disableMatches).toBeNull();
  });
});
