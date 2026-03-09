/**
 * Migration script: Import seminars from JSON file to PostgreSQL database
 *
 * Run with: npx tsx scripts/migrate-seminars-to-db.ts
 */

import { promises as fs } from "fs";
import path from "path";

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const SITE_SLUG = "avv";
const DATA_FILE_PATH = path.join(process.cwd(), "data", "seminars.json");

interface SeminarData {
  id: string;
  title: string;
  description: string;
  speakers: Array<{ firstName: string; lastName: string }>;
  startAt: string;
  endAt: string;
  capacity: number;
  price?: number;
  deposit?: number;
  order?: string;
  tags: string[];
  thumbnail?: string;
  seminarType?: string;
  createdAt: string;
  updatedAt: string;
}

interface SeminarsFile {
  seminars: SeminarData[];
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
        name: "Appréciez Votre Vie",
        domain: "appreciezvotrevie.fr",
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
  console.log("Starting migration of seminars from JSON to database...\n");

  try {
    // Read JSON file
    const content = await fs.readFile(DATA_FILE_PATH, "utf-8");
    const data: SeminarsFile = JSON.parse(content);

    console.log(`Found ${data.seminars.length} seminars in JSON file.\n`);

    // Get or create site
    const siteId = await getSiteId();

    // Check existing seminars in database
    const existingSeminars = await prisma.seminar.findMany({
      where: { siteId },
      select: { id: true, title: true },
    });

    console.log(`Found ${existingSeminars.length} existing seminars in database.\n`);

    const existingIds = new Set(existingSeminars.map((s) => s.id));

    // Import each seminar
    let created = 0;
    let skipped = 0;

    for (const seminar of data.seminars) {
      if (existingIds.has(seminar.id)) {
        console.log(`⏭️  Skipping "${seminar.title}" (already exists)`);
        skipped++;
        continue;
      }

      try {
        await prisma.seminar.create({
          data: {
            id: seminar.id,
            siteId,
            title: seminar.title,
            description: seminar.description,
            speakers: seminar.speakers as Prisma.InputJsonValue,
            startAt: new Date(seminar.startAt),
            endAt: new Date(seminar.endAt),
            capacity: seminar.capacity,
            price: seminar.price ? new Prisma.Decimal(seminar.price) : null,
            deposit: seminar.deposit ? new Prisma.Decimal(seminar.deposit) : null,
            displayOrder: seminar.order || null,
            tags: seminar.tags,
            thumbnail: seminar.thumbnail || null,
            seminarType: seminar.seminarType || null,
            createdAt: new Date(seminar.createdAt),
            updatedAt: new Date(seminar.updatedAt),
          },
        });

        console.log(`✅ Created "${seminar.title}"`);
        created++;
      } catch (error) {
        console.error(`❌ Failed to create "${seminar.title}":`, error);
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
