/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — Legacy migration script, BlogPostExtended model removed
/**
 * Migration script: Import blog articles from PSYPNOS to KAIRN
 *
 * This script supports multiple data sources:
 * 1. Direct PostgreSQL connection to PSYPNOS (PSYPNOS_DATABASE_URL)
 * 2. Supabase REST API (PSYPNOS_SUPABASE_URL + PSYPNOS_SUPABASE_SERVICE_KEY)
 *
 * Run with: npx tsx apps/psypnos/scripts/migrate-blog-from-psypnos.ts
 *
 * Required env variables for KAIRN (destination):
 * - DATABASE_URL: PostgreSQL connection string for KAIRN
 * - SUPABASE_URL: KAIRN Supabase URL
 * - SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY: KAIRN Supabase service key
 *
 * Required env variables for PSYPNOS (source) - ONE of these:
 * - PSYPNOS_DATABASE_URL: PostgreSQL connection string for PSYPNOS
 *   OR
 * - PSYPNOS_SUPABASE_URL + PSYPNOS_SUPABASE_SERVICE_KEY: Supabase REST API credentials
 */

import { PrismaClient, Prisma } from '@prisma/client';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import sharp from 'sharp';

// ============================================
// Configuration
// ============================================

const BATCH_SIZE = 10;
const KAIRN_BUCKET = 'blog-images';

// PSYPNOS Supabase defaults (from MCP config)
const PSYPNOS_PROJECT_REF = 'ukbbkoadbgifnxbcuxbr';
const PSYPNOS_DEFAULT_URL = `https://${PSYPNOS_PROJECT_REF}.supabase.co`;

// ============================================
// Types
// ============================================

interface PsypnosBlogPost {
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
  date: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
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

type DataSource = 'postgres' | 'supabase-api';

// ============================================
// Clients
// ============================================

// KAIRN Prisma client (destination)
const kairnPrisma = new PrismaClient();

// PSYPNOS data source
let psypnosPool: Pool | null = null;
let psypnosSupabase: SupabaseClient | null = null;
let dataSource: DataSource = 'postgres';

function initPsypnosConnection(): DataSource {
  // Try PostgreSQL direct connection first
  if (process.env.PSYPNOS_DATABASE_URL) {
    psypnosPool = new Pool({
      connectionString: process.env.PSYPNOS_DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    console.log('📦 Source PSYPNOS: PostgreSQL direct connection');
    return 'postgres';
  }

  // Try Supabase REST API
  const supabaseUrl = process.env.PSYPNOS_SUPABASE_URL || PSYPNOS_DEFAULT_URL;
  const supabaseKey = process.env.PSYPNOS_SUPABASE_SERVICE_KEY;

  if (supabaseKey) {
    psypnosSupabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    console.log('📦 Source PSYPNOS: Supabase REST API');
    return 'supabase-api';
  }

  console.error('❌ No PSYPNOS data source configured!');
  console.error('   Set one of:');
  console.error('   - PSYPNOS_DATABASE_URL (PostgreSQL connection string)');
  console.error('   - PSYPNOS_SUPABASE_SERVICE_KEY (with optional PSYPNOS_SUPABASE_URL)');
  process.exit(1);
}

// KAIRN Supabase client for storage
function createKairnSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn("⚠️  KAIRN Supabase not configured - images won't be migrated");
    return null;
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

let kairnSupabase: SupabaseClient | null = null;

// ============================================
// Helper Functions
// ============================================

/**
 * Fetch all articles from PSYPNOS database via PostgreSQL
 */
async function fetchPsypnosArticlesPostgres(): Promise<PsypnosBlogPost[]> {
  if (!psypnosPool) {
    throw new Error('PostgreSQL pool not initialized');
  }

  const query = `
    SELECT
      id, slug, title, description, content, author, category,
      tags, image, "imagePrompt", "seoIntent", persona, tones,
      faq, "jsonLd", published, featured, date, "createdAt", "updatedAt"
    FROM "BlogPostExtended"
    ORDER BY date DESC
  `;

  const result = await psypnosPool.query(query);
  return result.rows;
}

/**
 * Fetch all articles from PSYPNOS via Supabase REST API
 */
async function fetchPsypnosArticlesSupabase(): Promise<PsypnosBlogPost[]> {
  if (!psypnosSupabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await psypnosSupabase
    .from('BlogPostExtended')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    throw new Error(`Supabase query error: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch articles from PSYPNOS using the configured data source
 */
async function fetchPsypnosArticles(): Promise<PsypnosBlogPost[]> {
  if (dataSource === 'postgres') {
    return fetchPsypnosArticlesPostgres();
  }
  return fetchPsypnosArticlesSupabase();
}

/**
 * Check existing slugs in KAIRN
 */
async function getExistingKairnSlugs(): Promise<Set<string>> {
  const posts = await kairnPrisma.blogPostExtended.findMany({
    select: { slug: true },
  });
  return new Set(posts.map(p => p.slug));
}

/**
 * Download image from URL
 */
async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'KAIRN-Migration-Script/1.0' },
    });

    if (!response.ok) {
      console.warn(`  ⚠️  Failed to download image: ${response.status} ${url}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.warn(`  ⚠️  Image download error: ${error}`);
    return null;
  }
}

/**
 * Upload image to KAIRN Supabase storage
 */
async function uploadImageToKairn(slug: string, buffer: Buffer): Promise<string | null> {
  if (!kairnSupabase) {
    return null;
  }

  try {
    const webpBuffer = await sharp(buffer).webp({ quality: 90 }).toBuffer();
    const filename = `${slug}.webp`;

    const { error } = await kairnSupabase.storage.from(KAIRN_BUCKET).upload(filename, webpBuffer, {
      contentType: 'image/webp',
      upsert: true,
    });

    if (error) {
      console.warn(`  ⚠️  Upload error: ${error.message}`);
      return null;
    }

    const {
      data: { publicUrl },
    } = kairnSupabase.storage.from(KAIRN_BUCKET).getPublicUrl(filename);

    return publicUrl;
  } catch (error) {
    console.warn(`  ⚠️  Image processing error: ${error}`);
    return null;
  }
}

/**
 * Migrate a single image
 */
async function migrateImage(slug: string, imageUrl: string): Promise<string | null> {
  if (!kairnSupabase) {
    return null;
  }

  console.log(`  📷 Migrating image for "${slug}"...`);

  const buffer = await downloadImage(imageUrl);
  if (!buffer) {
    return null;
  }

  const newUrl = await uploadImageToKairn(slug, buffer);
  if (newUrl) {
    console.log(`  ✅ Image migrated: ${newUrl}`);
  }

  return newUrl;
}

/**
 * Find hardcoded PSYPNOS URLs in content
 */
function findHardcodedUrls(content: string): string[] {
  const patterns = [
    /https?:\/\/[^"'\s]*psypnos[^"'\s]*/gi,
    /https?:\/\/[^"'\s]*ukbbkoadbgifnxbcuxbr[^"'\s]*/gi,
  ];

  const urls: string[] = [];
  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      urls.push(...matches);
    }
  }

  return [...new Set(urls)];
}

/**
 * Validate JSON fields
 */
function validateJsonField(value: unknown, fieldName: string, slug: string): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  try {
    if (typeof value === 'object') {
      return true;
    }

    if (typeof value === 'string') {
      JSON.parse(value);
      return true;
    }

    return false;
  } catch (error) {
    console.warn(`  ⚠️  Invalid JSON in ${fieldName} for "${slug}": ${error}`);
    return false;
  }
}

/**
 * Validate UTF-8 encoding
 */
function validateUtf8(text: string, field: string, slug: string): void {
  if (text.includes('Ã©') || text.includes('Ã¨') || text.includes('Ã ')) {
    console.warn(`  ⚠️  Possible UTF-8 encoding issue in ${field} for "${slug}"`);
  }
}

/**
 * Create article in KAIRN database
 */
async function createKairnArticle(
  article: PsypnosBlogPost,
  newImageUrl: string | null
): Promise<boolean> {
  try {
    await kairnPrisma.blogPostExtended.create({
      data: {
        slug: article.slug,
        title: article.title,
        description: article.description,
        content: article.content,
        author: article.author,
        category: article.category,
        tags: article.tags || [],
        image: newImageUrl || article.image,
        imagePrompt: article.imagePrompt,
        seoIntent: article.seoIntent,
        persona: article.persona,
        tones: article.tones || [],
        faq: article.faq ? (article.faq as InputJsonValue) : Prisma.DbNull,
        jsonLd: article.jsonLd ? (article.jsonLd as InputJsonValue) : Prisma.DbNull,
        published: article.published,
        featured: article.featured,
        date: new Date(article.date),
        createdAt: new Date(article.createdAt),
        updatedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error(`  ❌ Failed to create article: ${error}`);
    return false;
  }
}

// ============================================
// Main Migration
// ============================================

async function migrate() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       MIGRATION DES ARTICLES BLOG PSYPNOS → KAIRN         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

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
    // ========================================
    // ÉTAPE 1: Analyse préalable
    // ========================================
    console.log('📋 ÉTAPE 1: Analyse préalable\n');

    // Initialize connections
    dataSource = initPsypnosConnection();
    kairnSupabase = createKairnSupabase();

    console.log('\nConnexion à PSYPNOS...');
    const psypnosArticles = await fetchPsypnosArticles();
    console.log(`✅ ${psypnosArticles.length} articles trouvés dans PSYPNOS\n`);

    report.totalArticles = psypnosArticles.length;

    // Count articles with images
    const articlesWithImages = psypnosArticles.filter(a => a.image);
    console.log(`📷 ${articlesWithImages.length} articles avec images`);

    // Get existing KAIRN slugs
    console.log('\nConnexion à KAIRN...');
    const existingSlugs = await getExistingKairnSlugs();
    console.log(`✅ ${existingSlugs.size} articles existants dans KAIRN\n`);

    // Check for duplicates
    const duplicates = psypnosArticles.filter(a => existingSlugs.has(a.slug));
    if (duplicates.length > 0) {
      console.log(`⚠️  ${duplicates.length} slugs déjà présents (seront ignorés):`);
      duplicates.forEach(d => console.log(`   - ${d.slug}`));
      report.skippedArticles = duplicates.length;
      console.log('');
    }

    // Articles to migrate
    const toMigrate = psypnosArticles.filter(a => !existingSlugs.has(a.slug));
    console.log(`📦 ${toMigrate.length} articles à migrer\n`);

    if (toMigrate.length === 0) {
      console.log('✅ Aucun article à migrer. Migration terminée.\n');
      return report;
    }

    // ========================================
    // ÉTAPE 2: Migration par batch
    // ========================================
    console.log('═'.repeat(60));
    console.log('📦 ÉTAPE 2: Migration des articles\n');

    for (let i = 0; i < toMigrate.length; i += BATCH_SIZE) {
      const batch = toMigrate.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(toMigrate.length / BATCH_SIZE);

      console.log(`\n── Batch ${batchNum}/${totalBatches} ──\n`);

      for (const article of batch) {
        console.log(`📝 Traitement: "${article.title}" (${article.slug})`);

        // Validate UTF-8
        validateUtf8(article.title, 'title', article.slug);
        validateUtf8(article.content, 'content', article.slug);

        // Check for hardcoded URLs
        const hardcodedUrls = findHardcodedUrls(article.content);
        if (hardcodedUrls.length > 0) {
          console.log(`  ⚠️  URLs PSYPNOS détectées dans le contenu:`);
          hardcodedUrls.forEach(url => console.log(`     ${url}`));
          report.hardcodedUrls.push({ slug: article.slug, urls: hardcodedUrls });
        }

        // Validate JSON fields
        validateJsonField(article.faq, 'faq', article.slug);
        validateJsonField(article.jsonLd, 'jsonLd', article.slug);

        // Migrate image if present
        let newImageUrl: string | null = null;
        if (article.image && kairnSupabase) {
          newImageUrl = await migrateImage(article.slug, article.image);
          if (newImageUrl) {
            report.imagesTransferred++;
          } else {
            report.imagesFailed++;
          }
        }

        // Create article in KAIRN
        const success = await createKairnArticle(article, newImageUrl);
        if (success) {
          console.log(`  ✅ Article créé dans KAIRN`);
          report.migratedArticles++;
        } else {
          report.errors.push({
            slug: article.slug,
            error: 'Failed to create in KAIRN',
          });
        }
      }
    }

    // ========================================
    // ÉTAPE 3: Vérifications post-migration
    // ========================================
    console.log('\n' + '═'.repeat(60));
    console.log('🔍 ÉTAPE 3: Vérifications post-migration\n');

    const finalCount = await kairnPrisma.blogPostExtended.count();
    console.log(`📊 Total articles dans KAIRN: ${finalCount}`);

    // Verify a sample article
    if (report.migratedArticles > 0) {
      const sampleSlug = toMigrate[0]?.slug;
      if (sampleSlug) {
        const sample = await kairnPrisma.blogPostExtended.findUnique({
          where: { slug: sampleSlug },
        });

        if (sample) {
          console.log(`\n✅ Vérification article sample "${sampleSlug}":`);
          console.log(`   - Titre: ${sample.title}`);
          console.log(`   - Catégorie: ${sample.category}`);
          console.log(`   - Tags: ${sample.tags.join(', ')}`);
          console.log(`   - Image: ${sample.image ? '✓' : '✗'}`);
          console.log(`   - FAQ: ${sample.faq ? '✓' : '✗'}`);
          console.log(`   - JSON-LD: ${sample.jsonLd ? '✓' : '✗'}`);
          console.log(`   - Publié: ${sample.published ? 'Oui' : 'Non'}`);
        }
      }
    }

    // Test image URLs
    if (report.imagesTransferred > 0) {
      console.log("\n🔗 Test d'accessibilité des images:");
      const articlesWithNewImages = await kairnPrisma.blogPostExtended.findMany({
        where: { image: { contains: 'supabase' } },
        take: 3,
        select: { slug: true, image: true },
      });

      for (const article of articlesWithNewImages) {
        if (article.image) {
          try {
            const response = await fetch(article.image, { method: 'HEAD' });
            console.log(`   ${response.ok ? '✅' : '❌'} ${article.slug}: ${response.status}`);
          } catch {
            console.log(`   ❌ ${article.slug}: Erreur de connexion`);
          }
        }
      }
    }

    return report;
  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error);
    throw error;
  } finally {
    await kairnPrisma.$disconnect();
    if (psypnosPool) {
      await psypnosPool.end();
    }
  }
}

// ============================================
// Generate Report
// ============================================

function printReport(report: MigrationReport) {
  console.log('\n' + '═'.repeat(60));
  console.log('📋 RAPPORT DE MIGRATION');
  console.log('═'.repeat(60) + '\n');

  console.log('┌─────────────────────────────────────┬──────────┐');
  console.log('│ Métrique                            │ Valeur   │');
  console.log('├─────────────────────────────────────┼──────────┤');
  console.log(
    `│ Articles source (PSYPNOS)           │ ${String(report.totalArticles).padStart(8)} │`
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
    console.log('\n⚠️  ERREURS RENCONTRÉES:');
    report.errors.forEach(e => {
      console.log(`   - ${e.slug}: ${e.error}`);
    });
  }

  if (report.hardcodedUrls.length > 0) {
    console.log('\n⚠️  URLs PSYPNOS HARDCODÉES À CORRIGER:');
    report.hardcodedUrls.forEach(item => {
      console.log(`   📝 ${item.slug}:`);
      item.urls.forEach(url => console.log(`      ${url}`));
    });
  }

  console.log('\n' + '═'.repeat(60));
  console.log(
    report.errors.length === 0
      ? '✅ MIGRATION TERMINÉE AVEC SUCCÈS'
      : '⚠️  MIGRATION TERMINÉE AVEC DES AVERTISSEMENTS'
  );
  console.log('═'.repeat(60) + '\n');
}

// ============================================
// Execute
// ============================================

async function main() {
  // Check KAIRN required env vars
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  // PSYPNOS source will be checked in initPsypnosConnection()

  try {
    const report = await migrate();
    printReport(report);
    process.exit(report.errors.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
