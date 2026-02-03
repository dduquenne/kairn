#!/usr/bin/env npx tsx
/**
 * Migration Script using Supabase REST API for PSYPNOS
 *
 * Uses Supabase REST API to read from PSYPNOS, pg to write to KAIRN
 *
 * Required env:
 * - PSYPNOS_SUPABASE_SERVICE_KEY: PSYPNOS service key
 * - DATABASE_URL: KAIRN PostgreSQL connection
 * - SUPABASE_URL + SUPABASE_SERVICE_KEY: KAIRN Supabase (for images)
 */

import { randomUUID } from 'crypto';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import sharp from 'sharp';

const BATCH_SIZE = 10;
const KAIRN_BUCKET = 'blog-images';
const PSYPNOS_URL = 'https://ukbbkoadbgifnxbcuxbr.supabase.co';

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

function cleanEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.replace(/^["']|["']$/g, '');
}

// Clients
let psypnosSupabase: SupabaseClient | null = null;
let kairnPool: Pool | null = null;
let kairnSupabase: SupabaseClient | null = null;

function initConnections(): void {
  const psypnosKey = cleanEnv(process.env.PSYPNOS_SUPABASE_SERVICE_KEY);
  const kairnUrl = cleanEnv(process.env.DATABASE_URL);
  const supabaseUrl = cleanEnv(process.env.SUPABASE_URL);
  const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_KEY);

  if (psypnosKey) {
    psypnosSupabase = createClient(PSYPNOS_URL, psypnosKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    console.log('📦 Source: PSYPNOS Supabase REST API');
  }

  if (kairnUrl) {
    kairnPool = new Pool({
      connectionString: kairnUrl,
      ssl: { rejectUnauthorized: false },
    });
    console.log('📦 Destination: KAIRN PostgreSQL');
  }

  if (supabaseUrl && supabaseKey) {
    kairnSupabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    console.log('📦 Storage: KAIRN Supabase');
  }
}

function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const random = randomUUID().replace(/-/g, '').substring(0, 12);
  return `c${timestamp}${random}`;
}

async function fetchPsypnosArticles(): Promise<BlogPost[]> {
  if (!psypnosSupabase) throw new Error('PSYPNOS Supabase not initialized');

  const { data, error } = await psypnosSupabase
    .from('BlogPostExtended')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data || [];
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
      console.warn(`  ⚠️  Download failed: ${response.status}`);
      return null;
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.warn(`  ⚠️  Download error: ${error}`);
    return null;
  }
}

async function uploadImage(slug: string, buffer: Buffer): Promise<string | null> {
  if (!kairnSupabase) return null;

  try {
    const webpBuffer = await sharp(buffer).webp({ quality: 90 }).toBuffer();
    const filename = `${slug}.webp`;

    const { error } = await kairnSupabase.storage
      .from(KAIRN_BUCKET)
      .upload(filename, webpBuffer, { contentType: 'image/webp', upsert: true });

    if (error) {
      console.warn(`  ⚠️  Upload error: ${error.message}`);
      return null;
    }

    const {
      data: { publicUrl },
    } = kairnSupabase.storage.from(KAIRN_BUCKET).getPublicUrl(filename);

    return publicUrl;
  } catch (error) {
    console.warn(`  ⚠️  Image error: ${error}`);
    return null;
  }
}

async function migrateImage(slug: string, imageUrl: string): Promise<string | null> {
  if (!kairnSupabase) return null;
  console.log(`  📷 Migrating image...`);

  const buffer = await downloadImage(imageUrl);
  if (!buffer) return null;

  const newUrl = await uploadImage(slug, buffer);
  if (newUrl) console.log(`  ✅ Image: ${newUrl.substring(0, 60)}...`);
  return newUrl;
}

function findHardcodedUrls(content: string): string[] {
  const patterns = [
    /https?:\/\/[^"'\s]*psypnos[^"'\s]*/gi,
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
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
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

async function migrate(): Promise<MigrationReport> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       MIGRATION DES ARTICLES BLOG PSYPNOS → KAIRN         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

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
    console.log('\n📋 ÉTAPE 1: Analyse préalable\n');

    const psypnosArticles = await fetchPsypnosArticles();
    console.log(`✅ ${psypnosArticles.length} articles trouvés dans PSYPNOS`);
    report.totalArticles = psypnosArticles.length;

    const articlesWithImages = psypnosArticles.filter(a => a.image);
    console.log(`📷 ${articlesWithImages.length} articles avec images`);

    const existingSlugs = await getExistingKairnSlugs();
    console.log(`✅ ${existingSlugs.size} articles existants dans KAIRN\n`);

    const duplicates = psypnosArticles.filter(a => existingSlugs.has(a.slug));
    if (duplicates.length > 0) {
      console.log(`⚠️  ${duplicates.length} slugs déjà présents (ignorés):`);
      duplicates.slice(0, 5).forEach(d => console.log(`   - ${d.slug}`));
      if (duplicates.length > 5) console.log(`   ... et ${duplicates.length - 5} autres`);
      report.skippedArticles = duplicates.length;
    }

    const toMigrate = psypnosArticles.filter(a => !existingSlugs.has(a.slug));
    console.log(`\n📦 ${toMigrate.length} articles à migrer\n`);

    if (toMigrate.length === 0) {
      console.log('✅ Aucun article à migrer.\n');
      return report;
    }

    console.log('═'.repeat(60));
    console.log('📦 ÉTAPE 2: Migration\n');

    for (let i = 0; i < toMigrate.length; i += BATCH_SIZE) {
      const batch = toMigrate.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(toMigrate.length / BATCH_SIZE);

      console.log(`\n── Batch ${batchNum}/${totalBatches} ──\n`);

      for (const article of batch) {
        console.log(`📝 "${article.title.substring(0, 50)}..." (${article.slug})`);

        const hardcodedUrls = findHardcodedUrls(article.content);
        if (hardcodedUrls.length > 0) {
          console.log(`  ⚠️  ${hardcodedUrls.length} URLs PSYPNOS détectées`);
          report.hardcodedUrls.push({ slug: article.slug, urls: hardcodedUrls });
        }

        let newImageUrl: string | null = null;
        if (article.image && kairnSupabase) {
          newImageUrl = await migrateImage(article.slug, article.image);
          if (newImageUrl) report.imagesTransferred++;
          else report.imagesFailed++;
        }

        const success = await insertArticle(article, newImageUrl);
        if (success) {
          console.log(`  ✅ Article créé`);
          report.migratedArticles++;
        } else {
          report.errors.push({ slug: article.slug, error: 'Insert failed' });
        }
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('🔍 ÉTAPE 3: Vérification\n');

    if (kairnPool) {
      const countResult = await kairnPool.query('SELECT COUNT(*) FROM "BlogPostExtended"');
      console.log(`📊 Total articles dans KAIRN: ${countResult.rows[0].count}`);
    }

    return report;
  } finally {
    if (kairnPool) await kairnPool.end();
  }
}

function printReport(report: MigrationReport): void {
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
    console.log('\n⚠️  ERREURS:');
    report.errors.forEach(e => console.log(`   - ${e.slug}: ${e.error}`));
  }

  if (report.hardcodedUrls.length > 0) {
    console.log('\n⚠️  URLs PSYPNOS À CORRIGER:');
    report.hardcodedUrls.forEach(item => {
      console.log(`   📝 ${item.slug}: ${item.urls.length} URLs`);
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

async function main(): Promise<void> {
  if (!process.env.PSYPNOS_SUPABASE_SERVICE_KEY) {
    console.error('❌ PSYPNOS_SUPABASE_SERVICE_KEY is required');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is required');
    process.exit(1);
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
