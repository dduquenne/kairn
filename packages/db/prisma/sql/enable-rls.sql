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
ALTER TABLE IF EXISTS "Site" ENABLE ROW LEVEL SECURITY;

-- Authentication & Sessions
ALTER TABLE IF EXISTS "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "RefreshToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "SecretKey" ENABLE ROW LEVEL SECURITY;

-- Blog
ALTER TABLE IF EXISTS "BlogPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "BlogPostTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "BlogAnalytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "BlogFaqClick" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "BlogCtaClick" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "BlogGenerationJob" ENABLE ROW LEVEL SECURITY;

-- Testimonials & Contact
ALTER TABLE IF EXISTS "Testimonial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Contact" ENABLE ROW LEVEL SECURITY;

-- Analytics
ALTER TABLE IF EXISTS "AnalyticsEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "AnalyticsDailySummary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "VisitorGeolocation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "AnalyticsGoal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "AnalyticsGoalCompletion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "AnalyticsAlert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "AnalyticsAlertHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "AnalyticsAnomaly" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "AnalyticsDashboardConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "AnalyticsScheduledReport" ENABLE ROW LEVEL SECURITY;

-- Seminars & Appointments
ALTER TABLE IF EXISTS "Seminar" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Appointment" ENABLE ROW LEVEL SECURITY;

-- Social
ALTER TABLE IF EXISTS "SocialAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "SocialPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "SocialPostAnalytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "SocialAccountSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "SocialTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "SocialGenerationLog" ENABLE ROW LEVEL SECURITY;

-- Visitors & Bots
ALTER TABLE IF EXISTS "BotVisit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "NavigationHistory" ENABLE ROW LEVEL SECURITY;

-- Experiments (A/B Testing)
ALTER TABLE IF EXISTS "Experiment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ExperimentVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ExperimentAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ExperimentResult" ENABLE ROW LEVEL SECURITY;

-- Chat
ALTER TABLE IF EXISTS "ChatConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ChatMessage" ENABLE ROW LEVEL SECURITY;

-- Infrastructure
ALTER TABLE IF EXISTS "Deployment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "MaintenanceMode" ENABLE ROW LEVEL SECURITY;

-- Push Notifications
ALTER TABLE IF EXISTS "PushSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "PushNotificationLog" ENABLE ROW LEVEL SECURITY;
