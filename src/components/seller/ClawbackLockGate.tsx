'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { isClawbackAllowedPath } from '@/lib/clawbackSupportRoutes';

/**
 * Sellers with an open clawback debt stay on repayment + support until the balance clears.
 * Fail-closed: RPC errors are treated as may-have-debt (matches mobile).
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
      // Fail closed: if debt check errors, keep seller in clawback flow until cleared.
      const hasOrMayHaveDebt = Boolean(openDebt) || Boolean(debtError);

      if (hasOrMayHaveDebt && !allowed) {
        router.replace('/app/seller/clawback-due');
        return;
      }
      if (!hasOrMayHaveDebt && (pathname || '').startsWith('/app/seller/clawback-due')) {
        router.replace('/app');
      }
      if (
        !hasOrMayHaveDebt &&
        (pathname || '').startsWith('/app/seller/clawback-success')
      ) {
        router.replace('/app');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
