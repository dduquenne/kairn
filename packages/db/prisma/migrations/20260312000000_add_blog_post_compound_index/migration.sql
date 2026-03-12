-- CreateIndex
CREATE INDEX IF NOT EXISTS "BlogPost_siteId_status_publishedAt_idx" ON "BlogPost"("siteId", "status", "publishedAt");
