'use client';

import Link from 'next/link';
import { ArrowRight, Download, Store } from 'lucide-react';
import { ICON_STROKE } from '@/lib/iconChrome';

/**
 * Become-seller handoff (mobile onboarding is camera/geo-heavy).
 * Designed CTA, not a stub.
 */
export default function AppBecomeSellerPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 pb-10">
      <div className="rounded-sl-2xl border border-(--border) bg-(--card) p-6 md:p-8">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600">
          <Store size={28} strokeWidth={ICON_STROKE.chrome} />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-(--foreground)">Become a seller</h1>
        <p className="mt-2 text-sm font-medium text-(--muted)">
          Open your shop on StoreLink: brand, what you sell, city, and phone. Full seller setup
          (shop pin, verification photos, and studio) is fastest in the mobile app.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-(--foreground)">
          <li className="flex gap-2">
            <span className="font-black text-emerald-600">1.</span>
            Create or sign in to your buyer account
          </li>
          <li className="flex gap-2">
            <span className="font-black text-emerald-600">2.</span>
            Finish storefront steps in the StoreLink app
          </li>
          <li className="flex gap-2">
            <span className="font-black text-emerald-600">3.</span>
            List products or services and get paid via escrow
          </li>
        </ul>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/download"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white"
          >
            <Download size={16} strokeWidth={ICON_STROKE.chromeActive} />
            Get the app
          </Link>
          <Link
            href="/app/profile"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-(--border) bg-(--surface) px-5 py-3 text-sm font-black text-(--foreground)"
          >
            Back to profile
            <ArrowRight size={16} strokeWidth={ICON_STROKE.chrome} />
          </Link>
        </div>
      </div>
      <p className="text-center text-xs text-(--muted)">
        Already selling? Open Seller tools from your profile hub on web after your shop is live.
      </p>
    </div>
  );
}
