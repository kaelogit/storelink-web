'use client';

/**
 * One-shot retry for invite attribution if verify failed while the pending
 * code is still stashed (e.g. RPC was missing tables). Safe: set_my_referred_by
 * is idempotent and rejects accounts older than 72h.
 */
import { useEffect, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import {
  clearWebPendingReferralCode,
  peekWebPendingReferralCode,
} from '@/lib/pendingReferralCode';
import { getWebReferralDeviceSignal } from '@/lib/referralDeviceSignal';

export default function ReferralAttributionRetry() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    void (async () => {
      const code = peekWebPendingReferralCode();
      if (!code) return;

      const supabase = createBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      try {
        const signal = getWebReferralDeviceSignal();
        const { data } = await supabase.rpc('set_my_referred_by', {
          p_referral_code: code,
          p_device_fingerprint: signal.fingerprint,
          p_device_meta: signal.meta,
        });
        const result = (data || {}) as { ok?: boolean; reason?: string };
        if (
          result.ok ||
          result.reason === 'already_set' ||
          result.reason === 'invalid_code' ||
          result.reason === 'self' ||
          result.reason === 'not_new_account'
        ) {
          clearWebPendingReferralCode();
        }
      } catch {
        // Non-blocking; pending code kept for a later attempt within 72h.
      }
    })();
  }, []);

  return null;
}
