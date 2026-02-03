#!/usr/bin/env npx tsx
/**
 * Script to list all blog articles from PSYPNOS BlogPostExtended table
 *
 * Usage:
 *   PSYPNOS_SUPABASE_SERVICE_KEY="your-key" npx tsx apps/psypnos/scripts/list-blog-articles.ts
 *
 * Or with DATABASE_URL:
 *   PSYPNOS_DATABASE_URL="postgresql://..." npx tsx apps/psypnos/scripts/list-blog-articles.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

// PSYPNOS Supabase defaults
const PSYPNOS_PROJECT_REF = 'ukbbkoadbgifnxbcuxbr';
const PSYPNOS_SUPABASE_URL = `https://${PSYPNOS_PROJECT_REF}.supabase.co`;

interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  author: string;
  category: string;
  tags: string[];
  image: string | null;
  published: boolean;
  featured: boolean;
  date: string;
  createdAt: string;
}

async function listArticlesViaSupabase(): Promise<BlogArticle[]> {
  const serviceKey = process.env.PSYPNOS_SUPABASE_SERVICE_KEY;

  if (!serviceKey) {
    throw new Error('PSYPNOS_SUPABASE_SERVICE_KEY not set');
  }

  const supabase = createClient(PSYPNOS_SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from('BlogPostExtended')
    .select(
      'id, slug, title, description, author, category, tags, image, published, featured, date, createdAt'
    )
    .order('date', { ascending: false });

  if (error) {
    throw new Error(`Supabase query error: ${error.message}`);
  }

  return data || [];
}

async function listArticlesViaPostgres(): Promise<BlogArticle[]> {
  const connectionString = process.env.PSYPNOS_DATABASE_URL;

  if (!connectionString) {
    throw new Error('PSYPNOS_DATABASE_URL not set');
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const query = `
      SELECT id, slug, title, description, author, category, tags, image, published, featured, date, "createdAt"
      FROM "BlogPostExtended"
      ORDER BY date DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('PSYPNOS BlogPostExtended - Article List');
  console.log('='.repeat(70));
  console.log('');

  let articles: BlogArticle[];

  // Try Supabase API first, then fall back to PostgreSQL
  if (process.env.PSYPNOS_SUPABASE_SERVICE_KEY) {
    console.log('Using Supabase REST API...\n');
    articles = await listArticlesViaSupabase();
  } else if (process.env.PSYPNOS_DATABASE_URL) {
    console.log('Using PostgreSQL direct connection...\n');
    articles = await listArticlesViaPostgres();
  } else {
    console.error('Error: No connection method available.');
    console.error('');
    console.error('Please set one of:');
    console.error('  - PSYPNOS_SUPABASE_SERVICE_KEY (Supabase service role key)');
    console.error('  - PSYPNOS_DATABASE_URL (PostgreSQL connection string)');
    console.error('');
    console.error('Example:');
    console.error(
      '  PSYPNOS_SUPABASE_SERVICE_KEY="eyJ..." npx tsx apps/psypnos/scripts/list-blog-articles.ts'
    );
    process.exit(1);
  }

  console.log(`Found ${articles.length} articles:\n`);

  // Summary table
  console.log('| # | Slug | Title | Category | Image | Published |');
  console.log('|---|------|-------|----------|-------|-----------|');

  articles.forEach((article, index) => {
    const slug = article.slug.substring(0, 40).padEnd(40);
    const title = article.title.substring(0, 50).padEnd(50);
    const category = (article.category || 'N/A').padEnd(15);
    const hasImage = article.image ? 'Yes' : 'No';
    const published = article.published ? 'Yes' : 'No';

    console.log(
      `| ${String(index + 1).padStart(2)} | ${slug} | ${title} | ${category} | ${hasImage.padEnd(5)} | ${published.padEnd(9)} |`
    );
  });

  console.log('');
  console.log('='.repeat(70));
  console.log('Summary:');
  console.log(`  Total articles: ${articles.length}`);
  console.log(`  Published: ${articles.filter(a => a.published).length}`);
  console.log(`  Featured: ${articles.filter(a => a.featured).length}`);
  console.log(`  With images: ${articles.filter(a => a.image).length}`);
  console.log('');

  // Categories breakdown
  const categories = articles.reduce(
    (acc, article) => {
      const cat = article.category || 'Unknown';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log('Categories:');
  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  - ${cat}: ${count} articles`);
    });

  console.log('');
  console.log('='.repeat(70));

  // Output JSON for further processing
  console.log('\nDetailed JSON output:\n');
  console.log(JSON.stringify(articles, null, 2));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
