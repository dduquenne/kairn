-- Fix: Backfill siteId for BlogFaqClick, BlogCtaClick, BotVisit, and Appointment
-- The migration 20260312181500 set DEFAULT '' instead of backfilling existing rows
-- with the actual psypnos site ID. This corrects those empty-string siteId values.

UPDATE "BlogFaqClick"
SET "siteId" = (SELECT id FROM "Site" WHERE slug = 'psypnos' LIMIT 1)
WHERE "siteId" = '';

UPDATE "BlogCtaClick"
SET "siteId" = (SELECT id FROM "Site" WHERE slug = 'psypnos' LIMIT 1)
WHERE "siteId" = '';

UPDATE "BotVisit"
SET "siteId" = (SELECT id FROM "Site" WHERE slug = 'psypnos' LIMIT 1)
WHERE "siteId" = '';

UPDATE "Appointment"
SET "siteId" = (SELECT id FROM "Site" WHERE slug = 'psypnos' LIMIT 1)
WHERE "siteId" = '';
