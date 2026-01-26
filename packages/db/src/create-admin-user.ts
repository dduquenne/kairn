// @ts-nocheck
/* eslint-disable */
/**
 * Script to create an admin user for Psypnos
 * Run with: pnpm tsx src/create-admin-user.ts
 */

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
  const email = 'david@psypnos.fr';
  const password = 'test';
  const siteSlug = 'psypnos';

  console.log('🔐 Creating admin user...\n');

  // Find the psypnos site
  const site = await prisma.site.findUnique({
    where: { slug: siteSlug },
  });

  if (!site) {
    console.error(`❌ Site '${siteSlug}' not found. Please run db:seed first.`);
    process.exit(1);
  }

  console.log(`✓ Found site: ${site.name} (${site.slug})`);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: {
      email_siteId: {
        email,
        siteId: site.id,
      },
    },
  });

  if (existingUser) {
    console.log(`⚠️  User '${email}' already exists. Updating password...`);

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    console.log(`✓ Password updated for ${email}`);
  } else {
    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'David',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        isActive: true,
        emailVerified: new Date(),
        siteId: site.id,
      },
    });

    console.log(`✓ Admin user created: ${user.email}`);
  }

  console.log('\n✅ Done! You can now login with:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
