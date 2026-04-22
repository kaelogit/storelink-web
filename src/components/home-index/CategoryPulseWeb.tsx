'use client';

import { decodeCategorySelectionKey, PRODUCT_CATEGORIES, SERVICE_CATEGORIES } from './categoryUtils';

export default function CategoryPulseWeb({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (key: string) => void;
}) {
  const decoded = decodeCategorySelectionKey(active);
  const openSection =
    decoded.kind === 'productAny' || decoded.kind === 'product'
      ? 'product'
      : decoded.kind === 'servicesAny' || decoded.kind === 'services'
        ? 'services'
        : null;

  const primary = [
    { label: 'ALL', key: 'all' },
    { label: 'PRODUCT', key: 'product:any' },
    { label: 'SERVICES', key: 'services:any' },
  ];

  const leaves =
    openSection === 'product'
      ? [{ label: 'ALL PRODUCTS', key: 'product:any' }, ...PRODUCT_CATEGORIES.map((i) => ({ label: i.label.toUpperCase(), key: i.key }))]
      : openSection === 'services'
        ? [{ label: 'ALL SERVICES', key: 'services:any' }, ...SERVICE_CATEGORIES.map((i) => ({ label: i.label.toUpperCase(), key: i.key }))]
        : [];

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {primary.map((tab) => {
          const isActive =
            (tab.key === 'all' && decoded.kind === 'all') ||
            (tab.key === 'product:any' && (decoded.kind === 'productAny' || decoded.kind === 'product')) ||
            (tab.key === 'services:any' && (decoded.kind === 'servicesAny' || decoded.kind === 'services'));
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelect(tab.key)}
              className={`h-9 px-4 rounded-xl border text-xs font-bold tracking-wide whitespace-nowrap ${
                isActive ? 'bg-(--foreground) text-(--background) border-(--foreground)' : 'bg-(--surface) text-(--foreground) border-(--border)'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {openSection && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {leaves.map((leaf) => {
            const isActive = active === leaf.key;
            return (
              <button
                key={leaf.key}
                type="button"
                onClick={() => onSelect(leaf.key)}
                className={`h-8 px-3 rounded-xl border text-[11px] font-bold tracking-wide whitespace-nowrap ${
                  isActive ? 'bg-(--foreground) text-(--background) border-(--foreground)' : 'bg-(--surface) text-(--foreground) border-(--border)'
                }`}
              >
                {leaf.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

