/**
 * Database Seed Script
 *
 * Populates the database with initial data for development.
 * Run with: pnpm db:seed
 */

import { PrismaClient, UserRole, PostStatus, ContactStatus } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';

const prisma = new PrismaClient();

/**
 * Hash a password using SHA-256 (for demo purposes)
 * In production, use bcrypt or argon2
 */
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Generate a random string
 */
function generateRandomString(length: number): string {
  return randomBytes(length).toString('hex').slice(0, length);
}

async function main() {
  // eslint-disable-next-line no-console
  console.log('🌱 Starting database seed...\n');

  // ==========================================================================
  // Create default site
  // ==========================================================================
  // eslint-disable-next-line no-console
  console.log('Creating default site...');

  const site = await prisma.site.upsert({
    where: { slug: 'psypnos' },
    update: {},
    create: {
      slug: 'psypnos',
      name: 'PSYPNOS',
      domain: 'psypnos.fr',
      isActive: true,
      config: {
        features: {
          blog: true,
          testimonials: true,
          appointments: true,
          analytics: true,
        },
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log(`  ✓ Site created: ${site.name} (${site.slug})\n`);

  // ==========================================================================
  // Create admin user
  // ==========================================================================
  // eslint-disable-next-line no-console
  console.log('Creating admin user...');

  const adminUser = await prisma.user.upsert({
    where: {
      email_siteId: {
        email: 'admin@psypnos.fr',
        siteId: site.id,
      },
    },
    update: {},
    create: {
      email: 'admin@psypnos.fr',
      passwordHash: hashPassword('admin123'), // Change in production!
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: new Date(),
      siteId: site.id,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`  ✓ Admin user created: ${adminUser.email}\n`);

  // ==========================================================================
  // Create practitioner user
  // ==========================================================================
  // eslint-disable-next-line no-console
  console.log('Creating practitioner user...');

  const practitioner = await prisma.user.upsert({
    where: {
      email_siteId: {
        email: 'praticien@psypnos.fr',
        siteId: site.id,
      },
    },
    update: {},
    create: {
      email: 'praticien@psypnos.fr',
      passwordHash: hashPassword('praticien123'), // Change in production!
      firstName: 'Jean',
      lastName: 'Dupont',
      role: UserRole.PRACTITIONER,
      isActive: true,
      emailVerified: new Date(),
      siteId: site.id,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`  ✓ Practitioner created: ${practitioner.email}\n`);

  // ==========================================================================
  // Create tags
  // ==========================================================================
  // eslint-disable-next-line no-console
  console.log('Creating blog tags...');

  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { slug: 'psychotherapie' },
      update: {},
      create: { name: 'Psychothérapie', slug: 'psychotherapie', color: '#4F46E5' },
    }),
    prisma.tag.upsert({
      where: { slug: 'respiration-holotropique' },
      update: {},
      create: { name: 'Respiration Holotropique', slug: 'respiration-holotropique', color: '#059669' },
    }),
    prisma.tag.upsert({
      where: { slug: 'bien-etre' },
      update: {},
      create: { name: 'Bien-être', slug: 'bien-etre', color: '#D97706' },
    }),
    prisma.tag.upsert({
      where: { slug: 'developpement-personnel' },
      update: {},
      create: { name: 'Développement Personnel', slug: 'developpement-personnel', color: '#7C3AED' },
    }),
  ]);

  // eslint-disable-next-line no-console
  console.log(`  ✓ ${tags.length} tags created\n`);

  // ==========================================================================
  // Create sample blog posts
  // ==========================================================================
  // eslint-disable-next-line no-console
  console.log('Creating sample blog posts...');

  const post1 = await prisma.blogPost.upsert({
    where: {
      slug_siteId: {
        slug: 'bienvenue-sur-le-blog',
        siteId: site.id,
      },
    },
    update: {},
    create: {
      slug: 'bienvenue-sur-le-blog',
      title: 'Bienvenue sur le blog',
      excerpt: 'Découvrez notre nouveau blog dédié à la psychothérapie et au bien-être.',
      content: `# Bienvenue sur le blog

Nous sommes ravis de vous accueillir sur ce nouvel espace dédié à la psychothérapie et au bien-être.

## Notre mission

Partager des connaissances, des réflexions et des outils pour vous accompagner dans votre parcours de développement personnel.

## Ce que vous trouverez ici

- Des articles sur la psychothérapie
- Des conseils pratiques pour le quotidien
- Des réflexions sur le bien-être mental

Bonne lecture !`,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      readingTime: 2,
      siteId: site.id,
      authorId: practitioner.id,
    },
  });

  // Link post to tags
  await prisma.blogPostTag.createMany({
    data: [
      { postId: post1.id, tagId: tags[0]!.id },
      { postId: post1.id, tagId: tags[2]!.id },
    ],
    skipDuplicates: true,
  });

  // eslint-disable-next-line no-console
  console.log(`  ✓ Blog post created: ${post1.title}\n`);

  // ==========================================================================
  // Create sample testimonials
  // ==========================================================================
  // eslint-disable-next-line no-console
  console.log('Creating sample testimonials...');

  await prisma.testimonial.createMany({
    data: [
      {
        clientName: 'Marie D.',
        clientInitials: 'MD',
        content:
          "L'accompagnement a été transformateur. Je recommande vivement pour toute personne en quête de mieux-être.",
        rating: 5,
        isApproved: true,
        order: 1,
        siteId: site.id,
      },
      {
        clientName: 'Pierre L.',
        clientInitials: 'PL',
        content:
          'Une approche bienveillante et professionnelle. Les séances de respiration holotropique ont été révélatrices.',
        rating: 5,
        isApproved: true,
        order: 2,
        siteId: site.id,
      },
      {
        clientName: 'Sophie M.',
        clientInitials: 'SM',
        content:
          "Merci pour ces séances qui m'ont permis de mieux me comprendre et d'avancer dans ma vie.",
        rating: 4,
        isApproved: true,
        order: 3,
        siteId: site.id,
      },
    ],
    skipDuplicates: true,
  });

  // eslint-disable-next-line no-console
  console.log('  ✓ 3 testimonials created\n');

  // ==========================================================================
  // Create sample contact
  // ==========================================================================
  // eslint-disable-next-line no-console
  console.log('Creating sample contact...');

  await prisma.contact.create({
    data: {
      name: 'Jean Test',
      email: 'jean.test@example.com',
      phone: '0612345678',
      subject: 'Demande de rendez-vous',
      message: 'Bonjour, je souhaiterais prendre rendez-vous pour une première consultation.',
      status: ContactStatus.NEW,
      source: '/contact',
      siteId: site.id,
    },
  });

  // eslint-disable-next-line no-console
  console.log('  ✓ Sample contact created\n');

  // ==========================================================================
  // Create initial secret key for JWT
  // ==========================================================================
  // eslint-disable-next-line no-console
  console.log('Creating initial JWT secret key...');

  const secretKey = await prisma.secretKey.upsert({
    where: { kid: 'key-v1' },
    update: {},
    create: {
      kid: 'key-v1',
      secret: generateRandomString(64),
      algorithm: 'HS256',
      isCurrent: true,
      isValid: true,
      activatedAt: new Date(),
    },
  });

  // eslint-disable-next-line no-console
  console.log(`  ✓ Secret key created: ${secretKey.kid}\n`);

  // ==========================================================================
  // Summary
  // ==========================================================================
  // eslint-disable-next-line no-console
  console.log('✅ Database seeded successfully!\n');
  // eslint-disable-next-line no-console
  console.log('Summary:');
  // eslint-disable-next-line no-console
  console.log('  - 1 site');
  // eslint-disable-next-line no-console
  console.log('  - 2 users (admin + practitioner)');
  // eslint-disable-next-line no-console
  console.log(`  - ${tags.length} tags`);
  // eslint-disable-next-line no-console
  console.log('  - 1 blog post');
  // eslint-disable-next-line no-console
  console.log('  - 3 testimonials');
  // eslint-disable-next-line no-console
  console.log('  - 1 contact');
  // eslint-disable-next-line no-console
  console.log('  - 1 JWT secret key');
  // eslint-disable-next-line no-console
  console.log('\n⚠️  Remember to change default passwords in production!');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
