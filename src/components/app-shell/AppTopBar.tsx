'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, LayoutDashboard, PlusSquare } from 'lucide-react';
import { useAppShellProfile } from '@/components/app-shell/app-shell-profile';

export default function AppTopBar() {
  const pathname = usePathname();
  const centerLabel = getCenterLabel(pathname);
  const { isSeller, unreadNotifications } = useAppShellProfile();

  return (
    <header className="sticky top-0 z-30 border-b border-(--border) bg-(--background)/90 backdrop-blur-xl">
      <div className="relative mx-auto h-20 w-full max-w-[1600px] px-4 lg:px-8 flex items-center justify-between">
        <Link href="/app" className="inline-flex items-center gap-2.5" aria-label="StoreLink NG home">
          <div className="w-12 h-12 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <LayoutDashboard size={24} />
          </div>
          <div className="leading-tight flex items-end gap-2">
            <p className="text-xl lg:text-2xl font-black tracking-tight text-(--foreground)">StoreLink</p>
            <span className="mb-1 inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-black tracking-[0.16em] text-emerald-700">
              NG
            </span>
          </div>
        </Link>
        <div className="pointer-events-none absolute inset-x-0 hidden lg:flex flex-col items-center justify-center text-center">
          <p className="text-base font-black tracking-tight text-(--foreground)">{centerLabel.title}</p>
          {centerLabel.subtitle ? <p className="text-xs text-(--muted) mt-0.5">{centerLabel.subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href={isSeller ? '/app/post' : '/app/seller/become'}
            aria-label="Post"
            className="w-12 h-12 rounded-2xl border border-(--border) bg-(--surface) text-(--foreground) flex items-center justify-center"
          >
            <PlusSquare size={24} />
          </Link>
          <Link
            href="/app/activity"
            aria-label="Activity"
            className="relative w-12 h-12 rounded-2xl border border-(--border) bg-(--surface) text-(--foreground) flex items-center justify-center"
          >
            <Bell size={24} />
            {unreadNotifications > 0 ? (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-500" />
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}

function getCenterLabel(pathname: string | null) {
  if (!pathname) return { title: 'StoreLink App', subtitle: '' };
  if (pathname === '/app') return { title: 'Home Feed', subtitle: 'Your app home surface on web' };
  if (pathname.startsWith('/app/explore')) return { title: 'Explore', subtitle: 'Discovery, For You, Spotlight' };
  if (pathname.startsWith('/app/search')) return { title: 'Search', subtitle: 'Find sellers and products' };
  if (pathname.startsWith('/app/messages')) return { title: 'Messages', subtitle: '' };
  if (pathname.startsWith('/app/story-viewer')) return { title: 'Stories', subtitle: '' };
  if (pathname.startsWith('/app/activity')) return { title: 'Activity', subtitle: '' };
  if (pathname.startsWith('/app/notifications')) return { title: 'Activity', subtitle: '' };
  if (pathname.startsWith('/app/post')) return { title: 'Post', subtitle: 'Product, service, reel, story, spotlight' };
  if (pathname.startsWith('/app/seller/post-product')) return { title: 'Post Product', subtitle: '' };
  if (pathname.startsWith('/app/seller/post-service')) return { title: 'Post Service', subtitle: '' };
  if (pathname.startsWith('/app/seller/post-reel')) return { title: 'Post Reel', subtitle: '' };
  if (pathname.startsWith('/app/seller/post-story')) return { title: 'Post Story', subtitle: '' };
  if (pathname.startsWith('/app/spotlight/post')) return { title: 'Post Spotlight', subtitle: '' };
  if (pathname.startsWith('/app/profile')) return { title: 'Profile', subtitle: '' };
  if (pathname.startsWith('/app/orders')) return { title: 'Orders', subtitle: '' };
  if (pathname.startsWith('/app/bookings')) return { title: 'Bookings', subtitle: '' };
  if (pathname.startsWith('/app/wishlist')) return { title: 'Wishlist', subtitle: '' };
  return { title: 'StoreLink App', subtitle: '' };
}

