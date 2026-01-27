/**
 * Migration script: Import testimonials from JSON file to PostgreSQL database
 *
 * Run with: npx tsx scripts/migrate-testimonials-to-db.ts
 */

import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

const prisma = new PrismaClient();

const SITE_SLUG = "psypnos";
const DATA_FILE_PATH = path.join(process.cwd(), "data", "testimonials.json");

interface TestimonialData {
  id: string;
  quote: string;
  author: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

interface TestimonialsFile {
  testimonials: TestimonialData[];
}

async function getSiteId(): Promise<string> {
  let site = await prisma.site.findUnique({
    where: { slug: SITE_SLUG },
    select: { id: true },
  });

  if (!site) {
    console.log(`Creating site "${SITE_SLUG}"...`);
    site = await prisma.site.create({
      data: {
        slug: SITE_SLUG,
        name: "Psypnos",
        domain: "psypnos.fr",
        isActive: true,
      },
      select: { id: true },
    });
    console.log(`Site created with ID: ${site.id}`);
  } else {
    console.log(`Site "${SITE_SLUG}" found with ID: ${site.id}`);
  }

  return site.id;
}

async function migrate() {
  console.log("Starting migration of testimonials from JSON to database...\n");

  try {
    // Read JSON file
    const content = await fs.readFile(DATA_FILE_PATH, "utf-8");
    const data: TestimonialsFile = JSON.parse(content);

    console.log(`Found ${data.testimonials.length} testimonials in JSON file.\n`);

    // Get or create site
    const siteId = await getSiteId();

    // Check existing testimonials in database
    const existingTestimonials = await prisma.testimonial.findMany({
      where: { siteId },
      select: { id: true, clientName: true },
    });

    console.log(`Found ${existingTestimonials.length} existing testimonials in database.\n`);

    const existingIds = new Set(existingTestimonials.map((t) => t.id));

    // Import each testimonial
    let created = 0;
    let skipped = 0;

    for (let i = 0; i < data.testimonials.length; i++) {
      const testimonial = data.testimonials[i];
      if (!testimonial) continue;

      if (existingIds.has(testimonial.id)) {
        console.log(`⏭️  Skipping "${testimonial.author}" (already exists)`);
        skipped++;
        continue;
      }

      try {
        await prisma.testimonial.create({
          data: {
            id: testimonial.id,
            siteId,
            clientName: testimonial.author,
            content: testimonial.quote,
            clientInitials: testimonial.role || null,
            isApproved: true,
            order: i,  // Use index as display order
            createdAt: new Date(testimonial.createdAt),
            updatedAt: new Date(testimonial.updatedAt),
          },
        });

        console.log(`✅ Created testimonial from "${testimonial.author}"`);
        created++;
      } catch (error) {
        console.error(`❌ Failed to create testimonial from "${testimonial.author}":`, error);
      }
    }

    console.log("\n========================================");
    console.log("Migration completed!");
    console.log(`  Created: ${created}`);
    console.log(`  Skipped: ${skipped}`);
    console.log("========================================\n");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
