'use client';

import {
  QUOTE_ZONE_ID,
  type DeliveryZone,
  type OutsideZonePolicy,
} from '@/lib/foodDeliveryZones';

function feeLabel(zone: DeliveryZone, currencyCode: string): string {
  if (zone.fee_minor <= 0) return 'Free';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currencyCode || 'NGN',
    minimumFractionDigits: 0,
  }).format(zone.fee_minor / 100);
}

export type WebDeliveryZonePickerProps = {
  zones: DeliveryZone[];
  selectedZoneId?: string | null;
  outsidePolicy?: OutsideZonePolicy;
  currencyCode?: string;
  onSelectZone: (zoneId: string) => void;
  onMessageSeller?: () => void;
  messageSellerLabel?: string;
};

/**
 * Buyer delivery-zone picker for web cart checkout.
 */
export function WebDeliveryZonePicker({
  zones,
  selectedZoneId,
  outsidePolicy = 'quote',
  currencyCode = 'NGN',
  onSelectZone,
  onMessageSeller,
  messageSellerLabel = 'Message seller',
}: WebDeliveryZonePickerProps) {
  if (!zones.length) return null;

  const isQuote = selectedZoneId === QUOTE_ZONE_ID;
  const allowQuote = outsidePolicy !== 'block';

  return (
    <div className="space-y-2">
      <div>
        <p className="text-[10px] font-black tracking-wide text-(--muted)">DELIVERY ZONE</p>
        <p className="mt-0.5 text-[11px] font-semibold text-(--muted)">Match your address</p>
      </div>
      <div className="flex flex-col gap-2">
        {zones.map((z) => {
          const on = selectedZoneId === z.id;
          return (
            <button
              key={z.id}
              type="button"
              onClick={() => onSelectZone(z.id)}
              className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                on
                  ? 'border-(--foreground) bg-(--surface)'
                  : 'border-(--border) bg-transparent hover:border-(--muted)'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-bold text-(--foreground)">{z.name}</span>
                <span className={`shrink-0 text-xs font-bold ${on ? 'text-emerald-600' : 'text-(--muted)'}`}>
                  {feeLabel(z, currencyCode)}
                </span>
              </div>
              {z.note ? (
                <p className="mt-0.5 truncate text-[11px] font-semibold text-(--muted)">{z.note}</p>
              ) : null}
            </button>
          );
        })}
        {allowQuote ? (
          <button
            type="button"
            onClick={() => onSelectZone(QUOTE_ZONE_ID)}
            className={`rounded-xl border border-dashed px-3 py-2.5 text-left ${
              isQuote
                ? 'border-(--foreground) bg-(--surface)'
                : 'border-(--border) bg-transparent hover:border-(--muted)'
            }`}
          >
            <span className="text-sm font-bold text-(--foreground)">Outside these zones</span>
            <p className="mt-0.5 text-[11px] font-semibold text-(--muted)">
              Message the seller for a custom quote
            </p>
            {isQuote && onMessageSeller ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMessageSeller();
                }}
                className="mt-2 text-xs font-black text-emerald-600"
              >
                {messageSellerLabel}
              </button>
            ) : null}
          </button>
        ) : null}
      </div>
    </div>
  );
}
