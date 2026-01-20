// Database
export {
  prisma,
  isDatabaseConnected,
  disconnectPrisma,
  withDatabase,
  type PrismaClientConfig
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
  type SecretsManagerInterface
} from './auth/jwt';

// Logger
export {
  Logger,
  createLogger,
  logger,
  configureLogger,
  type LogLevel,
  type LogContext,
  type LogEntry,
  type LoggerConfig
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
  type CookieOptions
} from './utils/cookies';
