'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, LogOut, RotateCcw } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import StoreLinkLogo from '@/components/ui/StoreLinkLogo';
import {
  accountLockSubtitle,
  accountLockTitle,
  isAccountAccessLocked,
  isAccountBanned,
  isAccountDisabled,
} from '@/lib/accountAccess';

type ProfileLockRow = {
  account_status: string | null;
  suspension_reason: string | null;
  disabled_by: string | null;
  scheduled_deletion_at: string | null;
};

export default function DisabledPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [profile, setProfile] = useState<ProfileLockRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [reactivating, setReactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user?.id) {
        if (!cancelled) router.replace('/auth/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('account_status, suspension_reason, disabled_by, scheduled_deletion_at')
        .eq('id', auth.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (!isAccountAccessLocked(data?.account_status)) {
        router.replace('/app');
        return;
      }
      if (isAccountBanned(data?.account_status)) {
        router.replace('/auth/banned');
        return;
      }
      if (!isAccountDisabled(data?.account_status)) {
        router.replace('/auth/suspended');
        return;
      }

      setProfile(data as ProfileLockRow);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  const canSelfReactivate = String(profile?.disabled_by || '').toLowerCase() === 'user';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  };

  const handleReactivate = async () => {
    setReactivating(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('reactivate_my_disabled_account');
      if (rpcError) throw rpcError;
      const payload = data as { ok?: boolean } | null;
      if (!payload?.ok) throw new Error('Could not reactivate account.');
      router.replace('/app');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not reactivate account.');
    } finally {
      setReactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-(--background) text-(--muted) text-sm">
        Checking account status…
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-(--background) px-4 py-10 text-(--foreground)">
      <div className="mx-auto mb-8 flex w-full max-w-md justify-center">
        <StoreLinkLogo variant="auth" />
      </div>
      <div className="mx-auto w-full max-w-md rounded-3xl border border-(--border) bg-(--card) p-6 shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <Ban className="h-8 w-8 text-red-600" strokeWidth={1.75} />
        </div>

        <h1 className="text-center text-2xl font-black tracking-tight">
          {accountLockTitle('disabled')}
        </h1>
        <p className="mt-2 text-center text-sm text-(--muted)">{accountLockSubtitle('disabled')}</p>

        <div className="mt-6 space-y-3 rounded-2xl border border-(--border) bg-(--surface) p-4 text-sm">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] font-black tracking-widest text-(--muted)">STATUS</span>
            <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] font-black tracking-wide text-red-600">
              DISABLED
            </span>
          </div>
          <div className="h-px bg-(--border)" />
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] font-black tracking-widest text-(--muted)">REASON</span>
            <span className="max-w-[65%] text-right font-semibold">
              {profile?.suspension_reason ||
                (canSelfReactivate ? 'Disabled by you' : 'Disabled by StoreLink')}
            </span>
          </div>
          {profile?.scheduled_deletion_at ? (
            <>
              <div className="h-px bg-(--border)" />
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] font-black tracking-widest text-(--muted)">DELETION</span>
                <span className="font-semibold">
                  {new Date(profile.scheduled_deletion_at).toLocaleDateString()}
                </span>
              </div>
            </>
          ) : null}
        </div>

        {error ? <p className="mt-4 text-center text-sm text-red-500">{error}</p> : null}

        <div className="mt-6 space-y-3">
          {canSelfReactivate ? (
            <button
              type="button"
              onClick={() => void handleReactivate()}
              disabled={reactivating}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-(--foreground) px-4 py-3 text-sm font-black text-(--background) disabled:opacity-50"
            >
              <RotateCcw size={16} />
              {reactivating ? 'Reactivating…' : 'Reactivate account'}
            </button>
          ) : (
            <p className="rounded-2xl border border-(--border) bg-(--surface) p-4 text-center text-sm text-(--muted)">
              This account was disabled by StoreLink Trust & Safety. There is no self-reactivation.
              Contact support if you believe this was a mistake.
            </p>
          )}
          <a
            href="https://storelink.ng/guidelines"
            target="_blank"
            rel="noreferrer"
            className="block w-full rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 text-center text-sm font-black"
          >
            Review guidelines
          </a>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-red-600"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
