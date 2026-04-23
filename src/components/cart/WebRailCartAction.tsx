'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarClock, ShoppingBag, Trash2, X } from 'lucide-react';
import { useWebCartStore } from '@/store/useWebCartStore';

const money = (amount: number, currency = 'NGN') =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(Number(amount || 0));

export default function WebRailCartAction() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'products' | 'services'>('products');
  const {
    products,
    services,
    removeProduct,
    removeService,
    clearProducts,
    clearServices,
    productCount,
    serviceCount,
    totalCount,
  } = useWebCartStore();

  const total = totalCount();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Cart"
        className="inline-flex items-center justify-center group-hover:justify-start gap-3 rounded-2xl px-3 py-2.5 text-slate-700 dark:text-slate-200 hover:text-emerald-600 hover:bg-(--surface)"
      >
        <div className="relative w-10 h-10 rounded-xl border border-(--border) bg-(--surface) flex items-center justify-center shrink-0">
          <ShoppingBag size={24} />
          {total > 0 ? (
            <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-emerald-500 px-1 py-0.5 text-[10px] font-black text-white">
              {total > 99 ? '99+' : total}
            </span>
          ) : null}
        </div>
        <span className="hidden group-hover:inline text-base font-bold whitespace-nowrap text-(--foreground)">Cart</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-120 bg-black/45 backdrop-blur-[2px] p-3 sm:p-5" onClick={() => setOpen(false)}>
          <div
            className="mx-auto mt-10 w-full max-w-xl rounded-3xl border border-(--border) bg-(--background) shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-(--border) px-4 py-3">
              <p className="text-sm font-black tracking-wide text-(--foreground)">YOUR CART</p>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-(--border) p-1.5 text-(--foreground)">
                <X size={16} />
              </button>
            </div>

            <div className="px-4 pt-3">
              <div className="flex rounded-full border border-(--border) bg-(--surface) p-1">
                <button type="button" onClick={() => setTab('products')} className={`h-9 flex-1 rounded-full text-xs font-black tracking-wide ${tab === 'products' ? 'bg-(--foreground) text-(--background)' : 'text-(--foreground)'}`}>
                  PRODUCTS ({productCount()})
                </button>
                <button type="button" onClick={() => setTab('services')} className={`h-9 flex-1 rounded-full text-xs font-black tracking-wide ${tab === 'services' ? 'bg-(--foreground) text-(--background)' : 'text-(--foreground)'}`}>
                  SERVICES ({serviceCount()})
                </button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-4">
              {tab === 'products' ? (
                products.length === 0 ? (
                  <p className="py-12 text-center text-sm font-semibold text-(--muted)">No products yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {products.map((p) => (
                      <div key={p.product_id} className="rounded-2xl border border-(--border) bg-(--surface) p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-black text-(--foreground)">{String(p.name || 'Product').toUpperCase()}</p>
                            <p className="mt-1 text-xs font-semibold text-(--muted)">
                              {money(p.price, p.currency_code)} x {p.quantity}
                            </p>
                          </div>
                          <button type="button" onClick={() => removeProduct(p.product_id)} className="inline-flex items-center gap-1 rounded-lg border border-(--border) px-2 py-1 text-xs font-bold text-(--foreground)">
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={clearProducts} className="mt-1 w-full rounded-xl border border-(--border) bg-(--background) py-2 text-xs font-black text-(--muted)">
                      CLEAR PRODUCTS
                    </button>
                  </div>
                )
              ) : services.length === 0 ? (
                <p className="py-12 text-center text-sm font-semibold text-(--muted)">No services saved yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {services.map((s) => (
                    <div key={s.service_listing_id} className="rounded-2xl border border-(--border) bg-(--surface) p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black text-(--foreground)">{String(s.title || 'Service').toUpperCase()}</p>
                          <p className="mt-1 text-xs font-semibold text-(--muted)">From {money(s.hero_price, s.currency_code)}</p>
                        </div>
                        <button type="button" onClick={() => removeService(s.service_listing_id)} className="inline-flex items-center gap-1 rounded-lg border border-(--border) px-2 py-1 text-xs font-bold text-(--foreground)">
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                      {s.seller_slug ? (
                        <Link href={`/s/${s.seller_slug}/service/${s.service_listing_id}`} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-(--foreground) px-2.5 py-1.5 text-[11px] font-black text-(--background)">
                          <CalendarClock size={13} /> CHECK AVAILABILITY
                        </Link>
                      ) : null}
                    </div>
                  ))}
                  <button type="button" onClick={clearServices} className="mt-1 w-full rounded-xl border border-(--border) bg-(--background) py-2 text-xs font-black text-(--muted)">
                    CLEAR SERVICES
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

