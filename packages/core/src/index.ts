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

// Logger
export {
  Logger,
  createLogger,
  logger,
  configureLogger,
  type LogLevel,
  type LogContext,
  type LogEntry,
  type LoggerConfig,
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
