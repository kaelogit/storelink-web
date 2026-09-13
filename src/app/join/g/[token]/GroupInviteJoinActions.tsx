'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { createBrowserClient } from '@/lib/supabase';
import { guestSignInHref } from '@/lib/guestAppRoutes';
import { redeemGroupInviteLink } from '@/lib/groupChatApi';

export default function GroupInviteJoinActions({
  token,
  invalid,
  downloadHref,
  appHref,
}: {
  token: string;
  invalid: boolean;
  downloadHref: string;
  appHref: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [busy, setBusy] = useState(false);
  const loginHref = guestSignInHref(`/join/g/${encodeURIComponent(token)}`);

  const onJoinWeb = async () => {
    if (invalid) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user?.id) {
      router.push(loginHref);
      return;
    }
    setBusy(true);
    try {
      const result = await redeemGroupInviteLink(supabase, token);
      const groupId = result.group_id;
      if (groupId) {
        router.replace(`/app/group/${encodeURIComponent(groupId)}`);
        return;
      }
      toast.error('Could not open this community.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not join this community.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
      {!invalid ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void onJoinWeb()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continue on web
        </button>
      ) : (
        <Link
          href="/app"
          className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
        >
          Open StoreLink on web
        </Link>
      )}
      <a
        href={appHref}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
      >
        <Smartphone className="h-4 w-4" />
        Open in StoreLink app
      </a>
      <Link
        href={downloadHref}
        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
      >
        Get the app
      </Link>
      <p className="text-center text-xs font-medium text-slate-500">
        Signed-in members can join here. Guests will be asked to log in first.
      </p>
    </div>
  );
}
