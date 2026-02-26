/**
 * Centralized Supabase client for storelink-web.
 * Use createServerClient() in Server Components / Route Handlers.
 * Use createBrowserClient() in Client Components (or pass from server).
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createServerClient() {
  return createClient(url, anonKey);
}

export function createBrowserClient() {
  return createClient(url, anonKey);
}
