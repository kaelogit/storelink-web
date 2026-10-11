'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { isAccountAccessLocked, accountLockRoute } from '@/lib/accountAccess';

const LOCK_ALLOWED_PREFIXES = [
  '/auth/suspended',
  '/auth/appeal',
  '/auth/disabled',
  '/auth/banned',
  '/auth/login',
];

function isLockAllowedPath(pathname: string | null): boolean {
  const p = pathname || '';
  return LOCK_ALLOWED_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

/**
 * Instagram-style lock: suspended / banned / pending_appeal / disabled cannot use the product.
 */
export default function AccountAccessLockGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const supabase = createBrowserClient();

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid || cancelled) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('account_status')
        .eq('id', uid)
        .maybeSingle();
      if (cancelled) return;

      const status = String(profile?.account_status || '').toLowerCase();
      const locked = isAccountAccessLocked(profile?.account_status);
      const route = accountLockRoute(profile?.account_status);

      if (locked && !isLockAllowedPath(pathname)) {
        router.replace(route);
        return;
      }

      // Keep each rung on its own screen (no appeal for disabled/banned).
      if (
        (status === 'disabled' &&
          ((pathname || '').startsWith('/auth/appeal') ||
            (pathname || '').startsWith('/auth/suspended') ||
            (pathname || '').startsWith('/auth/banned'))) ||
        (status === 'banned' &&
          ((pathname || '').startsWith('/auth/appeal') ||
            (pathname || '').startsWith('/auth/suspended') ||
            (pathname || '').startsWith('/auth/disabled')))
      ) {
        router.replace(route);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
