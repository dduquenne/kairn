-- Migration: Add siteId column to 7 tables that are missing it
-- Root cause: Prisma schema was updated in commit 95d1269 but migration was never applied
-- This fixes the blog display issues (500 errors on /api/blog/posts, empty /blog page, empty homepage blog section)

-- ============================================
-- 1. Tag table
-- ============================================
ALTER TABLE "Tag" ADD COLUMN "siteId" TEXT;
UPDATE "Tag" SET "siteId" = (SELECT id FROM "Site" WHERE slug = 'psypnos' LIMIT 1);
ALTER TABLE "Tag" ALTER COLUMN "siteId" SET NOT NULL;
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "Tag_slug_key";

CREATE UNIQUE INDEX "Tag_slug_siteId_key" ON "Tag"("slug", "siteId");
CREATE INDEX "Tag_siteId_idx" ON "Tag"("siteId");

-- ============================================
-- 2. BlogAnalytics table
-- ============================================
ALTER TABLE "BlogAnalytics" ADD COLUMN "siteId" TEXT;
UPDATE "BlogAnalytics" SET "siteId" = (SELECT id FROM "Site" WHERE slug = 'psypnos' LIMIT 1);
ALTER TABLE "BlogAnalytics" ALTER COLUMN "siteId" SET NOT NULL;
ALTER TABLE "BlogAnalytics" ADD CONSTRAINT "BlogAnalytics_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "BlogAnalytics_siteId_articleSlug_idx" ON "BlogAnalytics"("siteId", "articleSlug");

-- ============================================
-- 3. BlogFaqClick table
-- ============================================
ALTER TABLE "BlogFaqClick" ADD COLUMN "siteId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BlogFaqClick" ALTER COLUMN "siteId" DROP DEFAULT;
ALTER TABLE "BlogFaqClick" ADD CONSTRAINT "BlogFaqClick_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "BlogFaqClick_siteId_articleSlug_idx" ON "BlogFaqClick"("siteId", "articleSlug");

-- ============================================
-- 4. BlogCtaClick table
-- ============================================
ALTER TABLE "BlogCtaClick" ADD COLUMN "siteId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BlogCtaClick" ALTER COLUMN "siteId" DROP DEFAULT;
ALTER TABLE "BlogCtaClick" ADD CONSTRAINT "BlogCtaClick_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "BlogCtaClick_siteId_articleSlug_idx" ON "BlogCtaClick"("siteId", "articleSlug");

-- ============================================
-- 5. BotVisit table
-- ============================================
ALTER TABLE "BotVisit" ADD COLUMN "siteId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BotVisit" ALTER COLUMN "siteId" DROP DEFAULT;
ALTER TABLE "BotVisit" ADD CONSTRAINT "BotVisit_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "BotVisit_siteId_idx" ON "BotVisit"("siteId");

-- ============================================
-- 6. BlogGenerationJob table
-- ============================================
ALTER TABLE "BlogGenerationJob" ADD COLUMN "siteId" TEXT;
UPDATE "BlogGenerationJob" SET "siteId" = (SELECT id FROM "Site" WHERE slug = 'psypnos' LIMIT 1);
ALTER TABLE "BlogGenerationJob" ALTER COLUMN "siteId" SET NOT NULL;
ALTER TABLE "BlogGenerationJob" ADD CONSTRAINT "BlogGenerationJob_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "BlogGenerationJob_siteId_status_idx" ON "BlogGenerationJob"("siteId", "status");

-- ============================================
-- 7. Appointment table
-- ============================================
ALTER TABLE "Appointment" ADD COLUMN "siteId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Appointment" ALTER COLUMN "siteId" DROP DEFAULT;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Appointment_siteId_startTime_idx" ON "Appointment"("siteId", "startTime");
