'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, FileText, Headphones, MessageSquare } from 'lucide-react';
import { withDrawerParam } from '@/components/profile-web/profileHubPaths';

export default function AppHelpSupportPage() {
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const wrap = (href: string) => (fromDrawer ? withDrawerParam(href) : href);

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <div className="rounded-3xl border border-(--border) bg-(--card) p-6">
        <h1 className="text-2xl font-black text-(--foreground)">Help & support</h1>
        <p className="mt-2 text-sm text-(--muted)">Get support, track ticket progress, and review service policy guidance.</p>
      </div>

      <Link href={wrap('/app/activity/support-new')} className="flex items-center gap-3 rounded-2xl border border-(--border) bg-(--surface) p-4">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-(--card)">
          <MessageSquare size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-(--foreground)">Create support ticket</span>
          <span className="block text-xs text-(--muted)">Report payment, identity, technical, or general issues.</span>
        </span>
        <ChevronRight size={16} className="text-(--muted)" />
      </Link>

      <Link href={wrap('/app/activity/support-history')} className="flex items-center gap-3 rounded-2xl border border-(--border) bg-(--surface) p-4">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-(--card)">
          <Headphones size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-(--foreground)">Support history</span>
          <span className="block text-xs text-(--muted)">See all your tickets and responses.</span>
        </span>
        <ChevronRight size={16} className="text-(--muted)" />
      </Link>

      <Link href="/terms" className="flex items-center gap-3 rounded-2xl border border-(--border) bg-(--surface) p-4">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-(--card)">
          <FileText size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-(--foreground)">Service policies</span>
          <span className="block text-xs text-(--muted)">Booking, no-show, cancellation, and dispute policy reference.</span>
        </span>
        <ChevronRight size={16} className="text-(--muted)" />
      </Link>
    </div>
  );
}

