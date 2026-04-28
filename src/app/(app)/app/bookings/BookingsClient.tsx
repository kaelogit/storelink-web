'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarClock, RefreshCcw, User, Wand2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { normalizeWebMediaUrl } from '@/lib/media-url';

type Perspective = 'buyer' | 'seller';

type Booking = {
  id: string;
  created_at?: string | null;
  scheduled_at?: string | null;
  status?: string | null;
  amount_minor?: number | null;
  currency_code?: string | null;
  custom_description?: string | null;
  is_custom_quote?: boolean | null;
  service_listing?: { title?: string | null; currency_code?: string | null } | null;
  buyer?: { display_name?: string | null; slug?: string | null; logo_url?: string | null } | null;
  seller?: { display_name?: string | null; slug?: string | null; logo_url?: string | null } | null;
};

function money(v: number, c = 'NGN') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(Number(v || 0));
}

function formatWhen(scheduledAt?: string | null, createdAt?: string | null) {
  const source = scheduledAt || createdAt;
  if (!source) return 'N/A';
  try {
    return new Date(source).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return 'N/A';
  }
}

function statusMeta(status?: string | null) {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'requested':
      return { label: 'Pending confirmation', bg: 'bg-(--surface)', text: 'text-(--muted)' };
    case 'confirmed':
      return { label: 'Awaiting payment', bg: 'bg-amber-500/15', text: 'text-amber-600' };
    case 'paid':
      return { label: 'Paid in escrow', bg: 'bg-violet-500/10', text: 'text-violet-600' };
    case 'in_progress':
      return { label: 'In progress', bg: 'bg-emerald-500/10', text: 'text-emerald-600' };
    case 'completed':
      return { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-600' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'bg-red-500/10', text: 'text-red-500' };
    case 'disputed':
      return { label: 'In dispute', bg: 'bg-red-500/10', text: 'text-red-500' };
    case 'refunded':
      return { label: 'Refunded', bg: 'bg-red-500/10', text: 'text-red-500' };
    default:
      return { label: s || 'Unknown', bg: 'bg-(--surface)', text: 'text-(--muted)' };
  }
}

export default function BookingsClient() {
  const searchParams = useSearchParams();
  const initialPerspective: Perspective = searchParams.get('perspective') === 'seller' ? 'seller' : 'buyer';
  const [perspective, setPerspective] = useState<Perspective>(initialPerspective);
  const supabase = useMemo(() => createBrowserClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = useCallback(
    async (who: Perspective) => {
      if (!userId) return;
      const column = who === 'buyer' ? 'buyer_id' : 'seller_id';
      try {
        const { data, error } = await supabase
          .from('service_orders')
          .select(
            `
            *,
            service_listing:service_listing_id (title, currency_code),
            buyer:buyer_id (display_name, slug, logo_url),
            seller:seller_id (display_name, slug, logo_url)
          `,
          )
          .eq(column, userId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setBookings((data as Booking[]) || []);
      } catch (e) {
        if (process.env.NODE_ENV === 'development') console.error('Bookings fetch failed:', e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase, userId],
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    void loadBookings(perspective);
  }, [perspective, userId, loadBookings]);

  const headerTitle = perspective === 'buyer' ? 'My Bookings' : 'Service Bookings';

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 border-b border-(--border) bg-(--background)/95 px-4 pb-4 pt-3 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <Link href="/app" className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface) text-(--foreground)">
            <ArrowLeft size={24} strokeWidth={2.5} />
          </Link>
          <h1 className="text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">{headerTitle}</h1>
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              void loadBookings(perspective);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface) text-emerald-600"
          >
            <RefreshCcw size={20} className={refreshing ? 'animate-spin' : ''} strokeWidth={2.5} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPerspective('buyer')}
            className={`rounded-[12px] px-3 py-2.5 text-[11px] font-black tracking-[0.04em] ${perspective === 'buyer' ? 'bg-(--foreground) text-(--background)' : 'bg-(--surface) text-(--foreground)'}`}
          >
            Buyer
          </button>
          <button
            type="button"
            onClick={() => setPerspective('seller')}
            className={`rounded-[12px] px-3 py-2.5 text-[11px] font-black tracking-[0.04em] ${perspective === 'seller' ? 'bg-(--foreground) text-(--background)' : 'bg-(--surface) text-(--foreground)'}`}
          >
            Seller
          </button>
        </div>
      </header>

      <div className="space-y-3 px-4 pt-4">
        {loading ? (
          [0, 1, 2].map((k) => (
            <div key={k} className="animate-pulse overflow-hidden rounded-[24px] border border-(--border) bg-(--card) p-[16px]">
              <div className="flex items-center justify-between border-b border-(--surface) pb-[15px]">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-[16px] bg-(--border)" />
                  <div className="space-y-2">
                    <div className="h-3 w-32 rounded bg-(--border)" />
                    <div className="h-2.5 w-24 rounded bg-(--border)" />
                  </div>
                </div>
                <div className="h-6 w-24 rounded-[6px] bg-(--border)" />
              </div>
            </div>
          ))
        ) : bookings.length === 0 ? (
          <div className="mt-20 text-center">
            <p className="text-sm font-black text-(--foreground)">
              {perspective === 'buyer' ? 'No bookings yet' : 'No service bookings'}
            </p>
            <p className="mt-2 text-sm text-(--muted)">
              {perspective === 'buyer'
                ? 'When you request a service, your bookings will show up here.'
                : 'When buyers request your services, bookings will appear here.'}
            </p>
          </div>
        ) : (
          bookings.map((item) => {
            const counterpart = perspective === 'buyer' ? item.seller : item.buyer;
            const logo = normalizeWebMediaUrl(counterpart?.logo_url || '');
            const meta = statusMeta(item.status);
            const title = item.service_listing?.title || item.custom_description || 'Service booking';
            const amountMajor = (Number(item.amount_minor) || 0) / 100;
            const currency = item.currency_code || item.service_listing?.currency_code || 'NGN';
            return (
              <Link
                key={item.id}
                href={`/app/bookings/${item.id}`}
                className="block overflow-hidden rounded-[24px] border border-(--border) bg-(--card) p-[16px]"
              >
                <div className="flex items-start justify-between border-b border-(--surface) pb-[15px]">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-[16px] border border-(--border)">
                      {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : <User size={20} className="text-(--muted)" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-black text-(--foreground)">
                        {counterpart?.display_name || counterpart?.slug || 'User'}
                      </p>
                      <p className="truncate text-[11px] font-semibold text-(--muted)">{formatWhen(item.scheduled_at, item.created_at)}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-[6px] px-2 py-1 text-[10px] font-black tracking-[0.05em] ${meta.bg} ${meta.text}`}>
                    {meta.label}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="truncate text-[13px] font-black text-(--foreground)">{title}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] text-(--muted)">
                      <CalendarClock size={12} /> {String(item.status || '').toLowerCase().replace(/_/g, ' ')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[13px] font-black text-violet-600">
                      <Wand2 size={12} /> {money(amountMajor, currency)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
