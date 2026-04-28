'use client';

import Link from 'next/link';
import { Gem, Menu, Users } from 'lucide-react';

type WebProfileNavBarProps = {
  slug: string;
  isDiamond?: boolean;
  showOfflineBadge?: boolean;
  /** Left “suggestions” affordance — mobile `/profile/suggestions`. */
  suggestionsHref?: string;
  /** When false, no right control (e.g. app shell / desktop). */
  showRightMenu?: boolean;
  onMenuPress?: () => void;
};

/**
 * Mirrors mobile personal profile top bar: suggestions · @slug · menu.
 * Hidden on `lg+`: slug and “Profile” title live in `AppTopBar`; hub menu is in `LeftRail` → More.
 */
export default function WebProfileNavBar({
  slug,
  isDiamond,
  showOfflineBadge,
  suggestionsHref = '/app/search',
  showRightMenu = true,
  onMenuPress,
}: WebProfileNavBarProps) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-(--border) bg-(--background)/95 px-2 py-3 backdrop-blur-md lg:hidden">
      <Link
        href={suggestionsHref}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-(--foreground) hover:bg-(--surface)"
        aria-label="Find people to follow"
      >
        <Users size={22} strokeWidth={2.2} />
      </Link>

      <div className="flex min-w-0 max-w-[60%] items-center justify-center gap-1.5">
        <span className="font-app-profile-slug max-w-full truncate text-(--foreground)">@{slug || 'user'}</span>
        {isDiamond ? <Gem size={13} className="shrink-0 text-violet-500" fill="currentColor" /> : null}
        {showOfflineBadge ? (
          <span className="shrink-0 rounded-lg border border-(--border) bg-(--surface) px-2 py-0.5 text-[9px] font-black tracking-widest text-(--muted)">
            OFFLINE
          </span>
        ) : null}
      </div>

      <div className="flex h-11 w-11 shrink-0 items-center justify-center">
        {showRightMenu ? (
          <>
            <button
              type="button"
              onClick={onMenuPress}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-(--foreground) hover:bg-(--surface)"
              aria-label="Open menu"
            >
              <Menu size={22} strokeWidth={2.2} />
            </button>
          </>
        ) : (
          <span className="h-11 w-11" aria-hidden />
        )}
      </div>
    </div>
  );
}
