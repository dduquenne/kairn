/**
 * Tests unitaires pour le classifier d'erreurs IA.
 *
 * Vérifie que chaque type d'erreur Anthropic / OpenAI est correctement
 * classifié et qu'un message utilisateur français clair est retourné.
 */

import { describe, it, expect } from 'vitest';

import { classifyAIError, formatAIErrorResponse } from '../../app/api/common/ai-error-handler';

describe('classifyAIError', () => {
  it('retourne "unknown" pour null/undefined', () => {
    expect(classifyAIError(null).type).toBe('unknown');
    expect(classifyAIError(undefined).type).toBe('unknown');
  });

  it("classifie l'erreur d'authentification (401)", () => {
    const error = Object.assign(new Error('authentication failed: invalid api key'), {
      status: 401,
    });
    const info = classifyAIError(error);
    expect(info.type).toBe('auth');
    expect(info.retryable).toBe(false);
    expect(info.userMessage).toMatch(/clé API/i);
  });

  it('classifie "credit balance is too low" (Anthropic) comme credit_exhausted, PAS invalid_request', () => {
    // Reproduction de l'erreur réelle observée en production (issue #454)
    const error = Object.assign(
      new Error(
        '400 {"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits."}}'
      ),
      { status: 400 }
    );
    const info = classifyAIError(error);
    expect(info.type).toBe('credit_exhausted');
    expect(info.retryable).toBe(false);
    expect(info.userMessage).toMatch(/crédit/i);
    expect(info.userMessage).toMatch(/administrateur/i);
    expect(info.httpStatus).toBe(402);
  });

  it('classifie "insufficient_quota" (OpenAI) comme credit_exhausted', () => {
    const error = Object.assign(new Error('insufficient_quota: You exceeded your current quota'), {
      status: 429,
    });
    const info = classifyAIError(error);
    expect(info.type).toBe('credit_exhausted');
  });

  it('classifie une erreur de billing (OpenAI) comme credit_exhausted', () => {
    const error = new Error('billing_hard_limit_reached');
    const info = classifyAIError(error).type;
    expect(info).toBe('credit_exhausted');
  });

  it('classifie le vrai rate limit (429 sans billing) comme rate_limit', () => {
    const error = Object.assign(new Error('rate_limit_error: too many requests'), { status: 429 });
    const info = classifyAIError(error);
    expect(info.type).toBe('rate_limit');
    expect(info.retryable).toBe(true);
  });

  it('classifie un modèle introuvable (404)', () => {
    const error = Object.assign(new Error('model not found: claude-xyz'), { status: 404 });
    expect(classifyAIError(error).type).toBe('model_not_found');
  });

  it('classifie overloaded (529)', () => {
    const error = Object.assign(new Error('overloaded_error'), { status: 529 });
    const info = classifyAIError(error);
    expect(info.type).toBe('overloaded');
    expect(info.retryable).toBe(true);
  });

  it('classifie timeout', () => {
    const info = classifyAIError(new Error('Operation timed out after 60000ms'));
    expect(info.type).toBe('timeout');
    expect(info.retryable).toBe(true);
  });

  it('classifie content_filter', () => {
    expect(classifyAIError(new Error('content_policy violation')).type).toBe('content_filter');
  });

  it('classifie invalid_request (400 sans billing)', () => {
    const error = Object.assign(new Error('invalid_request_error: malformed payload'), {
      status: 400,
    });
    expect(classifyAIError(error).type).toBe('invalid_request');
  });

  it('classifie les erreurs réseau', () => {
    expect(classifyAIError(new Error('ECONNRESET')).type).toBe('network');
    expect(classifyAIError(new Error('fetch failed')).type).toBe('network');
  });

  it('classifie 5xx générique comme overloaded', () => {
    const error = Object.assign(new Error('internal server error'), { status: 500 });
    expect(classifyAIError(error).type).toBe('overloaded');
  });

  it('préserve le technicalDetail pour le debug', () => {
    const raw = 'Detailed error with request_id req_abc123';
    const info = classifyAIError(new Error(raw));
    expect(info.technicalDetail).toBe(raw);
  });
});

describe('formatAIErrorResponse', () => {
  it('retourne une réponse structurée avec les champs attendus', () => {
    const error = new Error('Your credit balance is too low');
    const response = formatAIErrorResponse(error);

    expect(response.status).toBe(402);
    expect(response.body.errorType).toBe('credit_exhausted');
    expect(response.body.message).toMatch(/crédit/i);
    expect(response.body.retryable).toBe(false);
    expect(response.body.technicalDetail).toBeTruthy();
  });
});
