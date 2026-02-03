/**
 * Migration script: Import blog articles from JSON export to KAIRN
 *
 * This script imports articles from a JSON file (exported from PSYPNOS Supabase)
 *
 * Usage:
 * 1. Export BlogPostExtended table from PSYPNOS Supabase as JSON
 * 2. Save as apps/psypnos/data/psypnos-blog-export.json
 * 3. Run: npx tsx apps/psypnos/scripts/migrate-blog-from-json.ts
 *
 * Required env variables:
 * - DATABASE_URL: PostgreSQL connection string for KAIRN
 * - SUPABASE_URL: KAIRN Supabase URL (for image upload)
 * - SUPABASE_SERVICE_ROLE_KEY: KAIRN Supabase service role key
 */

import { promises as fs } from 'fs';
import path from 'path';

import { PrismaClient, Prisma } from '@prisma/client';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// ============================================
// Configuration
// ============================================

const BATCH_SIZE = 10;
const KAIRN_BUCKET = 'blog-images';
const DATA_FILE = path.join(process.cwd(), 'apps/psypnos/data/psypnos-blog-export.json');

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
  date: string;
  createdAt: string;
  updatedAt: string;
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
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
async function loadArticlesFromJson(): Promise<PsypnosBlogPost[]> {
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
      console.error(`\nTo export data from PSYPNOS Supabase:`);
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
 * Create article in KAIRN database
 */
async function createKairnArticle(
  article: PsypnosBlogPost,
  newImageUrl: string | null
): Promise<boolean> {
  try {
    await prisma.blogPostExtended.create({
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
  console.log('║    MIGRATION BLOG PSYPNOS → KAIRN (depuis fichier JSON)   ║');
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
    const psypnosArticles = await loadArticlesFromJson();
    console.log(`✅ ${psypnosArticles.length} articles trouvés dans le fichier JSON\n`);

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
