// Database
export {
  createPrismaClient,
  getPrisma,
  isDatabaseConnected,
  disconnectPrisma,
  withDatabase,
  type PrismaClientConfig,
  type PrismaClientLike,
} from './db/prisma';

// Authentication
export {
  createToken,
  verifyToken,
  getTokenFromHeader,
  decodeToken,
  configureJWT,
  setSecretsManager,
  type JWTPayload,
  type JWTConfig,
  type SecretsManagerInterface,
} from './auth/jwt';

// Secrets Management (JWT Key Rotation)
export {
  DatabaseSecretsManager,
  InMemorySecretsStorage,
  createInMemorySecretsManager,
  type SecretKeyRecord,
  type SecretsStorage,
  type SecretsManagerConfig,
} from './auth/secrets-manager';

// Secret Encryption (envelope encryption for JWT secrets at rest)
export {
  encryptSecret,
  decryptSecret,
  decryptSecretIfNeeded,
  isEncryptedSecret,
  isEncryptionEnabled,
} from './auth/secret-encryption';

// Logger
export {
  Logger,
  createLogger,
  logger,
  configureLogger,
  addErrorReporter,
  removeAllErrorReporters,
  type LogLevel,
  type LogContext,
  type LogEntry,
  type LoggerConfig,
  type ErrorReportHandler,
} from './logger';

// Utils
export {
  getCookieDomain,
  getAuthCookieOptions,
  getOAuthStateCookieOptions,
  getCSRFCookieOptions,
  getSessionCookieOptions,
  parseCookies,
  serializeCookie,
  type CookieOptions,
} from './utils/cookies';

// Errors
export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalError,
  ServiceUnavailableError,
  ConfigurationError,
  isAppError,
  isOperationalError,
  normalizeError,
  handleApiError,
} from './errors';

// Environment
export {
  validateEnv,
  assertValidEnv,
  checkProductionReadiness,
  getEnv,
  requireEnv,
  isProduction,
  isDevelopment,
  isTest,
  type ServerEnv,
  type ClientEnv,
  type Env,
  type EnvValidationResult,
} from './env';

// Rate Limiting
export {
  createRateLimiter,
  MemoryRateLimitStore,
  RATE_LIMIT_PRESETS,
  rateLimiters,
  checkMultipleRateLimits,
  type RateLimitConfig,
  type RateLimitRequest,
  type RateLimitInfo,
  type RateLimitStore,
} from './middleware/rate-limit';

// Next.js Middleware
export {
  createMiddleware,
  getClientIP as getClientIPFromHeaders,
  generateCSPNonce,
  buildCSPHeader,
  EdgeMemoryRateLimitStore,
  type MiddlewareConfig,
  type MiddlewareRateLimitConfig,
  type MiddlewareRouteRule,
  type CSPDirectives,
  type MiddlewareRateLimitResult,
  type EdgeRateLimitStore,
} from './middleware/next-middleware';

// Cache
export {
  Cache,
  MemoryCacheStore,
  createMemoryCache,
  getCache,
  setCache,
  cacheKeys,
  CACHE_TTL,
  type CacheEntry,
  type CacheSetOptions,
  type CacheGetOptions,
  type CacheStats,
  type CacheStore,
  type CacheConfig,
} from './cache';

// Redis Cache Store
export {
  RedisCacheStore,
  createRedisCache,
  type RedisCacheStoreConfig,
  type RedisHealthResult,
} from './cache/redis-store';

// API Cache
export {
  ApiCacheManager,
  getApiCacheManager,
  buildCacheControlHeader,
  API_CACHE_PRESETS,
  type ApiCacheConfig,
  type ApiCacheRequest,
  type ApiCacheResponse,
  type CacheControlOptions,
  type CacheResult,
} from './middleware/api-cache';

// Site Configuration
export {
  SiteConfigSchema,
  validateSiteConfig,
  safeParseSiteConfig,
  createSiteConfig,
  mergeSiteConfig,
  diffSiteConfig,
  DEFAULT_THEME,
  DEFAULT_NAVIGATION,
  COLOR_PALETTES,
  SITE_TEMPLATES,
  createConfigFromTemplate,
  getAvailablePalettes,
  getColorPalette,
  ConfigLoader,
  MemoryConfigSource,
  EnvConfigSource,
  JsonObjectConfigSource,
  createConfigLoader,
  getConfigLoader,
  setConfigLoader,
  loadSiteConfig,
  type SiteConfig,
  type ThemeConfig,
  type ColorPalette,
  type FeaturesConfig,
  type SeoConfig,
  type ContactConfig,
  type IntegrationsConfig,
  type ContentConfig,
  type NavigationConfig,
  type NavigationItem,
  type LegalConfig,
  type SiteTemplate,
  type ConfigSource,
  type ConfigLoaderOptions,
} from './config';

// Email
export {
  sendEmail,
  createEmailSender,
  buildAdminEmailHtml,
  buildAdminEmailText,
  buildConfirmationEmailHtml,
  buildConfirmationEmailText,
  escapeHtml,
  nl2br,
  formatSubmittedAt,
  type EmailContent,
  type SendEmailOptions,
  type EmailServiceConfig,
  type SendEmailResult,
  type EmailField,
  type EmailSection,
  type EmailCallout,
  type AdminEmailOptions,
  type ConfirmationEmailOptions,
  type EmailBranding,
} from './email';

// Storage
export {
  StorageService,
  createStorageService,
  createLocalStorageProvider,
  createSupabaseStorageProvider,
  BLUR_DATA_URL,
  BLUR_DATA_URL_GOLD,
  IMAGE_DIMENSIONS,
  ASPECT_RATIOS,
  getPlaceholderProps,
  getImageProps,
  type StorageProvider,
  type StorageServiceConfig,
  type LocalStorageConfig,
  type SupabaseStorageConfig,
  type UploadResult,
  type DeleteResult,
  type SupabaseStorageClient,
} from './storage';

// Deployment (Vercel-based)
export {
  // New Vercel/GitHub utilities
  formatDuration,
  formatDurationMs,
  formatTimestamp,
  formatRelativeTime,
  VERCEL_STATE_COLORS,
  VERCEL_STATE_LABELS,
  getVercelStateColor,
  getVercelStateLabel,
  getCIColor,
  getCILabel,
  sanitizeLogs,
  checkDeploymentConfig,
  // Vercel API client
  fetchVercelDeployments,
  fetchVercelDeployment,
  fetchVercelProject,
  // GitHub API client
  fetchWorkflowRuns,
  fetchCheckRunsForCommit,
  fetchLatestCIRun,
  // Maintenance flag (legacy filesystem)
  writeMaintenanceFlag,
  removeMaintenanceFlag,
  setMaintenanceInactive,
  setMaintenanceActive,
  // Legacy utilities (backward compatibility)
  ALLOWED_REFS,
  VERSION_TAG_PATTERN,
  isAllowedRef,
  generateDeployToken,
  getTokenExpiration,
  isTokenValid,
  getStatusColor,
  getPhaseDisplayName,
  // New types
  type VercelDeploymentState,
  type VercelDeploymentTarget,
  type VercelGitMeta,
  type VercelDeployment,
  type VercelProjectInfo,
  type VercelClientConfig,
  type GitHubRunStatus,
  type GitHubRunConclusion,
  type GitHubCheckRun,
  type GitHubWorkflowRun,
  type GitHubClientConfig,
  type ServiceHealth,
  type RuntimeHealth,
  type DeploymentConfig,
  type DeploymentDashboardData,
  type DiagnosticFinding,
  type DiagnosticRecommendation,
  type DiagnosticAnalysis,
  // Legacy types
  type DeploymentStatus,
  type DeploymentPhase,
  type DeploymentInfo,
  type DeploymentTriggerRequest,
  type DeploymentTriggerResponse,
  type MaintenanceModeInfo,
  type BranchInfo,
  type MaintenanceFlag,
} from './deployment';

// Scheduler (QStash)
export {
  // Client
  createQStashClient,
  getQStashClient,
  resetQStashClient,
  schedulePost,
  scheduleRecurring,
  publishDelayed,
  cancelMessage,
  deleteSchedule,
  listSchedules,
  getSchedule,
  pauseSchedule,
  resumeSchedule,
  // Verification
  verifyQStashSignature,
  verifyCronAuth,
  isValidCronRequest,
  verifyCronSecretSync,
  resetReceiver,
  // Helpers
  DEFAULT_CRON_SCHEDULES,
  getCronEndpointUrl,
  createScheduleConfigs,
  // Types
  type ScheduleConfig,
  type PublishConfig,
  type ScheduleResult,
  type PublishResult,
  type QStashClientConfig,
  type VerifyQStashConfig,
  type VerifyResult,
  type CronJobName,
} from './scheduler';
