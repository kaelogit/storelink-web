'use client';

import Link from 'next/link';
import { Bell, PlusSquare } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAppShellProfile } from '@/components/app-shell/app-shell-profile';
import WebRailCartAction from '@/components/cart/WebRailCartAction';

export default function RightRail() {
  const { unreadNotifications } = useAppShellProfile();

  return (
    <aside className="hidden lg:block fixed right-0 top-20 bottom-0 z-20 border-l border-(--border) bg-(--card)/85 backdrop-blur-xl w-24 hover:w-64 transition-[width] duration-300 group">
      <div className="h-full p-3 flex flex-col gap-2">
        <RailAction
          href="/app/activity"
          label="Activity"
          icon={<Bell size={24} />}
          ariaLabel="Activity"
          showUnreadDot={unreadNotifications > 0}
        />
        <RailAction href="/app/post" label="Post" icon={<PlusSquare size={24} />} ariaLabel="Post" />
        <WebRailCartAction />
      </div>
    </aside>
  );
}

function RailAction({
  href,
  icon,
  label,
  ariaLabel,
  showUnreadDot,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  ariaLabel?: string;
  showUnreadDot?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel ?? label}
      className="inline-flex items-center justify-center group-hover:justify-start gap-3 rounded-2xl px-3 py-2.5 text-slate-700 dark:text-slate-200 hover:text-emerald-600 hover:bg-(--surface)"
    >
      <div className="relative w-10 h-10 rounded-xl border border-(--border) bg-(--surface) flex items-center justify-center shrink-0">
        {icon}
        {showUnreadDot ? (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-(--card)" aria-hidden />
        ) : null}
      </div>
      <span className="hidden group-hover:inline text-base font-bold whitespace-nowrap text-(--foreground)">{label}</span>
    </Link>
  );
}

