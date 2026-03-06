/* eslint-disable @typescript-eslint/ban-ts-comment, no-console, @typescript-eslint/no-non-null-assertion */
// @ts-nocheck — Legacy migration script, BlogPostExtended model removed
/**
 * Insert blog articles to Supabase KAIRN
 *
 * This script reads articles from local PostgreSQL and inserts them into Supabase
 * Uses Supabase client directly (not Prisma) to write to remote database
 */

import path from 'path';

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BATCH_SIZE = 10;

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║    INSERT BLOG ARTICLES TO SUPABASE KAIRN                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Read articles from local database
  console.log('📖 Reading articles from local database...');
  const articles = await prisma.blogPostExtended.findMany();
  console.log(`✅ Found ${articles.length} articles\n`);

  // Check existing articles in Supabase
  console.log('🔍 Checking existing articles in Supabase...');
  const { data: existingArticles, error: fetchError } = await supabase
    .from('BlogPostExtended')
    .select('slug');

  if (fetchError) {
    console.error('❌ Failed to fetch existing articles:', fetchError);
    process.exit(1);
  }

  const existingSlugs = new Set(existingArticles?.map(a => a.slug) || []);
  console.log(`📊 ${existingSlugs.size} articles already in Supabase\n`);

  // Filter articles to insert
  const toInsert = articles.filter(a => !existingSlugs.has(a.slug));
  console.log(`📦 ${toInsert.length} articles to insert\n`);

  if (toInsert.length === 0) {
    console.log('✅ All articles already exist in Supabase. Nothing to do.');
    await prisma.$disconnect();
    return;
  }

  // Insert in batches
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toInsert.length / BATCH_SIZE);

    console.log(`── Batch ${batchNum}/${totalBatches} ──`);

    // Transform articles for Supabase (ensure correct types)
    const batchData = batch.map(article => ({
      id: article.id,
      slug: article.slug,
      title: article.title,
      description: article.description,
      content: article.content,
      author: article.author,
      category: article.category,
      tags: article.tags,
      image: article.image,
      imagePrompt: article.imagePrompt,
      seoIntent: article.seoIntent,
      persona: article.persona,
      tones: article.tones,
      faq: article.faq,
      jsonLd: article.jsonLd,
      published: article.published,
      featured: article.featured,
      date: article.date.toISOString(),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    }));

    const { data, error } = await supabase
      .from('BlogPostExtended')
      .insert(batchData)
      .select('slug');

    if (error) {
      console.error(`  ❌ Batch failed:`, error.message);
      failed += batch.length;
    } else {
      console.log(`  ✅ Inserted ${data?.length || 0} articles`);
      inserted += data?.length || 0;
    }
  }

  // Final report
  console.log('\n' + '═'.repeat(60));
  console.log('📋 INSERTION REPORT');
  console.log('═'.repeat(60));
  console.log(`Total articles: ${toInsert.length}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Failed: ${failed}`);
  console.log('═'.repeat(60) + '\n');

  await prisma.$disconnect();

  if (failed === 0) {
    console.log('✅ ALL ARTICLES INSERTED SUCCESSFULLY');
  } else {
    console.log('⚠️  SOME ARTICLES FAILED TO INSERT');
    process.exit(1);
  }
}

main().catch(console.error);
