'use client';

import Link from 'next/link';
import { useState } from 'react';
import { X } from 'lucide-react';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { getFollowButtonLabel } from '@/lib/followButtonLabel';
import {
  formatSuggestionReason,
  type FollowSuggestionKind,
  type FollowSuggestionRow,
} from '@/lib/followSuggestions';

const RAIL_COPY: Record<FollowSuggestionKind, { title: string; sub: string }> = {
  store: {
    title: 'More stores for you',
    sub: 'Based on who you follow and similar categories',
  },
  buyer: {
    title: 'People you may know',
    sub: 'Buyers and collectors with similar interests',
  },
};

type WebProfileFollowSuggestionsRailProps = {
  suggestions: FollowSuggestionRow[];
  variant?: FollowSuggestionKind;
  followingIds: Set<string>;
  followerIds: Set<string>;
  busyId?: string | null;
  onDismiss: () => void;
  onToggleFollow: (row: FollowSuggestionRow) => void;
};

export default function WebProfileFollowSuggestionsRail({
  suggestions,
  variant = 'store',
  followingIds,
  followerIds,
  busyId,
  onDismiss,
  onToggleFollow,
}: WebProfileFollowSuggestionsRailProps) {
  const copy = RAIL_COPY[variant];
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (!suggestions.length) return null;

  return (
    <div className="mx-4 mb-4 rounded-2xl border border-(--border) bg-(--surface) py-3 pl-3">
      <div className="mb-2 flex items-start justify-between gap-2 pr-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-(--foreground)">{copy.title}</p>
          <p className="mt-0.5 text-xs leading-4 text-(--muted)">{copy.sub}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--border)/60 text-(--muted)"
          aria-label="Dismiss suggestions"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 pr-3">
        {suggestions.map((row) => {
          const isFollowing = followingIds.has(row.id);
          const followsMe = followerIds.has(row.id);
          const reason = formatSuggestionReason(row.suggestion_reason, variant);
          const href = row.slug ? `/app/profile/${encodeURIComponent(row.slug)}` : '#';
          const avatar = normalizeWebMediaUrl(row.logo_url || '');
          const busy = pendingId === row.id || busyId === row.id;
          return (
            <div
              key={row.id}
              className="flex w-[132px] shrink-0 flex-col items-center rounded-[14px] border border-(--border) bg-(--card) p-2"
            >
              <Link href={href} className="flex w-full flex-col items-center">
                <div className="h-14 w-14 overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <p className="mt-1.5 min-h-8 text-center text-[11px] font-bold leading-4 text-(--foreground) line-clamp-2">
                  {row.display_name || (variant === 'store' ? 'Store' : 'Member')}
                </p>
                <p className="mt-0.5 min-h-7 text-center text-[10px] leading-3.5 text-(--muted) line-clamp-2">
                  {reason || (row.category ? String(row.category).replace(/_/g, ' ') : ' ')}
                </p>
              </Link>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setPendingId(row.id);
                  void Promise.resolve(onToggleFollow(row)).finally(() => setPendingId(null));
                }}
                className={`mt-2 w-full rounded-[10px] border py-1 text-center text-[11px] font-bold disabled:opacity-50 ${
                  isFollowing
                    ? 'border-(--border) bg-transparent text-(--foreground)'
                    : 'border-(--foreground) bg-(--foreground) text-(--background)'
                }`}
              >
                {getFollowButtonLabel({ isFollowing, followsMe })}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
