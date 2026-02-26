-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'PRACTITIONER', 'USER');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'READ', 'REPLIED', 'ARCHIVED', 'SPAM');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PAGE_VIEW', 'PAGE_EXIT', 'SCROLL_DEPTH', 'SECTION_VIEW', 'SECTION_TIME', 'CONVERSION', 'FUNNEL_STEP', 'CLICK', 'FORM_SUBMIT', 'DOWNLOAD', 'CUSTOM', 'SESSION_START', 'SESSION_END');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('DESTINATION', 'EVENT', 'DURATION', 'PAGES_PER_SESSION');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('THRESHOLD', 'ANOMALY', 'TREND');

-- CreateEnum
CREATE TYPE "AlertCondition" AS ENUM ('GREATER_THAN', 'LESS_THAN', 'EQUALS', 'CHANGE_PERCENT');

-- CreateEnum
CREATE TYPE "AlertTimeWindow" AS ENUM ('HOUR', 'DAY', 'WEEK', 'MONTH');

-- CreateEnum
CREATE TYPE "ReportFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "BlogJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN', 'THREADS');

-- CreateEnum
CREATE TYPE "SocialPostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "siteId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretKey" (
    "id" TEXT NOT NULL,
    "kid" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'HS256',
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecretKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "readingTime" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "category" TEXT,
    "imagePrompt" TEXT,
    "seoIntent" TEXT,
    "persona" TEXT,
    "tones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "faq" JSONB,
    "jsonLd" JSONB,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "authorName" TEXT,
    "siteId" TEXT NOT NULL,
    "authorId" TEXT,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostTag" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "BlogPostTag_pkey" PRIMARY KEY ("postId","tagId")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientInitials" TEXT,
    "content" TEXT NOT NULL,
    "rating" INTEGER,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "siteId" TEXT NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" "ContactStatus" NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "siteId" TEXT NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "path" TEXT NOT NULL,
    "name" TEXT,
    "data" JSONB,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "siteId" TEXT NOT NULL,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsDailySummary" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "bounceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgTimeOnSite" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "topPages" JSONB,
    "topSources" JSONB,
    "deviceBreakdown" JSONB,
    "conversions" JSONB,
    "siteId" TEXT NOT NULL,

    CONSTRAINT "AnalyticsDailySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorGeolocation" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "region" TEXT,
    "regionCode" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timezone" TEXT,
    "ipAddress" TEXT,
    "siteId" TEXT NOT NULL,

    CONSTRAINT "VisitorGeolocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsGoal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "GoalType" NOT NULL,
    "destinationUrl" TEXT,
    "eventCategory" TEXT,
    "eventAction" TEXT,
    "eventLabel" TEXT,
    "durationSeconds" INTEGER,
    "comparison" TEXT,
    "pagesCount" INTEGER,
    "value" DOUBLE PRECISION,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "siteId" TEXT,

    CONSTRAINT "AnalyticsGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsGoalCompletion" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "value" DOUBLE PRECISION,

    CONSTRAINT "AnalyticsGoalCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsAlert" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "AlertType" NOT NULL,
    "metric" TEXT NOT NULL,
    "condition" "AlertCondition" NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "timeWindow" "AlertTimeWindow" NOT NULL,
    "channels" JSONB NOT NULL,
    "emailRecipients" TEXT[],
    "webhookUrl" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggered" TIMESTAMP(3),
    "lastValue" DOUBLE PRECISION,
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "siteId" TEXT,

    CONSTRAINT "AnalyticsAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsAlertHistory" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "alertName" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metric" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "actualValue" DOUBLE PRECISION NOT NULL,
    "message" TEXT NOT NULL,
    "notificationsSent" JSONB NOT NULL,

    CONSTRAINT "AnalyticsAlertHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsAnomaly" (
    "id" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metric" TEXT NOT NULL,
    "expectedValue" DOUBLE PRECISION NOT NULL,
    "actualValue" DOUBLE PRECISION NOT NULL,
    "deviation" DOUBLE PRECISION NOT NULL,
    "severity" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "siteId" TEXT,

    CONSTRAINT "AnalyticsAnomaly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsDashboardConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "widgets" JSONB NOT NULL,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "siteId" TEXT,

    CONSTRAINT "AnalyticsDashboardConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsScheduledReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" "ReportFrequency" NOT NULL,
    "recipients" TEXT[],
    "metrics" JSONB NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'pdf',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" TIMESTAMP(3),
    "nextSendAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "siteId" TEXT,

    CONSTRAINT "AnalyticsScheduledReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seminar" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "speakers" JSONB NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "price" DECIMAL(10,2),
    "deposit" DECIMAL(10,2),
    "displayOrder" TEXT,
    "tags" TEXT[],
    "thumbnail" TEXT,
    "seminarType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "siteId" TEXT NOT NULL,

    CONSTRAINT "Seminar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "serviceType" TEXT,
    "notes" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "confirmToken" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostExtended" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "image" TEXT,
    "imagePrompt" TEXT,
    "seoIntent" TEXT,
    "persona" TEXT,
    "tones" TEXT[],
    "faq" JSONB,
    "jsonLd" JSONB,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPostExtended_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogAnalytics" (
    "id" TEXT NOT NULL,
    "articleSlug" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scrollDepthPercent" INTEGER,
    "timeOnPage" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BlogAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogFaqClick" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "articleSlug" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "faqIndex" INTEGER NOT NULL,
    "question" TEXT,

    CONSTRAINT "BlogFaqClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogCtaClick" (
    "id" TEXT NOT NULL,
    "articleSlug" TEXT NOT NULL,
    "ctaType" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogCtaClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogGenerationJob" (
    "id" TEXT NOT NULL,
    "status" "BlogJobStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "totalSteps" INTEGER NOT NULL DEFAULT 9,
    "input" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "articleSlug" TEXT,

    CONSTRAINT "BlogGenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotVisit" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "botName" TEXT NOT NULL,
    "botType" TEXT NOT NULL,
    "userAgent" TEXT,
    "page" TEXT NOT NULL,
    "referrer" TEXT,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "statusCode" INTEGER,
    "country" TEXT,
    "countryCode" TEXT,
    "city" TEXT,
    "ipHash" TEXT,

    CONSTRAINT "BotVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "profileImage" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "scope" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "content" TEXT NOT NULL,
    "blogTitle" TEXT,
    "blogSlug" TEXT,
    "mediaUrls" JSONB,
    "hashtags" JSONB,
    "linkUrl" TEXT,
    "status" "SocialPostStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "externalPostId" TEXT,
    "platformUrl" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "generatedBy" TEXT,
    "aiPrompt" TEXT,
    "aiModel" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPostAnalytics" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "engagements" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "rawData" JSONB,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPostAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccountSnapshot" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "postsCount" INTEGER NOT NULL DEFAULT 0,
    "rawMetrics" JSONB,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialAccountSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "description" TEXT,
    "promptTemplate" TEXT NOT NULL,
    "defaultTone" TEXT,
    "defaultHashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialGenerationLog" (
    "id" TEXT NOT NULL,
    "blogSlug" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "inputContent" TEXT NOT NULL,
    "promptUsed" TEXT NOT NULL,
    "generatedContent" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "wasAccepted" BOOLEAN NOT NULL DEFAULT false,
    "wasModified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialGenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "targetRef" TEXT,
    "targetCommit" TEXT,
    "previousCommit" TEXT,
    "triggeredBy" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "currentPhase" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "healthCheckPassed" BOOLEAN,
    "rolledBackAt" TIMESTAMP(3),
    "rollbackReason" TEXT,
    "deployToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "logs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceMode" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "message" TEXT,
    "activatedBy" TEXT,
    "activatedAt" TIMESTAMP(3),
    "estimatedEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "topics" TEXT[] DEFAULT ARRAY['all']::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastPushAt" TIMESTAMP(3),
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushNotificationLog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "type" TEXT NOT NULL,
    "topic" TEXT NOT NULL DEFAULT 'all',
    "targetCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "triggeredBy" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatConversation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ipHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "satisfied" BOOLEAN,
    "referrer" TEXT,
    "deviceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "siteId" TEXT NOT NULL,

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "processingTime" INTEGER,
    "suggestedActions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "trafficPercent" INTEGER NOT NULL DEFAULT 100,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "winningVariant" TEXT,
    "significanceReached" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentVariant" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "config" JSONB NOT NULL,
    "isControl" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentAssignment" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ipHash" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentResult" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationHistory" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "pagesVisited" JSONB NOT NULL,
    "timePerPage" JSONB,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "suggestedService" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Site_slug_key" ON "Site"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Site_domain_key" ON "Site"("domain");

-- CreateIndex
CREATE INDEX "Site_slug_idx" ON "Site"("slug");

-- CreateIndex
CREATE INDEX "Site_domain_idx" ON "Site"("domain");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_siteId_idx" ON "User"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_siteId_key" ON "User"("email", "siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_family_idx" ON "RefreshToken"("family");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SecretKey_kid_key" ON "SecretKey"("kid");

-- CreateIndex
CREATE INDEX "SecretKey_isCurrent_idx" ON "SecretKey"("isCurrent");

-- CreateIndex
CREATE INDEX "SecretKey_isValid_idx" ON "SecretKey"("isValid");

-- CreateIndex
CREATE INDEX "BlogPost_siteId_status_idx" ON "BlogPost"("siteId", "status");

-- CreateIndex
CREATE INDEX "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");

-- CreateIndex
CREATE INDEX "BlogPost_siteId_featured_idx" ON "BlogPost"("siteId", "featured");

-- CreateIndex
CREATE INDEX "BlogPost_category_idx" ON "BlogPost"("category");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_siteId_key" ON "BlogPost"("slug", "siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Testimonial_siteId_isApproved_idx" ON "Testimonial"("siteId", "isApproved");

-- CreateIndex
CREATE INDEX "Contact_siteId_status_idx" ON "Contact"("siteId", "status");

-- CreateIndex
CREATE INDEX "Contact_createdAt_idx" ON "Contact"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_siteId_type_createdAt_idx" ON "AnalyticsEvent"("siteId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_siteId_sessionId_idx" ON "AnalyticsEvent"("siteId", "sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_siteId_name_createdAt_idx" ON "AnalyticsEvent"("siteId", "name", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_siteId_path_createdAt_idx" ON "AnalyticsEvent"("siteId", "path", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_siteId_createdAt_idx" ON "AnalyticsEvent"("siteId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsDailySummary_siteId_date_idx" ON "AnalyticsDailySummary"("siteId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsDailySummary_siteId_date_key" ON "AnalyticsDailySummary"("siteId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorGeolocation_sessionId_key" ON "VisitorGeolocation"("sessionId");

-- CreateIndex
CREATE INDEX "VisitorGeolocation_timestamp_idx" ON "VisitorGeolocation"("timestamp");

-- CreateIndex
CREATE INDEX "VisitorGeolocation_siteId_timestamp_idx" ON "VisitorGeolocation"("siteId", "timestamp");

-- CreateIndex
CREATE INDEX "VisitorGeolocation_country_idx" ON "VisitorGeolocation"("country");

-- CreateIndex
CREATE INDEX "AnalyticsGoal_siteId_enabled_idx" ON "AnalyticsGoal"("siteId", "enabled");

-- CreateIndex
CREATE INDEX "AnalyticsGoalCompletion_timestamp_idx" ON "AnalyticsGoalCompletion"("timestamp");

-- CreateIndex
CREATE INDEX "AnalyticsGoalCompletion_goalId_idx" ON "AnalyticsGoalCompletion"("goalId");

-- CreateIndex
CREATE INDEX "AnalyticsGoalCompletion_sessionId_idx" ON "AnalyticsGoalCompletion"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsAlert_siteId_enabled_idx" ON "AnalyticsAlert"("siteId", "enabled");

-- CreateIndex
CREATE INDEX "AnalyticsAlertHistory_alertId_idx" ON "AnalyticsAlertHistory"("alertId");

-- CreateIndex
CREATE INDEX "AnalyticsAlertHistory_triggeredAt_idx" ON "AnalyticsAlertHistory"("triggeredAt");

-- CreateIndex
CREATE INDEX "AnalyticsAnomaly_siteId_detectedAt_idx" ON "AnalyticsAnomaly"("siteId", "detectedAt");

-- CreateIndex
CREATE INDEX "AnalyticsAnomaly_acknowledged_idx" ON "AnalyticsAnomaly"("acknowledged");

-- CreateIndex
CREATE INDEX "AnalyticsDashboardConfig_userId_idx" ON "AnalyticsDashboardConfig"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsDashboardConfig_siteId_userId_idx" ON "AnalyticsDashboardConfig"("siteId", "userId");

-- CreateIndex
CREATE INDEX "AnalyticsScheduledReport_siteId_enabled_idx" ON "AnalyticsScheduledReport"("siteId", "enabled");

-- CreateIndex
CREATE INDEX "AnalyticsScheduledReport_nextSendAt_idx" ON "AnalyticsScheduledReport"("nextSendAt");

-- CreateIndex
CREATE INDEX "Seminar_siteId_idx" ON "Seminar"("siteId");

-- CreateIndex
CREATE INDEX "Seminar_startAt_idx" ON "Seminar"("startAt");

-- CreateIndex
CREATE INDEX "Seminar_siteId_startAt_idx" ON "Seminar"("siteId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_confirmToken_key" ON "Appointment"("confirmToken");

-- CreateIndex
CREATE INDEX "Appointment_clientEmail_idx" ON "Appointment"("clientEmail");

-- CreateIndex
CREATE INDEX "Appointment_startTime_idx" ON "Appointment"("startTime");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostExtended_slug_key" ON "BlogPostExtended"("slug");

-- CreateIndex
CREATE INDEX "BlogPostExtended_published_date_idx" ON "BlogPostExtended"("published", "date");

-- CreateIndex
CREATE INDEX "BlogPostExtended_category_idx" ON "BlogPostExtended"("category");

-- CreateIndex
CREATE INDEX "BlogPostExtended_featured_idx" ON "BlogPostExtended"("featured");

-- CreateIndex
CREATE INDEX "BlogAnalytics_articleSlug_idx" ON "BlogAnalytics"("articleSlug");

-- CreateIndex
CREATE INDEX "BlogAnalytics_timestamp_idx" ON "BlogAnalytics"("timestamp");

-- CreateIndex
CREATE INDEX "BlogAnalytics_sessionId_idx" ON "BlogAnalytics"("sessionId");

-- CreateIndex
CREATE INDEX "BlogFaqClick_articleSlug_idx" ON "BlogFaqClick"("articleSlug");

-- CreateIndex
CREATE INDEX "BlogFaqClick_timestamp_idx" ON "BlogFaqClick"("timestamp");

-- CreateIndex
CREATE INDEX "BlogCtaClick_articleSlug_idx" ON "BlogCtaClick"("articleSlug");

-- CreateIndex
CREATE INDEX "BlogCtaClick_ctaType_idx" ON "BlogCtaClick"("ctaType");

-- CreateIndex
CREATE INDEX "BlogCtaClick_timestamp_idx" ON "BlogCtaClick"("timestamp");

-- CreateIndex
CREATE INDEX "BlogGenerationJob_status_idx" ON "BlogGenerationJob"("status");

-- CreateIndex
CREATE INDEX "BlogGenerationJob_createdAt_idx" ON "BlogGenerationJob"("createdAt");

-- CreateIndex
CREATE INDEX "BotVisit_timestamp_idx" ON "BotVisit"("timestamp");

-- CreateIndex
CREATE INDEX "BotVisit_botName_idx" ON "BotVisit"("botName");

-- CreateIndex
CREATE INDEX "BotVisit_botType_idx" ON "BotVisit"("botType");

-- CreateIndex
CREATE INDEX "BotVisit_page_idx" ON "BotVisit"("page");

-- CreateIndex
CREATE INDEX "SocialAccount_platform_idx" ON "SocialAccount"("platform");

-- CreateIndex
CREATE INDEX "SocialAccount_isActive_idx" ON "SocialAccount"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_platform_accountId_key" ON "SocialAccount"("platform", "accountId");

-- CreateIndex
CREATE INDEX "SocialPost_platform_status_idx" ON "SocialPost"("platform", "status");

-- CreateIndex
CREATE INDEX "SocialPost_scheduledAt_idx" ON "SocialPost"("scheduledAt");

-- CreateIndex
CREATE INDEX "SocialPost_publishedAt_idx" ON "SocialPost"("publishedAt");

-- CreateIndex
CREATE INDEX "SocialPost_accountId_idx" ON "SocialPost"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPostAnalytics_postId_key" ON "SocialPostAnalytics"("postId");

-- CreateIndex
CREATE INDEX "SocialPostAnalytics_lastSyncAt_idx" ON "SocialPostAnalytics"("lastSyncAt");

-- CreateIndex
CREATE INDEX "SocialAccountSnapshot_platform_snapshotDate_idx" ON "SocialAccountSnapshot"("platform", "snapshotDate");

-- CreateIndex
CREATE INDEX "SocialAccountSnapshot_accountId_snapshotDate_idx" ON "SocialAccountSnapshot"("accountId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccountSnapshot_accountId_snapshotDate_key" ON "SocialAccountSnapshot"("accountId", "snapshotDate");

-- CreateIndex
CREATE INDEX "SocialTemplate_platform_idx" ON "SocialTemplate"("platform");

-- CreateIndex
CREATE INDEX "SocialGenerationLog_blogSlug_idx" ON "SocialGenerationLog"("blogSlug");

-- CreateIndex
CREATE INDEX "SocialGenerationLog_createdAt_idx" ON "SocialGenerationLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Deployment_deployToken_key" ON "Deployment"("deployToken");

-- CreateIndex
CREATE INDEX "Deployment_status_idx" ON "Deployment"("status");

-- CreateIndex
CREATE INDEX "Deployment_triggeredAt_idx" ON "Deployment"("triggeredAt");

-- CreateIndex
CREATE INDEX "Deployment_targetRef_idx" ON "Deployment"("targetRef");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_isActive_idx" ON "PushSubscription"("isActive");

-- CreateIndex
CREATE INDEX "PushSubscription_topics_idx" ON "PushSubscription"("topics");

-- CreateIndex
CREATE INDEX "PushSubscription_sessionId_idx" ON "PushSubscription"("sessionId");

-- CreateIndex
CREATE INDEX "PushNotificationLog_type_idx" ON "PushNotificationLog"("type");

-- CreateIndex
CREATE INDEX "PushNotificationLog_sentAt_idx" ON "PushNotificationLog"("sentAt");

-- CreateIndex
CREATE INDEX "ChatConversation_siteId_idx" ON "ChatConversation"("siteId");

-- CreateIndex
CREATE INDEX "ChatConversation_sessionId_idx" ON "ChatConversation"("sessionId");

-- CreateIndex
CREATE INDEX "ChatConversation_createdAt_idx" ON "ChatConversation"("createdAt");

-- CreateIndex
CREATE INDEX "ChatConversation_status_idx" ON "ChatConversation"("status");

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_idx" ON "ChatMessage"("conversationId");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Experiment_name_key" ON "Experiment"("name");

-- CreateIndex
CREATE INDEX "Experiment_status_idx" ON "Experiment"("status");

-- CreateIndex
CREATE INDEX "Experiment_name_idx" ON "Experiment"("name");

-- CreateIndex
CREATE INDEX "ExperimentVariant_experimentId_idx" ON "ExperimentVariant"("experimentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperimentVariant_experimentId_name_key" ON "ExperimentVariant"("experimentId", "name");

-- CreateIndex
CREATE INDEX "ExperimentAssignment_experimentId_idx" ON "ExperimentAssignment"("experimentId");

-- CreateIndex
CREATE INDEX "ExperimentAssignment_variantId_idx" ON "ExperimentAssignment"("variantId");

-- CreateIndex
CREATE INDEX "ExperimentAssignment_sessionId_idx" ON "ExperimentAssignment"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperimentAssignment_experimentId_sessionId_key" ON "ExperimentAssignment"("experimentId", "sessionId");

-- CreateIndex
CREATE INDEX "ExperimentResult_variantId_idx" ON "ExperimentResult"("variantId");

-- CreateIndex
CREATE INDEX "ExperimentResult_metric_idx" ON "ExperimentResult"("metric");

-- CreateIndex
CREATE INDEX "ExperimentResult_recordedAt_idx" ON "ExperimentResult"("recordedAt");

-- CreateIndex
CREATE INDEX "NavigationHistory_sessionId_idx" ON "NavigationHistory"("sessionId");

-- CreateIndex
CREATE INDEX "NavigationHistory_suggestedService_idx" ON "NavigationHistory"("suggestedService");

-- CreateIndex
CREATE UNIQUE INDEX "NavigationHistory_sessionId_key" ON "NavigationHistory"("sessionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostTag" ADD CONSTRAINT "BlogPostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostTag" ADD CONSTRAINT "BlogPostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsDailySummary" ADD CONSTRAINT "AnalyticsDailySummary_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorGeolocation" ADD CONSTRAINT "VisitorGeolocation_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsGoal" ADD CONSTRAINT "AnalyticsGoal_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsGoalCompletion" ADD CONSTRAINT "AnalyticsGoalCompletion_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "AnalyticsGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsAlert" ADD CONSTRAINT "AnalyticsAlert_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsAlertHistory" ADD CONSTRAINT "AnalyticsAlertHistory_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "AnalyticsAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsAnomaly" ADD CONSTRAINT "AnalyticsAnomaly_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsDashboardConfig" ADD CONSTRAINT "AnalyticsDashboardConfig_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsScheduledReport" ADD CONSTRAINT "AnalyticsScheduledReport_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seminar" ADD CONSTRAINT "Seminar_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPostAnalytics" ADD CONSTRAINT "SocialPostAnalytics_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccountSnapshot" ADD CONSTRAINT "SocialAccountSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentVariant" ADD CONSTRAINT "ExperimentVariant_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentAssignment" ADD CONSTRAINT "ExperimentAssignment_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentAssignment" ADD CONSTRAINT "ExperimentAssignment_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ExperimentVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentResult" ADD CONSTRAINT "ExperimentResult_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ExperimentVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

