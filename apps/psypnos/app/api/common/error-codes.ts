// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Codes d'erreur standardisés pour l'API
 */

export enum ErrorCode {
  // Validation errors
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_FIELD = "MISSING_FIELD",
  INVALID_EMAIL = "INVALID_EMAIL",
  INVALID_PASSWORD = "INVALID_PASSWORD",

  // Authentication errors
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  INVALID_TOKEN = "INVALID_TOKEN",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // Rate limiting
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",

  // User errors
  USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
  USER_NOT_ADMIN = "USER_NOT_ADMIN",

  // Server errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  EMAIL_SERVICE_ERROR = "EMAIL_SERVICE_ERROR",

  // Validation service errors
  RECAPTCHA_FAILED = "RECAPTCHA_FAILED",
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export const ErrorMessages: Record<ErrorCode, { message: string; statusCode: number }> = {
  [ErrorCode.INVALID_INPUT]: {
    message: "Les données fournies sont invalides",
    statusCode: 400,
  },
  [ErrorCode.MISSING_FIELD]: {
    message: "Un champ requis est manquant",
    statusCode: 400,
  },
  [ErrorCode.INVALID_EMAIL]: {
    message: "Adresse email invalide",
    statusCode: 400,
  },
  [ErrorCode.INVALID_PASSWORD]: {
    message: "Mot de passe invalide",
    statusCode: 400,
  },
  [ErrorCode.UNAUTHORIZED]: {
    message: "Authentification requise",
    statusCode: 401,
  },
  [ErrorCode.INVALID_CREDENTIALS]: {
    message: "Identifiants invalides",
    statusCode: 401,
  },
  [ErrorCode.TOKEN_EXPIRED]: {
    message: "Votre session a expiré. Veuillez vous reconnecter",
    statusCode: 401,
  },
  [ErrorCode.INVALID_TOKEN]: {
    message: "Token invalide",
    statusCode: 401,
  },
  [ErrorCode.USER_NOT_FOUND]: {
    message: "Utilisateur introuvable",
    statusCode: 404,
  },
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: {
    message: "Permissions insuffisantes",
    statusCode: 403,
  },
  [ErrorCode.TOO_MANY_REQUESTS]: {
    message: "Trop de tentatives. Veuillez réessayer dans quelques minutes",
    statusCode: 429,
  },
  [ErrorCode.USER_ALREADY_EXISTS]: {
    message: "Un utilisateur avec cette adresse email existe déjà",
    statusCode: 409,
  },
  [ErrorCode.USER_NOT_ADMIN]: {
    message: "Identifiants invalides",
    statusCode: 401,
  },
  [ErrorCode.INTERNAL_ERROR]: {
    message: "Une erreur interne s'est produite. Veuillez réessayer",
    statusCode: 500,
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    message: "Le service est temporairement indisponible",
    statusCode: 503,
  },
  [ErrorCode.EMAIL_SERVICE_ERROR]: {
    message: "Erreur lors de l'envoi de l'email. Veuillez réessayer",
    statusCode: 500,
  },
  [ErrorCode.RECAPTCHA_FAILED]: {
    message: "Vérification reCAPTCHA échouée",
    statusCode: 400,
  },
};

export function createApiError(
  code: ErrorCode,
  overrides?: Partial<ApiError>
): ApiError {
  const { message, statusCode } = ErrorMessages[code];
  return {
    code,
    message,
    statusCode,
    ...overrides,
  };
}
