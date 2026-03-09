/* eslint-disable @typescript-eslint/ban-ts-comment, no-console, security/detect-non-literal-fs-filename */
// @ts-nocheck — Legacy migration script, BlogPostExtended model removed
/**
 * Migration script: Import blog articles from JSON export to KAIRN
 *
 * This script imports articles from a JSON file (exported from AVV Supabase)
 *
 * Usage:
 * 1. Export BlogPostExtended table from AVV Supabase as JSON
 * 2. Save as apps/avv/data/avv-blog-export.json
 * 3. Run: npx tsx apps/avv/scripts/migrate-blog-from-json.ts
 *
 * Required env variables:
 * - DATABASE_URL: PostgreSQL connection string for KAIRN
 * - SUPABASE_URL: KAIRN Supabase URL (for image upload)
 * - SUPABASE_SERVICE_KEY: KAIRN Supabase service role key
 */

import { promises as fs } from 'fs';
import path from 'path';

import { PrismaClient, Prisma } from '@prisma/client';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import sharp from 'sharp';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

// ============================================
// Configuration
// ============================================

const BATCH_SIZE = 10;
const KAIRN_BUCKET = 'blog-images';
const DATA_FILE = path.join(process.cwd(), 'apps/avv/data/avv-blog-export.json');
const AVV_BASE_URL = 'https://appreciezvotrevie.fr';

// ============================================
// Types
// ============================================

interface Appréciez Votre VieBlogPost {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  author: string;
  category: string;
  tags: string | string[];
  image: string | null;
  image_prompt: string | null;
  seo_intent: string | null;
  persona: string | null;
  tones: string | string[];
  faq: string | unknown;
  json_ld: string | unknown;
  published: boolean;
  featured: boolean;
  date: string;
  created_at: string;
  updated_at: string;
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
// Clients
// ============================================

const prisma = new PrismaClient();

function createKairnSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.warn("⚠️  Supabase not configured - images won't be migrated");
    return null;
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const kairnSupabase = createKairnSupabase();

// ============================================
// Helper Functions
// ============================================

/**
 * Load articles from JSON file
 */
async function loadArticlesFromJson(): Promise<Appréciez Votre VieBlogPost[]> {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(content);

    // Handle both array and object with articles property
    if (Array.isArray(data)) {
      return data;
    }
    if (data.articles && Array.isArray(data.articles)) {
      return data.articles;
    }

    throw new Error("Invalid JSON format: expected array or object with 'articles' property");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(`❌ File not found: ${DATA_FILE}`);
      console.error(`\nTo export data from AVV Supabase:`);
      console.error(`1. Go to https://supabase.com/dashboard/project/ukbbkoadbgifnxbcuxbr`);
      console.error(`2. Navigate to Table Editor > BlogPostExtended`);
      console.error(`3. Click "Export" > "Export as JSON"`);
      console.error(`4. Save the file as: ${DATA_FILE}`);
    }
    throw error;
  }
}

/**
 * Check existing slugs in KAIRN
 */
async function getExistingKairnSlugs(): Promise<Set<string>> {
  const posts = await prisma.blogPostExtended.findMany({
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
  console.log(`  📷 Migrating image for "${slug}"...`);

  // Convert relative paths to full URLs
  const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${AVV_BASE_URL}${imageUrl}`;
  const buffer = await downloadImage(fullUrl);
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
 * Find hardcoded AVV URLs in content
 */
function findHardcodedUrls(content: string): string[] {
  const patterns = [
    /https?:\/\/[^"'\s]*avv[^"'\s]*/gi,
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
 * Validate UTF-8 encoding
 */
function validateUtf8(text: string, field: string, slug: string): boolean {
  try {
    // Check for common encoding issues
    if (text.includes('Ã©') || text.includes('Ã¨') || text.includes('Ã ')) {
      console.warn(`  ⚠️  Possible UTF-8 encoding issue in ${field} for "${slug}"`);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse JSON field (handles both string and object)
 */
function parseJsonField(value: string | unknown): unknown {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

/**
 * Create article in KAIRN database
 */
async function createKairnArticle(
  article: Appréciez Votre VieBlogPost,
  newImageUrl: string | null
): Promise<boolean> {
  try {
    // Parse JSON fields that might be strings
    const tags = parseJsonField(article.tags);
    const tones = parseJsonField(article.tones);
    const faq = parseJsonField(article.faq);
    const jsonLd = parseJsonField(article.json_ld);

    await prisma.blogPostExtended.create({
      data: {
        slug: article.slug,
        title: article.title,
        description: article.description,
        content: article.content,
        author: article.author,
        category: article.category,
        tags: Array.isArray(tags) ? tags : [],
        image: newImageUrl || article.image,
        imagePrompt: article.image_prompt,
        seoIntent: article.seo_intent,
        persona: article.persona,
        tones: Array.isArray(tones) ? tones : [],
        faq: faq ? (faq as InputJsonValue) : Prisma.DbNull,
        jsonLd: jsonLd ? (jsonLd as InputJsonValue) : Prisma.DbNull,
        published: article.published,
        featured: article.featured,
        date: new Date(article.date),
        createdAt: new Date(article.created_at),
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
  console.log('║    MIGRATION BLOG AVV → KAIRN (depuis fichier JSON)   ║');
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
    // ÉTAPE 1: Chargement des données
    // ========================================
    console.log('📋 ÉTAPE 1: Chargement des données\n');

    console.log(`Lecture du fichier: ${DATA_FILE}`);
    const avvArticles = await loadArticlesFromJson();
    console.log(`✅ ${avvArticles.length} articles trouvés dans le fichier JSON\n`);

    report.totalArticles = avvArticles.length;

    // Count articles with images
    const articlesWithImages = avvArticles.filter(a => a.image);
    console.log(`📷 ${articlesWithImages.length} articles avec images`);

    // Get existing KAIRN slugs
    console.log('\nConnexion à KAIRN...');
    const existingSlugs = await getExistingKairnSlugs();
    console.log(`✅ ${existingSlugs.size} articles existants dans KAIRN\n`);

    // Check for duplicates
    const duplicates = avvArticles.filter(a => existingSlugs.has(a.slug));
    if (duplicates.length > 0) {
      console.log(`⚠️  ${duplicates.length} slugs déjà présents (seront ignorés):`);
      duplicates.forEach(d => console.log(`   - ${d.slug}`));
      report.skippedArticles = duplicates.length;
      console.log('');
    }

    // Articles to migrate
    const toMigrate = avvArticles.filter(a => !existingSlugs.has(a.slug));
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
          console.log(`  ⚠️  URLs AVV détectées dans le contenu:`);
          hardcodedUrls.forEach(url => console.log(`     ${url}`));
          report.hardcodedUrls.push({ slug: article.slug, urls: hardcodedUrls });
        }

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

    const finalCount = await prisma.blogPostExtended.count();
    console.log(`📊 Total articles dans KAIRN: ${finalCount}`);

    // Verify a sample article
    if (report.migratedArticles > 0) {
      const sampleSlug = toMigrate[0]?.slug;
      if (sampleSlug) {
        const sample = await prisma.blogPostExtended.findUnique({
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

    return report;
  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
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
    `│ Articles source (JSON)              │ ${String(report.totalArticles).padStart(8)} │`
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
    console.log('\n⚠️  URLs AVV HARDCODÉES À CORRIGER:');
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
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

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
