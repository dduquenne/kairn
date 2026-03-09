#!/usr/bin/env npx tsx
/**
 * Standalone Migration Script: AVV → KAIRN Blog Articles
 *
 * This script uses only pg and native Node.js modules (no Prisma dependency).
 * It can be run directly without installing the full monorepo dependencies.
 *
 * Usage:
 *   AVV_DATABASE_URL="..." npx tsx apps/avv/scripts/migrate-blog-standalone.ts
 *
 * Required environment variables:
 * - AVV_DATABASE_URL: Source database connection string
 * - DATABASE_URL: Destination database connection string (KAIRN)
 * - SUPABASE_URL: KAIRN Supabase URL (for image migration)
 * - SUPABASE_SERVICE_KEY: KAIRN Supabase service key (for image migration)
 */

import { randomUUID } from 'crypto';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import sharp from 'sharp';

// ============================================
// Configuration
// ============================================

const BATCH_SIZE = 10;
const KAIRN_BUCKET = 'blog-images';

// ============================================
// Types
// ============================================

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  author: string;
  category: string;
  tags: string[];
  image: string | null;
  imagePrompt: string | null;
  seoIntent: string | null;
  persona: string | null;
  tones: string[];
  faq: unknown;
  jsonLd: unknown;
  published: boolean;
  featured: boolean;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface MigrationReport {
  totalArticles: number;
  migratedArticles: number;
  skippedArticles: number;
  imagesTransferred: number;
  imagesFailed: number;
  errors: Array<{ slug: string; error: string }>;
  hardcodedUrls: Array<{ slug: string; urls: string[] }>;
}

// ============================================
// Helper: Clean env values (remove quotes)
// ============================================

function cleanEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.replace(/^["']|["']$/g, '');
}

// ============================================
// Database Connections (lazy init)
// ============================================

let avvPool: Pool | null = null;
let kairnPool: Pool | null = null;
let supabase: SupabaseClient | null = null;

function initConnections(): void {
  const avvUrl = cleanEnv(process.env.AVV_DATABASE_URL);
  const kairnUrl = cleanEnv(process.env.DATABASE_URL);
  const supabaseUrl = cleanEnv(process.env.SUPABASE_URL);
  const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_KEY);

  if (avvUrl) {
    avvPool = new Pool({
      connectionString: avvUrl,
      ssl: { rejectUnauthorized: false },
    });
  }

  if (kairnUrl) {
    kairnPool = new Pool({
      connectionString: kairnUrl,
      ssl: { rejectUnauthorized: false },
    });
  }

  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
}

// ============================================
// Helper Functions
// ============================================

function generateCuid(): string {
  // Simple CUID-like ID generator
  const timestamp = Date.now().toString(36);
  const random = randomUUID().replace(/-/g, '').substring(0, 12);
  return `c${timestamp}${random}`;
}

async function fetchAppréciez Votre VieArticles(): Promise<BlogPost[]> {
  if (!avvPool) throw new Error('AVV pool not initialized');
  const query = `
    SELECT
      id, slug, title, description, content, author, category,
      tags, image, "imagePrompt", "seoIntent", persona, tones,
      faq, "jsonLd", published, featured, date, "createdAt", "updatedAt"
    FROM "BlogPostExtended"
    ORDER BY date DESC
  `;
  const result = await avvPool.query(query);
  return result.rows;
}

async function getExistingKairnSlugs(): Promise<Set<string>> {
  if (!kairnPool) throw new Error('KAIRN pool not initialized');
  const result = await kairnPool.query('SELECT slug FROM "BlogPostExtended"');
  return new Set(result.rows.map((r: { slug: string }) => r.slug));
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'KAIRN-Migration/1.0' },
    });
    if (!response.ok) {
      console.warn(`  ⚠️  Download failed: ${response.status} ${url}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.warn(`  ⚠️  Download error: ${error}`);
    return null;
  }
}

async function uploadImage(slug: string, buffer: Buffer): Promise<string | null> {
  if (!supabase) return null;

  try {
    const webpBuffer = await sharp(buffer).webp({ quality: 90 }).toBuffer();
    const filename = `${slug}.webp`;

    const { error } = await supabase.storage
      .from(KAIRN_BUCKET)
      .upload(filename, webpBuffer, { contentType: 'image/webp', upsert: true });

    if (error) {
      console.warn(`  ⚠️  Upload error: ${error.message}`);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(KAIRN_BUCKET).getPublicUrl(filename);

    return publicUrl;
  } catch (error) {
    console.warn(`  ⚠️  Image processing error: ${error}`);
    return null;
  }
}

async function migrateImage(slug: string, imageUrl: string): Promise<string | null> {
  if (!supabase) return null;
  console.log(`  📷 Migrating image for "${slug}"...`);

  const buffer = await downloadImage(imageUrl);
  if (!buffer) return null;

  const newUrl = await uploadImage(slug, buffer);
  if (newUrl) {
    console.log(`  ✅ Image migrated: ${newUrl}`);
  }
  return newUrl;
}

function findHardcodedUrls(content: string): string[] {
  const patterns = [
    /https?:\/\/[^"'\s]*avv[^"'\s]*/gi,
    /https?:\/\/[^"'\s]*ukbbkoadbgifnxbcuxbr[^"'\s]*/gi,
  ];
  const urls: string[] = [];
  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) urls.push(...matches);
  }
  return [...new Set(urls)];
}

async function insertArticle(article: BlogPost, newImageUrl: string | null): Promise<boolean> {
  if (!kairnPool) throw new Error('KAIRN pool not initialized');
  const query = `
    INSERT INTO "BlogPostExtended" (
      id, slug, title, description, content, author, category,
      tags, image, "imagePrompt", "seoIntent", persona, tones,
      faq, "jsonLd", published, featured, date, "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13,
      $14, $15, $16, $17, $18, $19, $20
    )
  `;

  try {
    await kairnPool.query(query, [
      generateCuid(),
      article.slug,
      article.title,
      article.description,
      article.content,
      article.author,
      article.category,
      article.tags || [],
      newImageUrl || article.image,
      article.imagePrompt,
      article.seoIntent,
      article.persona,
      article.tones || [],
      article.faq ? JSON.stringify(article.faq) : null,
      article.jsonLd ? JSON.stringify(article.jsonLd) : null,
      article.published,
      article.featured,
      article.date,
      article.createdAt,
      new Date(),
    ]);
    return true;
  } catch (error) {
    console.error(`  ❌ Insert failed: ${error}`);
    return false;
  }
}

// ============================================
// Main Migration
// ============================================

async function migrate(): Promise<MigrationReport> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       MIGRATION DES ARTICLES BLOG AVV → KAIRN         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Initialize database connections
  initConnections();

  const report: MigrationReport = {
    totalArticles: 0,
    migratedArticles: 0,
    skippedArticles: 0,
    imagesTransferred: 0,
    imagesFailed: 0,
    errors: [],
    hardcodedUrls: [],
  };

  try {
    // ÉTAPE 1: Analyse
    console.log('📋 ÉTAPE 1: Analyse préalable\n');

    console.log('Connexion à AVV...');
    const avvArticles = await fetchAppréciez Votre VieArticles();
    console.log(`✅ ${avvArticles.length} articles trouvés dans AVV\n`);
    report.totalArticles = avvArticles.length;

    const articlesWithImages = avvArticles.filter(a => a.image);
    console.log(`📷 ${articlesWithImages.length} articles avec images`);

    console.log('\nConnexion à KAIRN...');
    const existingSlugs = await getExistingKairnSlugs();
    console.log(`✅ ${existingSlugs.size} articles existants dans KAIRN\n`);

    const duplicates = avvArticles.filter(a => existingSlugs.has(a.slug));
    if (duplicates.length > 0) {
      console.log(`⚠️  ${duplicates.length} slugs déjà présents (ignorés):`);
      duplicates.forEach(d => console.log(`   - ${d.slug}`));
      report.skippedArticles = duplicates.length;
      console.log('');
    }

    const toMigrate = avvArticles.filter(a => !existingSlugs.has(a.slug));
    console.log(`📦 ${toMigrate.length} articles à migrer\n`);

    if (toMigrate.length === 0) {
      console.log('✅ Aucun article à migrer.\n');
      return report;
    }

    // ÉTAPE 2: Migration
    console.log('═'.repeat(60));
    console.log('📦 ÉTAPE 2: Migration des articles\n');

    for (let i = 0; i < toMigrate.length; i += BATCH_SIZE) {
      const batch = toMigrate.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(toMigrate.length / BATCH_SIZE);

      console.log(`\n── Batch ${batchNum}/${totalBatches} ──\n`);

      for (const article of batch) {
        console.log(`📝 "${article.title}" (${article.slug})`);

        // Check hardcoded URLs
        const hardcodedUrls = findHardcodedUrls(article.content);
        if (hardcodedUrls.length > 0) {
          console.log(`  ⚠️  URLs AVV détectées:`);
          hardcodedUrls.forEach(url => console.log(`     ${url}`));
          report.hardcodedUrls.push({ slug: article.slug, urls: hardcodedUrls });
        }

        // Migrate image
        let newImageUrl: string | null = null;
        if (article.image && supabase) {
          newImageUrl = await migrateImage(article.slug, article.image);
          if (newImageUrl) {
            report.imagesTransferred++;
          } else {
            report.imagesFailed++;
          }
        }

        // Insert article
        const success = await insertArticle(article, newImageUrl);
        if (success) {
          console.log(`  ✅ Article créé`);
          report.migratedArticles++;
        } else {
          report.errors.push({ slug: article.slug, error: 'Insert failed' });
        }
      }
    }

    // ÉTAPE 3: Vérification
    console.log('\n' + '═'.repeat(60));
    console.log('🔍 ÉTAPE 3: Vérifications\n');

    if (kairnPool) {
      const countResult = await kairnPool.query('SELECT COUNT(*) FROM "BlogPostExtended"');
      console.log(`📊 Total articles dans KAIRN: ${countResult.rows[0].count}`);
    }

    return report;
  } finally {
    if (avvPool) await avvPool.end();
    if (kairnPool) await kairnPool.end();
  }
}

// ============================================
// Report
// ============================================

function printReport(report: MigrationReport): void {
  console.log('\n' + '═'.repeat(60));
  console.log('📋 RAPPORT DE MIGRATION');
  console.log('═'.repeat(60) + '\n');

  console.log('┌─────────────────────────────────────┬──────────┐');
  console.log('│ Métrique                            │ Valeur   │');
  console.log('├─────────────────────────────────────┼──────────┤');
  console.log(
    `│ Articles source (AVV)           │ ${String(report.totalArticles).padStart(8)} │`
  );
  console.log(
    `│ Articles migrés                     │ ${String(report.migratedArticles).padStart(8)} │`
  );
  console.log(
    `│ Articles ignorés (doublons)         │ ${String(report.skippedArticles).padStart(8)} │`
  );
  console.log(
    `│ Images transférées                  │ ${String(report.imagesTransferred).padStart(8)} │`
  );
  console.log(
    `│ Images échouées                     │ ${String(report.imagesFailed).padStart(8)} │`
  );
  console.log('└─────────────────────────────────────┴──────────┘');

  if (report.errors.length > 0) {
    console.log('\n⚠️  ERREURS:');
    report.errors.forEach(e => console.log(`   - ${e.slug}: ${e.error}`));
  }

  if (report.hardcodedUrls.length > 0) {
    console.log('\n⚠️  URLs AVV À CORRIGER:');
    report.hardcodedUrls.forEach(item => {
      console.log(`   📝 ${item.slug}:`);
      item.urls.forEach(url => console.log(`      ${url}`));
    });
  }

  console.log('\n' + '═'.repeat(60));
  console.log(
    report.errors.length === 0
      ? '✅ MIGRATION TERMINÉE AVEC SUCCÈS'
      : '⚠️  MIGRATION AVEC AVERTISSEMENTS'
  );
  console.log('═'.repeat(60) + '\n');
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
  if (!process.env.AVV_DATABASE_URL) {
    console.error('❌ AVV_DATABASE_URL is required');
    console.error(
      '   Example: postgresql://postgres:password@db.ukbbkoadbgifnxbcuxbr.supabase.co:5432/postgres'
    );
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is required (KAIRN database)');
    process.exit(1);
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.warn("⚠️  Supabase not configured - images won't be migrated");
  }

  try {
    const report = await migrate();
    printReport(report);
    process.exit(report.errors.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
