'use client';

import Link from 'next/link';
import { ChevronRight, LogOut, Moon, Smartphone, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

type ProfileHubMenuFooterProps = {
  onLogout: () => void | Promise<void>;
  loggingOut?: boolean;
  /** Invitation card above log out (profile hub on mobile web). */
  showDownloadInvite?: boolean;
  profileSlug?: string | null;
};

/**
 * Web shell extras under the shared profile hub links (not in the native app drawer).
 */
export default function ProfileHubMenuFooter({
  onLogout,
  loggingOut,
  showDownloadInvite,
  profileSlug,
}: ProfileHubMenuFooterProps) {
  const { theme, setTheme } = useTheme();
  const downloadHref =
    profileSlug && String(profileSlug).trim()
      ? `/download?intent=${encodeURIComponent(`/@${String(profileSlug).trim()}`)}`
      : '/download';

  return (
    <div className="mt-2 border-t border-(--border) pt-3">
      <button
        type="button"
        onClick={() => {
          const next = theme === 'dark' ? 'light' : 'dark';
          window.setTimeout(() => setTheme(next), 0);
        }}
        className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-(--surface)"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--surface)">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-(--foreground)">Change appearance</p>
          <p className="text-xs text-(--muted)">Switch between light and dark mode</p>
        </div>
        <ChevronRight size={14} className="shrink-0 text-(--muted)" />
      </button>

      {showDownloadInvite ? (
        <Link
          href={downloadHref}
          className="mt-3 flex items-center gap-3 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-3 text-left transition-colors hover:bg-emerald-500/15"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Smartphone size={20} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black tracking-tight text-(--foreground)">Download the app</p>
            <p className="text-xs font-medium leading-snug text-(--muted)">
              Get the full StoreLink experience—stories, checkout, and seller tools work best in the app.
            </p>
          </div>
          <ChevronRight size={16} className="shrink-0 text-emerald-700 dark:text-emerald-400" strokeWidth={2.5} />
        </Link>
      ) : null}

      <button
        type="button"
        onClick={() => void onLogout()}
        disabled={loggingOut}
        className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-(--surface) ${showDownloadInvite ? 'mt-3' : 'mt-1'}`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
          <LogOut size={18} className="text-red-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-(--foreground)">{loggingOut ? 'Signing out…' : 'Log out'}</p>
          <p className="text-xs text-(--muted)">Securely sign out of your account</p>
        </div>
        <ChevronRight size={14} className="shrink-0 text-(--muted)" />
      </button>
    </div>
  );
}
