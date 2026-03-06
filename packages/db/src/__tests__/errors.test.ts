import { Prisma } from '@prisma/client';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { handlePrismaError } from '../errors';

describe('handlePrismaError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('retourne null pour une erreur non-Prisma', () => {
    const result = handlePrismaError(new Error('generic error'));
    expect(result).toBeNull();
  });

  it('retourne null pour une valeur non-erreur', () => {
    const result = handlePrismaError('string error');
    expect(result).toBeNull();
  });

  it('mappe P2002 (unique constraint) vers CONFLICT 409', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.0.0',
      meta: { target: ['email'] },
    });
    const result = handlePrismaError(err, 'creating user');

    expect(result).toEqual({
      code: 'CONFLICT',
      message: 'Une ressource avec ces données existe déjà',
      statusCode: 409,
    });
  });

  it('mappe P2025 (record not found) vers NOT_FOUND 404', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '6.0.0',
      meta: { modelName: 'BlogPost' },
    });
    const result = handlePrismaError(err, 'updating post');

    expect(result).toEqual({
      code: 'NOT_FOUND',
      message: 'Ressource introuvable',
      statusCode: 404,
    });
  });

  it('mappe P2003 (foreign key constraint) vers VALIDATION_ERROR 400', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
      code: 'P2003',
      clientVersion: '6.0.0',
      meta: { field_name: 'siteId' },
    });
    const result = handlePrismaError(err);

    expect(result).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Référence invalide : la ressource liée est introuvable',
      statusCode: 400,
    });
  });

  it('mappe P2014 (relation violation) vers VALIDATION_ERROR 400', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Relation violation', {
      code: 'P2014',
      clientVersion: '6.0.0',
    });
    const result = handlePrismaError(err);

    expect(result).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Modification impossible : une contrainte de relation serait violée',
      statusCode: 400,
    });
  });

  it('retourne INTERNAL_ERROR 500 pour un code Prisma non mappé', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Unknown error', {
      code: 'P9999',
      clientVersion: '6.0.0',
    });
    const result = handlePrismaError(err, 'unknown operation');

    expect(result).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Erreur de base de données',
      statusCode: 500,
    });
  });

  it('mappe PrismaClientValidationError vers VALIDATION_ERROR 400', () => {
    const err = new Prisma.PrismaClientValidationError('Invalid field', {
      clientVersion: '6.0.0',
    });
    const result = handlePrismaError(err, 'creating post');

    expect(result).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Données invalides',
      statusCode: 400,
    });
  });

  it('mappe PrismaClientInitializationError vers SERVICE_UNAVAILABLE 503', () => {
    const err = new Prisma.PrismaClientInitializationError('Cannot connect to database', '6.0.0');
    const result = handlePrismaError(err, 'fetching data');

    expect(result).toEqual({
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service temporairement indisponible',
      statusCode: 503,
    });
  });
});
