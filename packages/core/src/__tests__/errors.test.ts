import { describe, it, expect } from 'vitest';
import {
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
} from '../errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with all properties', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 500, true, { foo: 'bar' });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.context).toEqual({ foo: 'bar' });
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.name).toBe('AppError');
    });

    it('should have default values', () => {
      const error = new AppError('Test', 'TEST');

      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.context).toBeUndefined();
    });

    it('should serialize to JSON safely', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 400);
      const json = error.toJSON();

      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('code', 'TEST_ERROR');
      expect(json.error).toHaveProperty('message', 'Test error');
      expect(json.error).toHaveProperty('statusCode', 400);
      expect(json.error).toHaveProperty('timestamp');
      expect(json.error).not.toHaveProperty('stack');
    });

    it('should serialize to log with full details', () => {
      const error = new AppError('Test', 'TEST', 500, true, { key: 'value' });
      const log = error.toLog();

      expect(log).toHaveProperty('name', 'AppError');
      expect(log).toHaveProperty('code', 'TEST');
      expect(log).toHaveProperty('context', { key: 'value' });
      expect(log).toHaveProperty('stack');
    });
  });

  describe('ValidationError', () => {
    it('should have 400 status code', () => {
      const error = new ValidationError('Invalid input');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should include field errors', () => {
      const fields = {
        email: ['Invalid email format'],
        password: ['Too short', 'Must contain number'],
      };
      const error = new ValidationError('Validation failed', fields);

      expect(error.fields).toEqual(fields);

      const json = error.toJSON();
      expect(json.error).toHaveProperty('fields', fields);
    });
  });

  describe('AuthenticationError', () => {
    it('should have 401 status code', () => {
      const error = new AuthenticationError();

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.message).toBe('Authentication required');
    });

    it('should accept custom message', () => {
      const error = new AuthenticationError('Token expired');

      expect(error.message).toBe('Token expired');
    });
  });

  describe('AuthorizationError', () => {
    it('should have 403 status code', () => {
      const error = new AuthorizationError();

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.message).toBe('Insufficient permissions');
    });
  });

  describe('NotFoundError', () => {
    it('should have 404 status code', () => {
      const error = new NotFoundError();

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should include resource name', () => {
      const error = new NotFoundError('User not found', 'User');

      expect(error.resource).toBe('User');
    });
  });

  describe('ConflictError', () => {
    it('should have 409 status code', () => {
      const error = new ConflictError('Email already exists');

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });
  });

  describe('RateLimitError', () => {
    it('should have 429 status code', () => {
      const error = new RateLimitError();

      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should include retryAfter', () => {
      const error = new RateLimitError('Too many requests', 60);

      expect(error.retryAfter).toBe(60);

      const json = error.toJSON();
      expect(json.error).toHaveProperty('retryAfter', 60);
    });
  });

  describe('InternalError', () => {
    it('should have 500 status code', () => {
      const error = new InternalError();

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(false);
    });

    it('should allow setting operational flag', () => {
      const error = new InternalError('Known issue', {}, true);

      expect(error.isOperational).toBe(true);
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should have 503 status code', () => {
      const error = new ServiceUnavailableError('Database down', 'PostgreSQL');

      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.service).toBe('PostgreSQL');
    });
  });

  describe('ConfigurationError', () => {
    it('should have 500 status code and be non-operational', () => {
      const error = new ConfigurationError('Missing JWT_SECRET');

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.isOperational).toBe(false);
    });
  });
});

describe('Type Guards', () => {
  describe('isAppError', () => {
    it('should return true for AppError instances', () => {
      expect(isAppError(new AppError('test', 'TEST'))).toBe(true);
      expect(isAppError(new ValidationError('test'))).toBe(true);
      expect(isAppError(new AuthenticationError())).toBe(true);
    });

    it('should return false for non-AppError', () => {
      expect(isAppError(new Error('test'))).toBe(false);
      expect(isAppError({ message: 'test' })).toBe(false);
      expect(isAppError('error')).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
    });
  });

  describe('isOperationalError', () => {
    it('should return true for operational errors', () => {
      expect(isOperationalError(new ValidationError('test'))).toBe(true);
      expect(isOperationalError(new AuthenticationError())).toBe(true);
      expect(isOperationalError(new NotFoundError())).toBe(true);
    });

    it('should return false for non-operational errors', () => {
      expect(isOperationalError(new InternalError())).toBe(false);
      expect(isOperationalError(new ConfigurationError('test'))).toBe(false);
      expect(isOperationalError(new Error('test'))).toBe(false);
    });
  });
});

describe('Error Utilities', () => {
  describe('normalizeError', () => {
    it('should return AppError as-is', () => {
      const error = new ValidationError('test');
      expect(normalizeError(error)).toBe(error);
    });

    it('should convert Error to InternalError', () => {
      const error = new Error('Something went wrong');
      const normalized = normalizeError(error);

      expect(normalized).toBeInstanceOf(InternalError);
      expect(normalized.message).toBe('Something went wrong');
    });

    it('should handle unknown errors', () => {
      const normalized = normalizeError('string error');

      expect(normalized).toBeInstanceOf(InternalError);
      expect(normalized.message).toBe('An unexpected error occurred');
    });

    it('should handle null/undefined', () => {
      expect(normalizeError(null)).toBeInstanceOf(InternalError);
      expect(normalizeError(undefined)).toBeInstanceOf(InternalError);
    });
  });

  describe('handleApiError', () => {
    it('should return proper response for validation error', () => {
      const error = new ValidationError('Invalid input', { email: ['Required'] });
      const response = handleApiError(error);

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error).toHaveProperty('fields');
    });

    it('should include Retry-After header for rate limit errors', () => {
      const error = new RateLimitError('Too many requests', 120);
      const response = handleApiError(error);

      expect(response.status).toBe(429);
      expect(response.headers).toHaveProperty('Retry-After', '120');
    });

    it('should handle unknown errors', () => {
      const response = handleApiError(new Error('Unknown'));

      expect(response.status).toBe(500);
      expect(response.body.error).toHaveProperty('code', 'INTERNAL_ERROR');
    });
  });
});
