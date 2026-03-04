-- =============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- =============================================================================
-- Fixes Supabase alerts: rls_disabled_in_public + sensitive_columns_exposed
-- See: https://github.com/dduquenne/kairn/issues/252
--
-- Context:
--   Supabase exposes all tables in the `public` schema via PostgREST API.
--   Without RLS, anyone with the anon key can read/write all data.
--
-- Strategy:
--   - Enable RLS on every table (deny-all by default for non-owner roles)
--   - No permissive policies created (the app uses Prisma via DATABASE_URL,
--     which connects as the table owner and bypasses RLS automatically)
--   - PostgREST roles (anon, authenticated) are effectively blocked
--
-- Rollback:
--   Replace ENABLE with DISABLE in each statement below.
-- =============================================================================

-- Multi-tenancy
ALTER TABLE "Site" ENABLE ROW LEVEL SECURITY;

-- Authentication & Sessions
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RefreshToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SecretKey" ENABLE ROW LEVEL SECURITY;

-- Blog
ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogPostTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogPostExtended" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogAnalytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogFaqClick" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogCtaClick" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogGenerationJob" ENABLE ROW LEVEL SECURITY;

-- Testimonials & Contact
ALTER TABLE "Testimonial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contact" ENABLE ROW LEVEL SECURITY;

-- Analytics
ALTER TABLE "AnalyticsEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsDailySummary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VisitorGeolocation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsGoal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsGoalCompletion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsAlert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsAlertHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsAnomaly" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsDashboardConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsScheduledReport" ENABLE ROW LEVEL SECURITY;

-- Seminars & Appointments
ALTER TABLE "Seminar" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;

-- Social
ALTER TABLE "SocialAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialPostAnalytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialAccountSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialGenerationLog" ENABLE ROW LEVEL SECURITY;

-- Visitors & Bots
ALTER TABLE "BotVisit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NavigationHistory" ENABLE ROW LEVEL SECURITY;

-- Experiments (A/B Testing)
ALTER TABLE "Experiment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExperimentVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExperimentAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExperimentResult" ENABLE ROW LEVEL SECURITY;

-- Chat
ALTER TABLE "ChatConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;

-- Infrastructure
ALTER TABLE "Deployment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MaintenanceMode" ENABLE ROW LEVEL SECURITY;

-- Push Notifications
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushNotificationLog" ENABLE ROW LEVEL SECURITY;
