'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, ShoppingBag, Tag, Wrench, X } from 'lucide-react';
import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import { formatCurrency } from '@/lib/activity-feed';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { getServiceListingHeroImage } from '@/lib/serviceListingMedia';

export type ChatProductPick = {
  id: string;
  name: string;
  price: number;
  slug?: string | null;
  image_urls?: string[] | null;
  currency_code?: string | null;
};

export type ChatServicePick = {
  id: string;
  title: string;
  slug?: string | null;
  service_category?: string | null;
  hero_price_min?: number | null;
  currency_code?: string | null;
  media?: unknown;
};

type ChatCommercePickerSheetProps = {
  open: boolean;
  sellerId: string;
  chatId?: string;
  initialTab?: 'product' | 'service';
  supabase: SupabaseClient;
  onClose: () => void;
  onSelectProduct: (product: ChatProductPick) => void;
  onSelectService: (service: ChatServicePick) => void;
};

export function ChatCommercePickerSheet({
  open,
  sellerId,
  chatId,
  initialTab = 'product',
  supabase,
  onClose,
  onSelectProduct,
  onSelectService,
}: ChatCommercePickerSheetProps) {
  const [tab, setTab] = useState<'product' | 'service'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [products, setProducts] = useState<ChatProductPick[]>([]);
  const [services, setServices] = useState<ChatServicePick[]>([]);

  const loadCatalog = useCallback(async () => {
    if (!sellerId) return;
    setLoading(true);
    setLoadError(false);
    try {
      const [productRes, serviceRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, price, slug, image_urls, currency_code')
          .eq('seller_id', sellerId)
          .eq('is_active', true)
          .gt('stock_quantity', 0)
          .order('created_at', { ascending: false })
          .limit(80),
        supabase
          .from('service_listings')
          .select('id, title, slug, service_category, hero_price_min, currency_code, media')
          .eq('seller_id', sellerId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(80),
      ]);
      if (productRes.error || serviceRes.error) {
        throw productRes.error ?? serviceRes.error;
      }
      setProducts((productRes.data ?? []) as ChatProductPick[]);
      setServices((serviceRes.data ?? []) as ChatServicePick[]);
      if ((productRes.data?.length ?? 0) === 0 && (serviceRes.data?.length ?? 0) > 0) {
        setTab('service');
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [sellerId, supabase]);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      void loadCatalog();
    }
  }, [open, initialTab, loadCatalog]);

  if (!open) return null;

  const data = tab === 'product' ? products : services;

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 max-h-[72vh] w-full max-w-lg overflow-hidden rounded-2xl border border-(--border) bg-(--card) shadow-2xl">
        <div className="flex items-center justify-between border-b border-(--border) px-4 py-3">
          <p className="text-sm font-black text-(--foreground)">Share listing</p>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-(--muted) hover:bg-(--surface)">
            <X size={20} />
          </button>
        </div>

        {chatId ? (
          <div className="border-b border-(--border) px-4 py-3">
            <Link
              href={`/app/chat/${encodeURIComponent(chatId)}/custom-offer`}
              onClick={onClose}
              className="flex w-full items-center gap-3 rounded-xl border border-(--border) bg-(--surface) px-3 py-2.5 text-left hover:bg-(--card)"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
                <Tag size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-(--foreground)">Custom offer</span>
                <span className="block text-xs text-(--muted)">Send a priced quote in this chat</span>
              </span>
            </Link>
          </div>
        ) : null}

        <div className="flex border-b border-(--border)">
          <button
            type="button"
            onClick={() => setTab('product')}
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold ${
              tab === 'product' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-(--muted)'
            }`}
          >
            <ShoppingBag size={16} />
            Products
          </button>
          <button
            type="button"
            onClick={() => setTab('service')}
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold ${
              tab === 'service' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-(--muted)'
            }`}
          >
            <Wrench size={16} />
            Services
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-(--muted)">
              <Loader2 size={18} className="animate-spin" />
              Loading listings…
            </div>
          ) : loadError ? (
            <div className="py-10 text-center">
              <p className="text-sm text-rose-500">Could not load listings.</p>
              <button type="button" onClick={() => void loadCatalog()} className="mt-2 text-sm font-bold text-emerald-600">
                Retry
              </button>
            </div>
          ) : data.length === 0 ? (
            <p className="py-10 text-center text-sm text-(--muted)">
              {tab === 'product' ? 'No active products in stock.' : 'No active services.'}
            </p>
          ) : tab === 'product' ? (
            <div className="space-y-2">
              {products.map((product) => {
                const img = normalizeWebMediaUrl(product.image_urls?.[0] || '');
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      onSelectProduct(product);
                      onClose();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-(--border) bg-(--surface) p-2 text-left hover:border-emerald-500/40"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-(--background)">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag size={18} className="text-emerald-600" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-(--foreground)">{product.name}</p>
                      <p className="text-xs font-semibold text-emerald-600">
                        {formatCurrency(product.price, product.currency_code || 'NGN')}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {services.map((service) => {
                const img = normalizeWebMediaUrl(getServiceListingHeroImage(service.media) || '');
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      onSelectService(service);
                      onClose();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-(--border) bg-(--surface) p-2 text-left hover:border-emerald-500/40"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-(--background)">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Wrench size={18} className="text-emerald-600" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-(--foreground)">{service.title}</p>
                      {service.hero_price_min != null ? (
                        <p className="text-xs font-semibold text-emerald-600">
                          From {formatCurrency(service.hero_price_min / 100, service.currency_code || 'NGN')}
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
