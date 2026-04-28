import { createServerClient as createSsrServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function createServerClient() {
  const cookieStore = await cookies();
  return createSsrServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return typeof (cookieStore as any)?.getAll === 'function' ? (cookieStore as any).getAll() : [];
      },
      setAll(cookiesToSet) {
        try {
          if (typeof (cookieStore as any)?.set !== 'function') return;
          cookiesToSet.forEach(({ name, value, options }) => {
            (cookieStore as any).set(name, value, options);
          });
        } catch {
          // Server Components may not always allow setting cookies.
        }
      },
    },
  });
}
