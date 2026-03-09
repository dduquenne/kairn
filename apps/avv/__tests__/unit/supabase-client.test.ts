/**
 * Tests unitaires pour le client Supabase singleton.
 *
 * Vérifie que :
 * - Le client accepte SUPABASE_SERVICE_KEY (nom principal)
 * - Le client accepte SUPABASE_SERVICE_ROLE_KEY (nom legacy)
 * - Le client retourne null si aucune variable n'est définie
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mocks hoistés ──────────────────────────────────────────────

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
  SupabaseClient: class {},
}));

// ─── Tests ──────────────────────────────────────────────────────

describe('supabase/client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    // Supprimer le singleton global
    delete (globalThis as Record<string, unknown>).supabase;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('utilise SUPABASE_SERVICE_KEY en priorité', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'service-key-value';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'role-key-value';

    const fakeClient = { storage: {} };
    mockCreateClient.mockReturnValue(fakeClient);

    const { supabase } = await import('../../lib/supabase/client');

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'service-key-value',
      expect.any(Object)
    );
    expect(supabase).toBe(fakeClient);
  });

  it('utilise SUPABASE_SERVICE_ROLE_KEY en fallback', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.SUPABASE_SERVICE_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'role-key-value';

    const fakeClient = { storage: {} };
    mockCreateClient.mockReturnValue(fakeClient);

    const { supabase } = await import('../../lib/supabase/client');

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'role-key-value',
      expect.any(Object)
    );
    expect(supabase).toBe(fakeClient);
  });

  it("retourne null si aucune clé n'est définie", async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { supabase } = await import('../../lib/supabase/client');

    expect(supabase).toBeNull();
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('isSupabaseStorageConfigured retourne true quand configuré', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'key';

    const fakeClient = { storage: {} };
    mockCreateClient.mockReturnValue(fakeClient);

    const { isSupabaseStorageConfigured } = await import('../../lib/supabase/client');

    expect(isSupabaseStorageConfigured()).toBe(true);
  });

  it('isSupabaseStorageConfigured retourne false sans config', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { isSupabaseStorageConfigured } = await import('../../lib/supabase/client');

    expect(isSupabaseStorageConfigured()).toBe(false);
  });
});
