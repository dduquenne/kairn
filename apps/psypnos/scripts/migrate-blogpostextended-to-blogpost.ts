/* eslint-disable no-console */
/**
 * Migration: BlogPostExtended → BlogPost
 *
 * This script migrates all articles from the legacy BlogPostExtended model
 * to the multi-tenant BlogPost model with proper Tag relations.
 *
 * Field mapping:
 * - description → excerpt
 * - image → coverImage
 * - published (bool) → status (PUBLISHED/DRAFT)
 * - date → publishedAt
 * - author (string) → authorName
 * - tags (string[]) → Tag + BlogPostTag relations
 * - Other fields: direct copy
 */

import path from 'path';

import { Prisma, PostStatus, PrismaClient } from '@prisma/client';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import { config } from 'dotenv';

config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

// Psypnos site slug - site ID is looked up dynamically
const PSYPNOS_SITE_SLUG = 'psypnos';

/**
 * Create a URL-friendly slug from a tag name
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens from ends
}

/**
 * Get or create a tag by name
 */
async function getOrCreateTag(tagName: string): Promise<string> {
  const slug = slugify(tagName);

  // Try to find existing tag
  const existingTag = await prisma.tag.findUnique({
    where: { slug },
  });

  if (existingTag) {
    return existingTag.id;
  }

  // Create new tag
  const newTag = await prisma.tag.create({
    data: {
      name: tagName,
      slug,
    },
  });

  console.log(`  📌 Created tag: "${tagName}" (${slug})`);
  return newTag.id;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  MIGRATION: BlogPostExtended → BlogPost                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Verify site exists (lookup by slug)
  const site = await prisma.site.findUnique({
    where: { slug: PSYPNOS_SITE_SLUG },
  });

  if (!site) {
    console.error(`❌ Site not found with slug: ${PSYPNOS_SITE_SLUG}`);
    process.exit(1);
  }

  const PSYPNOS_SITE_ID = site.id;
  console.log(`✅ Site found: ${site.name} (${site.slug}) — ID: ${PSYPNOS_SITE_ID}\n`);

  // Check existing BlogPost articles
  const existingPosts = await prisma.blogPost.findMany({
    where: { siteId: PSYPNOS_SITE_ID },
    select: { slug: true },
  });
  const existingSlugs = new Set(existingPosts.map(p => p.slug));
  console.log(`📊 Existing BlogPost articles: ${existingSlugs.size}\n`);

  // Read all BlogPostExtended articles
  console.log('📖 Reading BlogPostExtended articles...');
  const extendedPosts = await prisma.blogPostExtended.findMany({
    orderBy: { date: 'asc' },
  });
  console.log(`✅ Found ${extendedPosts.length} articles\n`);

  // Filter articles to migrate
  const toMigrate = extendedPosts.filter(p => !existingSlugs.has(p.slug));
  console.log(`📦 Articles to migrate: ${toMigrate.length}`);

  if (toMigrate.length === 0) {
    console.log('\n✅ All articles already migrated. Nothing to do.');
    await prisma.$disconnect();
    return;
  }

  // Collect all unique tags
  console.log('\n── Phase 1: Creating tags ──');
  const allTags = new Set<string>();
  for (const post of toMigrate) {
    for (const tag of post.tags) {
      allTags.add(tag);
    }
  }
  console.log(`📌 Unique tags to process: ${allTags.size}`);

  // Create tag map (name → id)
  const tagMap = new Map<string, string>();
  for (const tagName of allTags) {
    const tagId = await getOrCreateTag(tagName);
    tagMap.set(tagName, tagId);
  }
  console.log(`✅ ${tagMap.size} tags ready\n`);

  // Migrate articles
  console.log('── Phase 2: Migrating articles ──');
  let migrated = 0;
  let failed = 0;

  for (const post of toMigrate) {
    try {
      // Map status
      const status: PostStatus = post.published ? PostStatus.PUBLISHED : PostStatus.DRAFT;

      // Create BlogPost with tags in a transaction
      await prisma.$transaction(async tx => {
        // Create the blog post
        const newPost = await tx.blogPost.create({
          data: {
            slug: post.slug,
            title: post.title,
            excerpt: post.description,
            content: post.content,
            coverImage: post.image,
            status,
            publishedAt: post.date,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            // Extended fields
            category: post.category,
            imagePrompt: post.imagePrompt,
            seoIntent: post.seoIntent,
            persona: post.persona,
            tones: post.tones,
            faq: post.faq ? (post.faq as InputJsonValue) : Prisma.DbNull,
            jsonLd: post.jsonLd ? (post.jsonLd as InputJsonValue) : Prisma.DbNull,
            featured: post.featured,
            authorName: post.author,
            // Multi-tenancy
            siteId: PSYPNOS_SITE_ID,
            // No authorId (using authorName fallback)
            authorId: null,
          },
        });

        // Create BlogPostTag relations
        if (post.tags.length > 0) {
          const tagRelations = post.tags.map(tagName => ({
            postId: newPost.id,
            tagId: tagMap.get(tagName)!,
          }));

          await tx.blogPostTag.createMany({
            data: tagRelations,
          });
        }
      });

      migrated++;
      const statusIcon = post.published ? '✓' : '○';
      console.log(`  ${statusIcon} "${post.title}" (${post.tags.length} tags)`);
    } catch (error) {
      failed++;
      console.error(`  ❌ Failed: "${post.title}"`, error);
    }
  }

  // Final report
  console.log('\n' + '═'.repeat(60));
  console.log('📋 MIGRATION REPORT');
  console.log('═'.repeat(60));
  console.log(`Source articles (BlogPostExtended): ${extendedPosts.length}`);
  console.log(`Already migrated: ${existingSlugs.size}`);
  console.log(`Migrated this run: ${migrated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Tags created/used: ${tagMap.size}`);
  console.log('═'.repeat(60));

  // Verify final counts
  const finalCount = await prisma.blogPost.count({
    where: { siteId: PSYPNOS_SITE_ID },
  });
  console.log(`\n📊 Total BlogPost articles for Psypnos: ${finalCount}`);

  await prisma.$disconnect();

  if (failed === 0) {
    console.log('\n✅ MIGRATION COMPLETED SUCCESSFULLY');
  } else {
    console.log('\n⚠️  MIGRATION COMPLETED WITH ERRORS');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
