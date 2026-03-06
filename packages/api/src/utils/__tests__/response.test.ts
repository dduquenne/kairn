import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalError,
  ServiceUnavailableError,
  ConfigurationError,
} from '@kairn/core';
import {
  appErrorToResponse,
  handleErrorResponse,
  ErrorCodes,
  success,
  error,
  paginated,
  getStatusForError,
} from '../response';

describe('appErrorToResponse', () => {
  it('should convert ValidationError with fields', () => {
    const err = new ValidationError('Données invalides', {
      email: ['Format incorrect'],
    });
    const result = appErrorToResponse(err);

    expect(result.statusCode).toBe(400);
    expect(result.response.success).toBe(false);
    expect(result.response.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    expect(result.response.error.message).toBe('Données invalides');
    expect(result.response.error.details).toEqual({
      fields: { email: ['Format incorrect'] },
    });
  });

  it('should convert ValidationError without fields', () => {
    const err = new ValidationError('Données invalides');
    const result = appErrorToResponse(err);

    expect(result.statusCode).toBe(400);
    expect(result.response.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    expect(result.response.error.details).toBeUndefined();
  });

  it('should convert AuthenticationError', () => {
    const err = new AuthenticationError('Token expiré');
    const result = appErrorToResponse(err);

    expect(result.statusCode).toBe(401);
    expect(result.response.error.code).toBe(ErrorCodes.UNAUTHORIZED);
    expect(result.response.error.message).toBe('Token expiré');
  });

  it('should convert AuthorizationError', () => {
    const err = new AuthorizationError('Accès refusé');
    const result = appErrorToResponse(err);

    expect(result.statusCode).toBe(403);
    expect(result.response.error.code).toBe(ErrorCodes.INSUFFICIENT_PERMISSIONS);
  });

  it('should convert NotFoundError', () => {
    const err = new NotFoundError('Article non trouvé', 'BlogPost');
    const result = appErrorToResponse(err);

    expect(result.statusCode).toBe(404);
    expect(result.response.error.code).toBe(ErrorCodes.NOT_FOUND);
  });

  it('should convert ConflictError', () => {
    const err = new ConflictError('Email déjà utilisé');
    const result = appErrorToResponse(err);

    expect(result.statusCode).toBe(409);
    expect(result.response.error.code).toBe(ErrorCodes.CONFLICT);
  });

  it('should convert RateLimitError with Retry-After header', () => {
    const err = new RateLimitError('Trop de requêtes', 120);
    const result = appErrorToResponse(err);

    expect(result.statusCode).toBe(429);
    expect(result.response.error.code).toBe(ErrorCodes.TOO_MANY_REQUESTS);
    expect(result.response.error.details).toEqual({ retryAfter: 120 });
    expect(result.headers).toEqual({ 'Retry-After': '120' });
  });

  it('should convert RateLimitError without retryAfter', () => {
    const err = new RateLimitError('Trop de requêtes');
    const result = appErrorToResponse(err);

    expect(result.statusCode).toBe(429);
    expect(result.response.error.code).toBe(ErrorCodes.TOO_MANY_REQUESTS);
    expect(result.response.error.details).toBeUndefined();
    expect(result.headers).toBeUndefined();
  });

  it('should convert InternalError', () => {
    const err = new InternalError('Erreur inattendue');
    const result = appErrorToResponse(err);

    expect(result.statusCode).toBe(500);
    expect(result.response.error.code).toBe(ErrorCodes.INTERNAL_ERROR);
  });

  it('should convert ServiceUnavailableError', () => {
    const err = new ServiceUnavailableError('Base de données indisponible', 'PostgreSQL');
    const result = appErrorToResponse(err);

    expect(result.statusCode).toBe(503);
    expect(result.response.error.code).toBe(ErrorCodes.SERVICE_UNAVAILABLE);
  });

  it('should convert ConfigurationError to INTERNAL_ERROR', () => {
    const err = new ConfigurationError('JWT_SECRET manquant');
    const result = appErrorToResponse(err);

    expect(result.statusCode).toBe(500);
    expect(result.response.error.code).toBe(ErrorCodes.INTERNAL_ERROR);
  });
});

describe('handleErrorResponse', () => {
  it('should handle AppError instances directly', () => {
    const err = new NotFoundError('Non trouvé');
    const result = handleErrorResponse(err);

    expect(result.statusCode).toBe(404);
    expect(result.response.error.code).toBe(ErrorCodes.NOT_FOUND);
  });

  it('should normalize standard Error to InternalError', () => {
    const err = new Error('Something went wrong');
    const result = handleErrorResponse(err);

    expect(result.statusCode).toBe(500);
    expect(result.response.error.code).toBe(ErrorCodes.INTERNAL_ERROR);
    expect(result.response.error.message).toBe('Something went wrong');
  });

  it('should handle string errors', () => {
    const result = handleErrorResponse('erreur inconnue');

    expect(result.statusCode).toBe(500);
    expect(result.response.error.code).toBe(ErrorCodes.INTERNAL_ERROR);
  });

  it('should handle null errors', () => {
    const result = handleErrorResponse(null);

    expect(result.statusCode).toBe(500);
    expect(result.response.success).toBe(false);
  });

  it('should handle undefined errors', () => {
    const result = handleErrorResponse(undefined);

    expect(result.statusCode).toBe(500);
    expect(result.response.success).toBe(false);
  });

  it('should preserve response format consistency', () => {
    const appErrorResult = handleErrorResponse(new ValidationError('test'));
    const genericErrorResult = handleErrorResponse(new Error('test'));

    // Both should have the same structure
    expect(appErrorResult.response).toHaveProperty('success', false);
    expect(appErrorResult.response).toHaveProperty('error');
    expect(appErrorResult.response.error).toHaveProperty('code');
    expect(appErrorResult.response.error).toHaveProperty('message');

    expect(genericErrorResult.response).toHaveProperty('success', false);
    expect(genericErrorResult.response).toHaveProperty('error');
    expect(genericErrorResult.response.error).toHaveProperty('code');
    expect(genericErrorResult.response.error).toHaveProperty('message');
  });
});

describe('existing response helpers', () => {
  it('should create success response', () => {
    const result = success({ id: '1' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: '1' });
  });

  it('should create error response', () => {
    const result = error('NOT_FOUND', 'Not found');

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('should create paginated response', () => {
    const result = paginated([1, 2, 3], { page: 1, limit: 10, total: 3 });

    expect(result.success).toBe(true);
    expect(result.data).toEqual([1, 2, 3]);
    expect(result.pagination.totalPages).toBe(1);
    expect(result.pagination.hasNext).toBe(false);
  });

  it('should map error codes to status codes', () => {
    expect(getStatusForError('NOT_FOUND')).toBe(404);
    expect(getStatusForError('UNAUTHORIZED')).toBe(401);
    expect(getStatusForError('UNKNOWN_CODE')).toBe(500);
  });
});
