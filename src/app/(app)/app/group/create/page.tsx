'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createBrowserClient } from '@/lib/supabase';
import { createGroupChat, groupMemberCapForHost } from '@/lib/groupChatApi';

export default function CreateGroupPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [memberCap, setMemberCap] = useState(50);

  useEffect(() => {
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_expiry')
        .eq('id', uid)
        .maybeSingle();
      setMemberCap(groupMemberCapForHost(data));
    })();
  }, [supabase]);

  const onCreate = async () => {
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      toast.error('Give your community a short name (2+ characters).');
      return;
    }
    setSubmitting(true);
    try {
      const groupId = await createGroupChat(supabase, {
        title: trimmed,
        description: description.trim() || undefined,
        memberCap,
      });
      router.replace(`/app/group/invite?groupId=${encodeURIComponent(groupId)}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not create community.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-(--border) bg-(--background)/95 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/app/seller/communities"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface)"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">New community</h1>
        <div className="w-11" />
      </header>

      <div className="mx-auto mt-6 max-w-lg space-y-4 px-4">
        <label className="block">
          <span className="text-[11px] font-black uppercase tracking-wide text-(--muted)">Name</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="e.g. VIP Drop Alerts"
            className="mt-1 h-12 w-full rounded-xl border border-(--border) bg-(--surface) px-3 text-sm text-(--foreground) outline-none"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-black uppercase tracking-wide text-(--muted)">Description (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={240}
            placeholder="Who this group is for"
            className="mt-1 h-28 w-full rounded-xl border border-(--border) bg-(--surface) p-3 text-sm text-(--foreground) outline-none"
          />
        </label>
        <p className="text-xs text-(--muted)">Member cap for your plan: {memberCap}.</p>
        <button
          type="button"
          disabled={submitting}
          onClick={() => void onCreate()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white disabled:opacity-50"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          {submitting ? 'Creating…' : 'Create & invite'}
        </button>
      </div>
    </div>
  );
}
