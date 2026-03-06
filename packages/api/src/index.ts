/**
 * @kairn/api
 *
 * Reusable API handlers, middlewares, and utilities for Kairn sites.
 *
 * @example
 * ```typescript
 * import {
 *   withAuth,
 *   withAdmin,
 *   withRateLimit,
 *   handleLogin,
 *   handleGetPosts,
 *   success,
 *   error,
 *   paginated,
 * } from '@kairn/api';
 * ```
 */

// ============================================
// Middleware
// ============================================

export {
  // Auth middleware
  withAuth,
  createAuthMiddleware,
  AuthErrorCode,

  // Admin middleware
  withAdmin,
  createAdminMiddleware,
  AdminErrorCode,

  // Rate limit middleware
  withRateLimit,
  createRateLimitMiddleware,
  createKeyGenerator,
  getClientIP,
  RATE_LIMIT_PRESETS,
  MemoryRateLimitStore,

  // CSRF middleware
  withCSRF,
  createCSRFMiddleware,
  generateCSRFToken,
  validateCSRFToken,
  getCSRFConfig,

  // Validation middleware
  withBodyValidation,
  withQueryValidation,
  withValidation,
  createValidationMiddleware,
  commonSchemas,

  // Types
  type ApiRequest,
  type AuthContext,
  type AuthResult,
  type ApiErrorResponse,
  type AuthMiddlewareConfig,
  type AdminMiddlewareConfig,
  type CSRFConfig,
  type CSRFResult,
  type RateLimitResult,
  type RateLimitConfig,
  type RateLimitRequest,
  type RateLimitInfo,
  type RateLimitStore,
  type JWTPayload,

  // CRON auth middleware
  withCronAuth,
  type CronAuthResult,

  // Admin auth middleware (Next.js cookies)
  withNextAdminAuth,
  createAdminAuth,
  type AdminAuthConfig,
  type AdminAuthResult,
} from './middleware';

// ============================================
// Utilities
// ============================================

export {
  // Response helpers
  success,
  error,
  paginated,
  buildHeaders,
  getStatusForError,
  appErrorToResponse,
  handleErrorResponse,
  ErrorCodes,
  HttpStatus,
  ErrorCodeToStatus,
  CacheControl,

  // Pagination
  parsePagination,
  calculatePagination,
  getCursorPagination,
  buildPaginationLinks,
  createPaginator,
  DEFAULT_PAGINATION,

  // Filters
  parseFilters,
  parseSort,
  parseDateRange,
  parseSearch,
  buildPrismaFilters,
  buildPrismaSort,
  createFilterParser,

  // Types
  type SuccessResponse,
  type ErrorResponse,
  type PaginatedResponse,
  type AppErrorResponseResult,
  type PaginationParams,
  type PaginationQuery,
  type PaginationMeta,
  type FilterOperator,
  type ParsedFilter,
  type FilterConfig,
  type SortDirection,
  type ParsedSort,
} from './utils';

// ============================================
// Auth Handlers
// ============================================

export {
  handleLogin,
  createLoginHandler,
  handleLogout,
  createLogoutHandler,
  handleRefresh,
  createRefreshHandler,
  handleForgotPassword,
  createForgotPasswordHandler,

  // Schemas
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  getDefaultAuthCookieOptions,

  // Types
  type LoginInput,
  type RefreshTokenInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type AuthUser,
  type LoginResponse,
  type LogoutResponse,
  type RefreshResponse,
  type ForgotPasswordResponse,
  type AuthHandlerConfig,
  type AuthCookieOptions,
  type LoginResult,
  type LogoutHandlerConfig,
  type LogoutResult,
  type RefreshHandlerConfig,
  type RefreshResult,
  type ForgotPasswordHandlerConfig,
  type ForgotPasswordResult,
} from './handlers/auth';

// ============================================
// Blog Handlers
// ============================================

export {
  handleGetPosts,
  handleGetPostBySlug,
  handleCreatePost,
  handleUpdatePost,
  handleDeletePost,
  handleCheckSlug,
  createBlogHandlers,
  handleGetTags,
  handleCreateTag,
  handleUpdateTag,
  handleDeleteTag,
  createTagHandlers,

  // Schemas
  blogPostSchema,
  blogPostUpdateSchema,
  tagSchema,
  checkSlugSchema,
  postsQuerySchema,
  validateSlug,
  generateSlug,

  // Types
  type PostStatus,
  type BlogPostInput,
  type BlogPostUpdateInput,
  type TagInput,
  type CheckSlugInput,
  type PostsQueryParams,
  type BlogPost,
  type Tag,
  type BlogHandlerConfig,
  type BlogHandlerResult,
  type TagHandlerResult,
} from './handlers/blog';

// ============================================
// Analytics Handlers
// ============================================

export {
  handleTrack,
  createTrackHandler,
  extractGeolocation,
  handleDashboard,
  createDashboardHandler,
  handleRealtime,
  createRealtimeHandler,
  handleExport,
  createExportHandler,

  // Schemas
  sessionDataSchema,
  baseEventSchema,
  clientInfoSchema,
  trackingPayloadSchema,
  dashboardQuerySchema,
  exportQuerySchema,

  // Utilities
  isBot,
  extractDomain,
  hashIP,
  getCountryName,
  BOT_PATTERNS,
  COUNTRY_NAMES,

  // Types
  type EventType,
  type DeviceType,
  type SessionData,
  type BaseEvent,
  type ClientInfo,
  type TrackingPayload,
  type GeolocationData,
  type DashboardQueryParams,
  type ExportQueryParams,
  type DashboardMetrics,
  type TopPage,
  type TrafficSource,
  type DeviceBreakdown,
  type GeoData,
  type TimeSeriesPoint,
  type DashboardData,
  type RealtimeData,
  type AnalyticsHandlerConfig,
  type TrackResult,
  type DashboardResult,
  type RealtimeResult,
  type ExportResult,
} from './handlers/analytics';

// ============================================
// Contact Handler
// ============================================

export {
  handleContact,
  createContactHandler,

  // Schema
  contactSchema,

  // Types
  type ContactInput,
  type ContactHandlerConfig,
  type ContactResult,
} from './handlers/contact';

// ============================================
// Testimonials Handlers
// ============================================

export {
  handleGetTestimonials,
  handleGetTestimonialById,
  handleCreateTestimonial,
  handleUpdateTestimonial,
  handleDeleteTestimonial,
  createTestimonialsHandlers,

  // Schemas
  testimonialSchema,
  testimonialUpdateSchema,
  testimonialsQuerySchema,

  // Types
  type TestimonialInput,
  type TestimonialUpdateInput,
  type TestimonialsQueryParams,
  type Testimonial,
  type TestimonialsHandlerConfig,
  type TestimonialHandlerResult,
} from './handlers/testimonials';

// ============================================
// Seminars Handlers
// ============================================

export {
  handleGetSeminars,
  handleGetSeminarBySlug,
  handleCreateSeminar,
  handleUpdateSeminar,
  handleDeleteSeminar,
  handleRegister,
  createSeminarsHandlers,

  // Schemas
  seminarSchema,
  seminarUpdateSchema,
  registrationSchema,
  seminarsQuerySchema,

  // Types
  type SeminarStatus,
  type SeminarInput,
  type SeminarUpdateInput,
  type RegistrationInput,
  type SeminarsQueryParams,
  type Seminar,
  type Registration,
  type SeminarsHandlerConfig,
  type SeminarHandlerResult,
} from './handlers/seminars';

// ============================================
// GDPR Handlers
// ============================================

export {
  handleGdprDelete,
  createGdprDeleteHandler,

  // Schema
  gdprDeleteSchema,

  // Types
  type GdprDeleteInput,
  type GdprHandlerConfig,
  type GdprDeleteResult,
} from './handlers/gdpr';
