/**
 * Centralized Supabase client for storelink-web.
 * Use createServerClient() in Server Components / Route Handlers.
 * Use createBrowserClient() in Client Components (or pass from server).
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
type SupabaseClientType = ReturnType<typeof createClient>;

declare global {
  // eslint-disable-next-line no-var
  var __storelink_supabase_browser_client__: SupabaseClientType | undefined;
}

export function createServerClient() {
  return createClient(url, anonKey);
}

export function createBrowserClient() {
  if (typeof window === 'undefined') {
    return createClient(url, anonKey);
  }
  if (!globalThis.__storelink_supabase_browser_client__) {
    globalThis.__storelink_supabase_browser_client__ = createClient(url, anonKey);
  }
  return globalThis.__storelink_supabase_browser_client__;
}
