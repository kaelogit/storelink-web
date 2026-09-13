'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useWhyThisAdStore } from '@/store/useWhyThisAdStore';
import {
  countryLabel,
  hideAdCampaignForDay,
  hydrateHiddenAdCampaigns,
} from '@/lib/adWhyThis';

/** AD-22: global host for “Why this ad?” — mount once under the app shell. */
export default function WhyThisAdHost() {
  const open = useWhyThisAdStore((s) => s.open);
  const payload = useWhyThisAdStore((s) => s.payload);
  const close = useWhyThisAdStore((s) => s.close);
  const bumpHidden = useWhyThisAdStore((s) => s.bumpHidden);

  useEffect(() => {
    void hydrateHiddenAdCampaigns();
  }, []);

  if (!open || !payload) return null;

  const advertiser =
    payload.advertiserName?.trim() || (payload.isHouse ? 'StoreLink' : 'a StoreLink shop');
  const country = countryLabel(payload.countryCode);
  const reason = payload.isHouse
    ? 'This is a StoreLink platform message (not a seller Boost).'
    : 'This shop paid to promote their listing or clip to more people in your area.';
  const placementLabel =
    payload.placement === 'explore_reel'
      ? 'Explore'
      : payload.placement === 'discover_tile'
        ? 'Discover'
        : 'Home';

  const onHide = async () => {
    await hideAdCampaignForDay(payload.campaignId);
    bumpHidden();
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close why this ad"
        className="absolute inset-0 bg-black/50"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="why-this-ad-title"
        className="relative z-10 mb-[max(1rem,env(safe-area-inset-bottom,0px))] w-full max-w-md rounded-t-2xl border border-(--border) bg-(--card) p-5 shadow-2xl sm:mb-0 sm:rounded-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="why-this-ad-title" className="text-base font-black text-(--foreground)">
            Why this ad?
          </h2>
          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full text-(--muted)"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-4 text-sm leading-5 text-(--muted)">{reason}</p>

        <div className="mb-5 space-y-2.5 rounded-xl border border-(--border) p-3">
          <MetaRow label="Advertiser" value={advertiser} />
          <MetaRow label="Country" value={country} />
          {payload.listingLabel ? <MetaRow label="Promoted" value={payload.listingLabel} /> : null}
          <MetaRow label="Placement" value={placementLabel} />
        </div>

        <button
          type="button"
          onClick={() => void onHide()}
          className="w-full rounded-xl bg-(--foreground) py-3 text-sm font-black text-(--background)"
        >
          Hide for 24 hours
        </button>
        <Link
          href="/help-center#boosting-and-ads"
          onClick={close}
          className="mt-2 block w-full py-2 text-center text-xs font-semibold text-(--muted)"
        >
          Learn more / report
        </Link>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-(--muted)">{label}</p>
      <p className="text-sm font-semibold text-(--foreground)">{value}</p>
    </div>
  );
}
