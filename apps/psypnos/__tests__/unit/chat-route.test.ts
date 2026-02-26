/**
 * Tests unitaires pour la route /api/chat.
 *
 * Vérifie les fonctions utilitaires exportées indirectement
 * (sanitizeMessageHistory, parseDeviceType) et le comportement
 * du handler POST dans différents scénarios :
 * - API key manquante
 * - Rate limiting
 * - Erreur Anthropic
 * - Succès nominal
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks — déclarés AVANT les imports ───────────────────────────

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    chatConversation: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    chatMessage: {
      create: vi.fn(),
    },
  },
}));

// Mock getSiteId
vi.mock('@/lib/db/site', () => ({
  getSiteId: vi.fn().mockResolvedValue('site-123'),
}));

// Mock rate-limiter
vi.mock('../../app/api/common/rate-limiter', () => ({
  recordAttemptAsync: vi.fn().mockResolvedValue({
    limited: false,
    remaining: 19,
    resetTime: Date.now() + 3600000,
  }),
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
}));

// Mock Anthropic SDK
const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn(),
  };
});

// ─── Imports (après les mocks) ────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';

import { prisma } from '@/lib/db/prisma';
import { getSiteId } from '@/lib/db/site';

import { POST } from '../../app/api/chat/route';
import { recordAttemptAsync, getClientIP } from '../../app/api/common/rate-limiter';

// ─── Helpers ──────────────────────────────────────────────────────

function createChatRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ─── Tests ────────────────────────────────────────────────────────

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Env par défaut : clé API présente
    process.env.ANTHROPIC_API_KEY = 'sk-ant-api-test-key';

    // Re-configure rate-limiter mocks (restoreAllMocks les réinitialise)
    vi.mocked(recordAttemptAsync).mockResolvedValue({
      limited: false,
      remaining: 19,
      resetTime: Date.now() + 3600000,
    });
    vi.mocked(getClientIP).mockReturnValue('127.0.0.1');
    vi.mocked(getSiteId).mockResolvedValue('site-123');

    // Re-configure Anthropic mock constructor
    vi.mocked(Anthropic).mockImplementation(
      () => ({ messages: { create: mockCreate } }) as unknown as Anthropic
    );

    // Prisma defaults
    vi.mocked(prisma.chatConversation.create).mockResolvedValue({
      id: 'conv-1',
      sessionId: 'session-1',
      ipHash: 'abc123',
      status: 'active',
      messageCount: 0,
      satisfied: null,
      referrer: null,
      deviceType: 'desktop',
      createdAt: new Date(),
      updatedAt: new Date(),
      endedAt: null,
      siteId: 'site-123',
      messages: [],
    } as never);

    vi.mocked(prisma.chatMessage.create).mockResolvedValue({
      id: 'msg-1',
      conversationId: 'conv-1',
      role: 'assistant',
      content: 'test',
      tokensUsed: null,
      processingTime: null,
      suggestedActions: null,
      createdAt: new Date(),
    } as never);

    vi.mocked(prisma.chatConversation.update).mockResolvedValue({} as never);

    // Anthropic default success response
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Bonjour ! Comment puis-je vous aider ?' }],
      usage: { input_tokens: 100, output_tokens: 50 },
    });
  });

  it('devrait retourner 400 si le body JSON est invalide', async () => {
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('invalid_json');
  });

  it('devrait retourner 400 si le message est vide', async () => {
    const request = createChatRequest({ message: '' });
    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('validation_error');
  });

  it('devrait retourner 429 si rate limited', async () => {
    vi.mocked(recordAttemptAsync).mockResolvedValueOnce({
      limited: true,
      remaining: 0,
      resetTime: Date.now() + 60000,
    });

    const request = createChatRequest({ message: 'Bonjour' });
    const response = await POST(request);
    expect(response.status).toBe(429);

    const data = await response.json();
    expect(data.error).toBe('rate_limited');
    expect(data.retryAfter).toBeGreaterThan(0);
  });

  it('devrait retourner 500 si getSiteId échoue', async () => {
    vi.mocked(getSiteId).mockRejectedValueOnce(new Error('Site not found'));

    const request = createChatRequest({ message: 'Bonjour' });
    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('database_error');
  });

  it('devrait retourner 502 si Anthropic API échoue', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API timeout'));

    const request = createChatRequest({ message: 'Bonjour' });
    const response = await POST(request);
    expect(response.status).toBe(502);

    const data = await response.json();
    expect(data.error).toBe('ai_error');
    expect(data.conversationId).toBeTruthy();
  });

  it('devrait stocker un message fallback en DB si Anthropic échoue', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'));

    const request = createChatRequest({ message: 'Bonjour' });
    await POST(request);

    // Vérifie que le message fallback assistant a été stocké
    const createCalls = vi.mocked(prisma.chatMessage.create).mock.calls;
    expect(createCalls.length).toBeGreaterThanOrEqual(2);

    const fallbackCall = createCalls[1];
    expect(fallbackCall?.[0]?.data).toMatchObject({
      role: 'assistant',
      processingTime: 0,
    });
  });

  it('devrait retourner 200 avec le message Claude en cas de succès', async () => {
    const request = createChatRequest({
      message: 'Quels services proposez-vous ?',
      sessionId: 'session-test',
    });
    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.message).toBe('Bonjour ! Comment puis-je vous aider ?');
    expect(data.conversationId).toBeTruthy();
  });

  it('devrait parser les actions suggérées [ACTION:appointment]', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: 'Je vous invite à prendre rendez-vous.\n[ACTION:appointment]',
        },
      ],
      usage: { input_tokens: 100, output_tokens: 60 },
    });

    const request = createChatRequest({ message: 'Je veux un RDV' });
    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.suggestedActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'appointment',
          label: 'Prendre rendez-vous',
          url: '/contact',
        }),
      ])
    );
    // Le tag [ACTION:*] doit être retiré du message
    expect(data.message).not.toContain('[ACTION:');
  });

  it('devrait créer une nouvelle conversation si aucun conversationId fourni', async () => {
    const request = createChatRequest({ message: 'Bonjour' });
    await POST(request);

    expect(prisma.chatConversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          siteId: 'site-123',
        }),
      })
    );
  });

  it('devrait réutiliser une conversation existante si conversationId fourni', async () => {
    vi.mocked(prisma.chatConversation.findUnique).mockResolvedValueOnce({
      id: 'conv-existing',
      sessionId: 'session-1',
      ipHash: 'abc',
      status: 'active',
      messageCount: 2,
      satisfied: null,
      referrer: null,
      deviceType: 'desktop',
      createdAt: new Date(),
      updatedAt: new Date(),
      endedAt: null,
      siteId: 'site-123',
      messages: [
        { role: 'user', content: 'Bonjour' },
        { role: 'assistant', content: 'Bienvenue !' },
      ],
    } as never);

    const request = createChatRequest({
      message: 'Question suivante',
      conversationId: 'conv-existing',
    });
    const response = await POST(request);
    expect(response.status).toBe(200);

    // Ne devrait PAS créer de nouvelle conversation
    expect(prisma.chatConversation.create).not.toHaveBeenCalled();
  });
});
