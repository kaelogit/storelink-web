/**
 * Centralized Supabase client for storelink-web.
 * Use createBrowserClient() in Client Components (or pass from server).
 * NOTE: For cookie-aware server auth, use '@/lib/supabase-server'.
 */
import { createBrowserClient as createSsrBrowserClient, createServerClient as createSsrServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
type SupabaseClientType = ReturnType<typeof createClient>;

declare global {
  var __storelink_supabase_browser_client__: SupabaseClientType | undefined;
}

export function createServerClient() {
  // Cookie-agnostic server client. Safe to import anywhere.
  return createClient(url, anonKey);
}

export function createBrowserClient() {
  if (typeof window === 'undefined') {
    return createClient(url, anonKey);
  }
  if (!globalThis.__storelink_supabase_browser_client__) {
    globalThis.__storelink_supabase_browser_client__ = createSsrBrowserClient(url, anonKey);
  }
  return globalThis.__storelink_supabase_browser_client__;
}
