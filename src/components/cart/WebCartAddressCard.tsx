'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { ChevronDown, MapPin, Plus, X } from 'lucide-react';

export type WebCartSavedAddress = {
  id?: string;
  label?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone_contact?: string;
};

function formatAddressLine(addr: WebCartSavedAddress) {
  return `${addr.street_address}, ${addr.city}, ${addr.state || ''} ${addr.postal_code}, ${addr.country} \n📞 ${addr.phone_contact}`;
}

type Props = {
  sectionTitle: string;
  placeholder: string;
  tip: string;
  value: string;
  onChange: (next: string) => void;
  savedAddresses: WebCartSavedAddress[];
  selectedAddressId: string;
  onSelectSaved: (id: string, formatted: string) => void;
};

/**
 * Same interaction model as mobile cart: one field + chevron opens saved-address sheet;
 * new addresses via settings (profile shipping_details).
 */
export function WebCartAddressCard({
  sectionTitle,
  placeholder,
  tip,
  value,
  onChange,
  savedAddresses,
  selectedAddressId,
  onSelectSaved,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const pick = useCallback(
    (addr: WebCartSavedAddress, idx: number) => {
      const id = String(addr?.id || `addr-${idx}`);
      onSelectSaved(id, formatAddressLine(addr));
      setPickerOpen(false);
    },
    [onSelectSaved],
  );

  return (
    <div className="mb-4 rounded-2xl border border-(--border) bg-(--surface) p-3">
      <p className="text-[11px] font-black tracking-wide text-(--muted)">{sectionTitle}</p>
      <div className="mt-2 flex min-h-[56px] items-start gap-2 rounded-xl border border-(--border) bg-(--background) px-3 py-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-(--foreground)" strokeWidth={2.25} aria-hidden />
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="min-h-[48px] flex-1 resize-y bg-transparent text-[13px] font-medium leading-snug text-(--foreground) outline-none placeholder:text-(--muted)"
        />
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="mt-0.5 shrink-0 rounded-lg p-1.5 text-(--muted) hover:bg-(--surface) hover:text-(--foreground)"
          aria-label="Choose saved address"
        >
          <ChevronDown className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>
      </div>
      <p className="mt-2 text-[11px] font-semibold leading-snug text-(--muted)">
        {tip}{' '}
        <Link href="/app/settings" className="font-black text-emerald-600 hover:underline">
          Open settings
        </Link>
      </p>

      {pickerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="web-cart-address-picker-title"
        >
          <div className="flex max-h-[min(70vh,440px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-(--border) bg-(--background) shadow-xl">
            <div className="flex items-center justify-between border-b border-(--border) px-4 py-3">
              <p id="web-cart-address-picker-title" className="text-sm font-black text-(--foreground)">
                Select address
              </p>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded-lg p-1 text-(--muted) hover:bg-(--surface)"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {savedAddresses.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-(--muted)">No saved addresses yet.</p>
              ) : (
                <ul className="space-y-2">
                  {savedAddresses.map((addr, idx) => {
                    const id = String(addr?.id || `addr-${idx}`);
                    const isSelected = id === selectedAddressId;
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => pick(addr, idx)}
                          className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-500/10'
                              : 'border-(--border) bg-(--surface) hover:border-emerald-500/60'
                          }`}
                        >
                          <p className="text-xs font-black text-(--foreground)">{addr.label || 'Address'}</p>
                          <p className="mt-1 text-[12px] font-medium text-(--muted)">
                            {addr.street_address}, {addr.city}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="border-t border-(--border) p-3">
              <Link
                href="/app/settings"
                className="flex items-center justify-center gap-2 rounded-xl border border-(--border) py-3 text-xs font-black text-emerald-600 hover:bg-(--surface)"
                onClick={() => setPickerOpen(false)}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add new address in settings
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
