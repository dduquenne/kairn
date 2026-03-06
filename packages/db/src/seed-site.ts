/**
 * Configurable Site Seeding Script
 *
 * Seeds a new site with initial data based on provided configuration.
 * Can be called from the CLI `kairn init` or directly via:
 *   pnpm tsx packages/db/src/seed-site.ts --slug <site-slug> --name <site-name> --domain <domain>
 *
 * Creates:
 * - Site record with configuration
 * - Admin user (email: admin@<domain>)
 * - Default blog tags
 * - Initial JWT secret key
 */

import { randomBytes, createHash } from 'crypto';

import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

/** Configuration for seeding a new site */
export interface SeedSiteConfig {
  /** Site slug (URL-safe identifier) */
  slug: string;
  /** Display name */
  name: string;
  /** Domain (e.g. 'example.fr') */
  domain: string;
  /** Admin email (defaults to admin@<domain>) */
  adminEmail?: string;
  /** Admin password (defaults to generated random password) */
  adminPassword?: string;
  /** Features to enable */
  features?: {
    blog?: boolean;
    testimonials?: boolean;
    appointments?: boolean;
    analytics?: boolean;
    seminars?: boolean;
  };
  /** Include demo data (blog post, testimonials, contact) */
  includeDemoData?: boolean;
}

/** Result of seeding a site */
export interface SeedSiteResult {
  siteId: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
  secretKeyKid: string;
  tagsCreated: number;
  demoDataCreated: boolean;
}

/**
 * Hash a password using SHA-256 (for seeding purposes)
 */
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Generate a cryptographically secure random string
 */
function generateRandomString(length: number): string {
  return randomBytes(length).toString('hex').slice(0, length);
}

/**
 * Seed a new site with initial data.
 *
 * Uses upsert to be idempotent — safe to run multiple times.
 */
export async function seedSite(config: SeedSiteConfig): Promise<SeedSiteResult> {
  const {
    slug,
    name,
    domain,
    adminEmail = `admin@${domain}`,
    adminPassword = generateRandomString(16),
    features = { blog: true, testimonials: true, appointments: true, analytics: true },
    includeDemoData = false,
  } = config;

  // eslint-disable-next-line no-console
  console.log(`\n🌱 Seeding site: ${name} (${slug})\n`);

  // 1. Create site
  const site = await prisma.site.upsert({
    where: { slug },
    update: {},
    create: {
      slug,
      name,
      domain,
      isActive: true,
      config: { features },
    },
  });
  // eslint-disable-next-line no-console
  console.log(`  ✓ Site created: ${site.name} (${site.slug})`);

  // 2. Create admin user
  const admin = await prisma.user.upsert({
    where: { email_siteId: { email: adminEmail, siteId: site.id } },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      firstName: 'Admin',
      lastName: name,
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: new Date(),
      siteId: site.id,
    },
  });
  // eslint-disable-next-line no-console
  console.log(`  ✓ Admin user created: ${admin.email}`);

  // 3. Create default tags
  const defaultTags = [
    { name: 'Bien-être', slug: 'bien-etre', color: '#D97706' },
    { name: 'Développement Personnel', slug: 'developpement-personnel', color: '#7C3AED' },
    { name: 'Santé', slug: 'sante', color: '#059669' },
    { name: 'Conseils', slug: 'conseils', color: '#4F46E5' },
  ];

  const tags = await Promise.all(
    defaultTags.map(tag =>
      prisma.tag.upsert({
        where: { slug_siteId: { slug: tag.slug, siteId: site.id } },
        update: {},
        create: { ...tag, siteId: site.id },
      })
    )
  );
  // eslint-disable-next-line no-console
  console.log(`  ✓ ${tags.length} tags created`);

  // 4. Create JWT secret key
  const secretKey = await prisma.secretKey.upsert({
    where: { kid: `key-${slug}-v1` },
    update: {},
    create: {
      kid: `key-${slug}-v1`,
      secret: generateRandomString(64),
      algorithm: 'HS256',
      isCurrent: true,
      isValid: true,
      activatedAt: new Date(),
    },
  });
  // eslint-disable-next-line no-console
  console.log(`  ✓ Secret key created: ${secretKey.kid}`);

  // 5. Demo data (optional)
  let demoDataCreated = false;
  if (includeDemoData) {
    // Blog post
    const post = await prisma.blogPost.upsert({
      where: { slug_siteId: { slug: 'bienvenue', siteId: site.id } },
      update: {},
      create: {
        slug: 'bienvenue',
        title: `Bienvenue sur ${name}`,
        excerpt: `Découvrez ${name}, votre espace dédié au bien-être.`,
        content: `# Bienvenue sur ${name}\n\nNous sommes ravis de vous accueillir.\n\n## Notre mission\n\nVous accompagner dans votre parcours de bien-être.`,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        readingTime: 1,
        siteId: site.id,
        authorId: admin.id,
      },
    });

    if (tags[0]) {
      await prisma.blogPostTag.createMany({
        data: [{ postId: post.id, tagId: tags[0].id }],
        skipDuplicates: true,
      });
    }

    // Testimonials
    await prisma.testimonial.createMany({
      data: [
        {
          clientName: 'Marie D.',
          clientInitials: 'MD',
          content: 'Un accompagnement remarquable. Je recommande vivement.',
          rating: 5,
          isApproved: true,
          order: 1,
          siteId: site.id,
        },
        {
          clientName: 'Pierre L.',
          clientInitials: 'PL',
          content: 'Très professionnel et bienveillant.',
          rating: 5,
          isApproved: true,
          order: 2,
          siteId: site.id,
        },
      ],
      skipDuplicates: true,
    });

    demoDataCreated = true;
    // eslint-disable-next-line no-console
    console.log('  ✓ Demo data created (1 blog post, 2 testimonials)');
  }

  // eslint-disable-next-line no-console
  console.log(`\n✅ Site "${name}" seeded successfully!\n`);
  // eslint-disable-next-line no-console
  console.log('  Credentials:');
  // eslint-disable-next-line no-console
  console.log(`    Email:    ${adminEmail}`);
  // eslint-disable-next-line no-console
  console.log(`    Password: ${adminPassword}`);
  // eslint-disable-next-line no-console
  console.log('\n  ⚠️  Change the admin password in production!\n');

  return {
    siteId: site.id,
    slug,
    adminEmail,
    adminPassword,
    secretKeyKid: secretKey.kid,
    tagsCreated: tags.length,
    demoDataCreated,
  };
}

/**
 * Parse CLI arguments and run seeding
 */
async function main() {
  const args = process.argv.slice(2);
  let slug = '';
  let name = '';
  let domain = '';
  let adminEmail = '';
  let adminPassword = '';
  let includeDemoData = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];
    if (arg === '--slug' && next) {
      slug = next;
      i++;
    } else if (arg === '--name' && next) {
      name = next;
      i++;
    } else if (arg === '--domain' && next) {
      domain = next;
      i++;
    } else if (arg === '--admin-email' && next) {
      adminEmail = next;
      i++;
    } else if (arg === '--admin-password' && next) {
      adminPassword = next;
      i++;
    } else if (arg === '--demo') {
      includeDemoData = true;
    }
  }

  if (!slug || !name || !domain) {
    console.error(
      'Usage: pnpm tsx packages/db/src/seed-site.ts --slug <slug> --name <name> --domain <domain> [--admin-email <email>] [--admin-password <password>] [--demo]'
    );
    process.exit(1);
  }

  await seedSite({
    slug,
    name,
    domain,
    ...(adminEmail && { adminEmail }),
    ...(adminPassword && { adminPassword }),
    includeDemoData,
  });
}

// Only run main if executed directly (not imported)
if (require.main === module) {
  main()
    .catch(e => {
      console.error('❌ Seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
