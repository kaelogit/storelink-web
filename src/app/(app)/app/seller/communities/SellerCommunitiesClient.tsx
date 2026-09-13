'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { createBrowserClient } from '@/lib/supabase';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import {
  canHostCommunities,
  fetchMyGroupsInbox,
  type GroupInboxRow,
} from '@/lib/groupChatApi';

export default function SellerCommunitiesClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hostEligible, setHostEligible] = useState(false);
  const [groups, setGroups] = useState<GroupInboxRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id || null;
      if (!uid) {
        setGroups([]);
        setHostEligible(false);
        return;
      }
      const [{ data: profile }, inbox] = await Promise.all([
        supabase
          .from('profiles')
          .select('is_seller, verification_status, kyc_status')
          .eq('id', uid)
          .maybeSingle(),
        fetchMyGroupsInbox(supabase),
      ]);
      setHostEligible(canHostCommunities(profile));
      setGroups(
        inbox.filter((g) => g.host_seller_id === uid || g.my_role === 'host'),
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not load communities.');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const onCreate = () => {
    if (!hostEligible) {
      toast.error('Verified sellers with an active subscription can create communities.');
      return;
    }
    router.push('/app/group/create');
  };

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-(--border) bg-(--background)/95 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/app/seller/dashboard"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface)"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">Communities</h1>
        <button
          type="button"
          onClick={onCreate}
          className={`flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white ${hostEligible ? '' : 'opacity-45'}`}
          aria-label="Create community"
        >
          <Plus size={18} />
        </button>
      </header>

      <p className="px-4 pt-4 text-sm text-(--muted)">
        Invite followers to join — they accept before the group appears in their inbox.
      </p>

      <div className="mt-4 px-4">
        {loading ? (
          <p className="text-sm text-(--muted)">Loading communities…</p>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-(--border) bg-(--surface) px-4 py-10 text-center">
            <Users size={36} className="mx-auto text-(--muted)" />
            <p className="mt-3 text-sm font-black text-(--foreground)">No communities yet</p>
            <p className="mt-1 text-sm text-(--muted)">
              {hostEligible
                ? 'Create a group for VIP buyers, drop alerts, or restock hype — then send invites.'
                : 'Verified sellers with an active subscription can create communities.'}
            </p>
            {hostEligible ? (
              <button
                type="button"
                onClick={onCreate}
                className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white"
              >
                Create community
              </button>
            ) : null}
          </div>
        ) : (
          <div className="divide-y divide-(--border) overflow-hidden rounded-2xl border border-(--border) bg-(--card)">
            {groups.map((item) => {
              const avatar = normalizeWebMediaUrl(item.avatar_url || item.host_logo_url || '');
              return (
                <div key={item.group_id} className="flex items-center gap-3 px-3 py-3">
                  <Link href={`/app/group/${item.group_id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-(--border) bg-(--surface)">
                      {avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Users size={18} className="text-emerald-600" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-(--foreground)">{item.title}</p>
                      <p className="truncate text-xs text-(--muted)">
                        {item.member_count}/{item.member_cap ?? 50} members · {item.last_message || 'No messages yet'}
                      </p>
                    </div>
                  </Link>
                  <Link
                    href={`/app/group/invite?groupId=${encodeURIComponent(item.group_id)}`}
                    className="shrink-0 rounded-full border border-(--border) px-3 py-1.5 text-xs font-bold text-emerald-600"
                  >
                    Invite
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
