'use client';

import { MapPin } from 'lucide-react';
import { ICON_STROKE } from '@/lib/iconChrome';

type Props = {
  label?: string | null;
  address?: string | null;
  linkedOrderHint?: string | null;
};

/** Mobile location-share card chrome for chat bubbles. */
export function LocationShareCard({ label, address, linkedOrderHint }: Props) {
  return (
    <div className="max-w-[280px] overflow-hidden rounded-sl-xl border border-(--border) bg-(--card)">
      <div className="flex items-center gap-2 bg-emerald-600/10 px-3 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
          <MapPin size={16} strokeWidth={ICON_STROKE.chrome} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-(--foreground)">{label || 'Shared location'}</p>
          {linkedOrderHint ? (
            <p className="truncate text-[10px] font-semibold text-emerald-700">{linkedOrderHint}</p>
          ) : null}
        </div>
      </div>
      {address ? <p className="px-3 py-2 text-xs font-medium text-(--muted)">{address}</p> : null}
    </div>
  );
}
