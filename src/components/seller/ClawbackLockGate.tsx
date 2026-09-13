'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { isClawbackAllowedPath } from '@/lib/clawbackSupportRoutes';

/**
 * Sellers with an open clawback debt stay on repayment + support until the balance clears.
 * Matches mobile `_layout` clawback lock.
 */
export default function ClawbackLockGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const supabase = createBrowserClient();

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid || cancelled) return;

      const { data: profile } = await supabase.from('profiles').select('is_seller').eq('id', uid).maybeSingle();
      if (!profile?.is_seller || cancelled) return;

      const { data: openDebt, error: debtError } = await supabase.rpc('get_my_open_clawback_debt');
      if (cancelled) return;

      const allowed = isClawbackAllowedPath(pathname);
      const hasOpenDebt = Boolean(openDebt);
      if (debtError && process.env.NODE_ENV === 'development') {
        console.warn('clawback debt check failed', debtError.message);
      }

      if (hasOpenDebt && !allowed) {
        router.replace('/app/seller/clawback-due');
        return;
      }
      if (!hasOpenDebt && (pathname || '').startsWith('/app/seller/clawback-due')) {
        router.replace('/app');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
