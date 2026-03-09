/**
 * Supabase Client Singleton
 *
 * Used for Supabase Storage (images).
 * Storage operations are delegated to @kairn/core/storage.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare global {
  // eslint-disable-next-line no-var
  var __psypnosSupabase: SupabaseClient | undefined;
}

/** Creates a Supabase client for storage operations */
function createSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(
      'Supabase credentials not configured. Image storage will fall back to local filesystem.'
    );
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (error) {
    console.warn(
      'Failed to create Supabase client:',
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

// Use global instance in development to prevent too many connections during hot reloading
const supabase = globalThis.__psypnosSupabase ?? createSupabaseClient();

if (process.env.NODE_ENV !== 'production' && supabase) {
  globalThis.__psypnosSupabase = supabase;
}

export { supabase };
export default supabase;

// Helper to check if Supabase Storage is configured
export function isSupabaseStorageConfigured(): boolean {
  return supabase !== null;
}
