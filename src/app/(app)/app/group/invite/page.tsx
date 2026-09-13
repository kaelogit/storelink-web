'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { createBrowserClient } from '@/lib/supabase';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { fetchGroupInviteCandidates, sendGroupInvites } from '@/lib/groupChatApi';

function GroupInviteInner() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const sp = useSearchParams();
  const groupId = String(sp.get('groupId') || '').trim();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<
    Array<{ id: string; display_name?: string | null; slug?: string | null; logo_url?: string | null }>
  >([]);
  const [seatsLeft, setSeatsLeft] = useState(50);
  const [memberCap, setMemberCap] = useState(50);

  const load = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id || null;
      if (!uid) return;

      const [{ data: group }, people, { count: memberCount }, { count: pendingCount }] = await Promise.all([
        supabase.from('group_chats').select('member_cap, host_seller_id').eq('id', groupId).maybeSingle(),
        fetchGroupInviteCandidates(supabase, uid),
        supabase
          .from('group_members')
          .select('user_id', { count: 'exact', head: true })
          .eq('group_id', groupId)
          .eq('status', 'active'),
        supabase
          .from('group_invites')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', groupId)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString()),
      ]);
      const cap = Number(group?.member_cap ?? 50);
      setMemberCap(cap);
      setSeatsLeft(Math.max(0, cap - (memberCount ?? 0) - (pendingCount ?? 0)));
      setCandidates(people);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not load invite list.');
    } finally {
      setLoading(false);
    }
  }, [groupId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (next.size >= seatsLeft) {
        toast.error(`Only ${seatsLeft} invite${seatsLeft === 1 ? '' : 's'} can be sent (cap ${memberCap}).`);
        return prev;
      }
      next.add(id);
      return next;
    });
  };

  const onSend = async () => {
    if (!groupId || selected.size === 0) return;
    setSending(true);
    try {
      const result = await sendGroupInvites(supabase, groupId, Array.from(selected));
      toast.success(
        `${result.invited ?? 0} invite${(result.invited ?? 0) === 1 ? '' : 's'} sent. They’ll appear in the group only after they accept.`,
      );
      router.replace(`/app/group/${groupId}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Invite failed.');
    } finally {
      setSending(false);
    }
  };

  if (!groupId) {
    return <p className="px-4 py-10 text-sm text-(--muted)">Missing community. Open invite from Communities.</p>;
  }

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-(--border) bg-(--background)/95 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/app/seller/communities"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface)"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">Invite members</h1>
        <div className="w-11" />
      </header>

      <p className="px-4 pt-4 text-sm text-(--muted)">
        {seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left · {selected.size} selected
      </p>

      <div className="mt-3 px-4">
        {loading ? (
          <p className="text-sm text-(--muted)">Loading followers…</p>
        ) : candidates.length === 0 ? (
          <div className="rounded-2xl border border-(--border) bg-(--surface) px-4 py-8 text-center">
            <Users size={28} className="mx-auto text-(--muted)" />
            <p className="mt-2 text-sm text-(--muted)">No followers to invite yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {candidates.map((person) => {
              const checked = selected.has(person.id);
              const avatar = normalizeWebMediaUrl(person.logo_url || '');
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => toggle(person.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left ${
                    checked ? 'border-emerald-500 bg-emerald-500/10' : 'border-(--border) bg-(--surface)'
                  }`}
                >
                  <div className="h-10 w-10 overflow-hidden rounded-xl border border-(--border) bg-(--card)">
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-(--foreground)">
                      {person.display_name || person.slug || 'Member'}
                    </p>
                    <p className="truncate text-xs text-(--muted)">@{person.slug || 'member'}</p>
                  </div>
                  {checked ? <Check size={16} className="text-emerald-600" /> : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-(--border) bg-(--background)/95 p-4">
        <button
          type="button"
          disabled={sending || selected.size === 0}
          onClick={() => void onSend()}
          className="mx-auto flex w-full max-w-lg items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white disabled:opacity-50"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : null}
          {sending ? 'Sending…' : `Send ${selected.size || ''} invite${selected.size === 1 ? '' : 's'}`.trim()}
        </button>
      </div>
    </div>
  );
}

export default function GroupInvitePage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-sm text-(--muted)">Loading…</p>}>
      <GroupInviteInner />
    </Suspense>
  );
}
