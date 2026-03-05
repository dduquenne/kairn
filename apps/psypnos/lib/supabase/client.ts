/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Supabase Client Singleton
 * Used for Supabase Storage (images)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Declare global type for the Supabase client in development
declare global {
  // eslint-disable-next-line no-var
  var supabase: SupabaseClient | undefined;
}

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
const supabase = globalThis.supabase ?? createSupabaseClient();

if (process.env.NODE_ENV !== 'production' && supabase) {
  globalThis.supabase = supabase;
}

export { supabase };
export default supabase;

// Helper to check if Supabase Storage is configured
export function isSupabaseStorageConfigured(): boolean {
  return supabase !== null;
}
