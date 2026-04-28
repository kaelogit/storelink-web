'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, RefreshCcw, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { withDrawerParam } from '@/components/profile-web/profileHubPaths';
import { normalizeWebMediaUrl } from '@/lib/media-url';

type ClientRow = {
  buyer_id: string;
  buyer_display_name: string | null;
  buyer_slug: string | null;
  buyer_logo_url: string | null;
  last_activity_at: string;
  product_orders_count: number;
  service_bookings_count: number;
  total_completed_count: number;
  total_spend_major: number;
};

export default function SellerClientsClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/seller/dashboard';

  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sellerType = profile?.seller_type as 'product' | 'service' | 'both' | undefined;
  const sellsProducts = !sellerType || sellerType === 'product' || sellerType === 'both';
  const offersServices = sellerType === 'service' || sellerType === 'both';
  const screenTitle = sellsProducts && offersServices ? 'Past Clients & Customers' : offersServices ? 'Past Clients' : 'Past Customers';

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setProfile(null);
        setRows([]);
        return;
      }

      const { data: profileRow } = await supabase.from('profiles').select('*').eq('id', uid).single();
      setProfile(profileRow || null);
      const localSellerType = (profileRow?.seller_type as 'product' | 'service' | 'both' | undefined) ?? undefined;
      const localSellsProducts = !localSellerType || localSellerType === 'product' || localSellerType === 'both';
      const localOffersServices = localSellerType === 'service' || localSellerType === 'both';

      type ProductOrderRow = { user_id: string | null; total_amount: number | null; updated_at: string | null; created_at: string | null };
      type ServiceBookingRow = { buyer_id: string | null; amount_minor: number | null; updated_at: string | null; created_at: string | null };

      const jobs: Array<PromiseLike<any>> = [];
      if (localSellsProducts) {
        jobs.push(
          supabase
            .from('orders')
            .select('user_id,total_amount,updated_at,created_at')
            .eq('seller_id', uid)
            .eq('status', 'COMPLETED'),
        );
      } else {
        jobs.push(Promise.resolve({ data: [] }));
      }
      if (localOffersServices) {
        jobs.push(
          supabase
            .from('service_orders')
            .select('buyer_id,amount_minor,updated_at,created_at')
            .eq('seller_id', uid)
            .eq('status', 'completed'),
        );
      } else {
        jobs.push(Promise.resolve({ data: [] }));
      }

      const [productRes, bookingRes] = await Promise.all(jobs);
      if (productRes.error) throw productRes.error;
      if (bookingRes.error) throw bookingRes.error;

      const productRows = (productRes.data || []) as ProductOrderRow[];
      const bookingRows = (bookingRes.data || []) as ServiceBookingRow[];
      const byBuyer = new Map<string, ClientRow>();

      const touch = (buyerId: string) => {
        const existing = byBuyer.get(buyerId);
        if (existing) return existing;
        const seed: ClientRow = {
          buyer_id: buyerId,
          buyer_display_name: null,
          buyer_slug: null,
          buyer_logo_url: null,
          last_activity_at: new Date(0).toISOString(),
          product_orders_count: 0,
          service_bookings_count: 0,
          total_completed_count: 0,
          total_spend_major: 0,
        };
        byBuyer.set(buyerId, seed);
        return seed;
      };

      for (const row of productRows) {
        const buyerId = String(row.user_id || '').trim();
        if (!buyerId) continue;
        const t = touch(buyerId);
        t.product_orders_count += 1;
        t.total_completed_count += 1;
        t.total_spend_major += Number(row.total_amount || 0);
        const ts = String(row.updated_at || row.created_at || '');
        if (ts && new Date(ts).getTime() > new Date(t.last_activity_at).getTime()) t.last_activity_at = ts;
      }

      for (const row of bookingRows) {
        const buyerId = String(row.buyer_id || '').trim();
        if (!buyerId) continue;
        const t = touch(buyerId);
        t.service_bookings_count += 1;
        t.total_completed_count += 1;
        t.total_spend_major += (Number(row.amount_minor || 0) || 0) / 100;
        const ts = String(row.updated_at || row.created_at || '');
        if (ts && new Date(ts).getTime() > new Date(t.last_activity_at).getTime()) t.last_activity_at = ts;
      }

      const buyerIds = Array.from(byBuyer.keys());
      if (buyerIds.length > 0) {
        const { data: profileRows, error: profileErr } = await supabase
          .from('profiles')
          .select('id,display_name,slug,logo_url')
          .in('id', buyerIds);
        if (profileErr) throw profileErr;
        for (const row of profileRows || []) {
          const key = String((row as any).id || '');
          const t = byBuyer.get(key);
          if (!t) continue;
          t.buyer_display_name = (row as any).display_name ?? null;
          t.buyer_slug = (row as any).slug ?? null;
          t.buyer_logo_url = (row as any).logo_url ?? null;
        }
      }

      setRows(Array.from(byBuyer.values()).sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()));
    } catch (e: any) {
      if (process.env.NODE_ENV === 'development') console.error('seller clients load error', e);
      setError(e?.message || 'Could not load past clients/customers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const currency = profile?.currency_code || 'NGN';
  const formatMoney = (amountMajor: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(Number(amountMajor || 0));

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 border-b border-(--border) bg-(--background)/95 px-4 pb-4 pt-3 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <Link href={backHref} className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface) text-(--foreground)">
            <ArrowLeft size={24} strokeWidth={2.5} />
          </Link>
          <h1 className="text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">{screenTitle}</h1>
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              void load();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface) text-emerald-600"
          >
            <RefreshCcw size={20} className={refreshing ? 'animate-spin' : ''} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <div className="space-y-3 px-4 pt-4">
        {loading ? (
          [0, 1, 2].map((k) => (
            <div key={k} className="animate-pulse rounded-[20px] border border-(--border) bg-(--card) p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-[12px] bg-(--border)" />
                <div className="space-y-2">
                  <div className="h-3 w-40 rounded bg-(--border)" />
                  <div className="h-2.5 w-56 rounded bg-(--border)" />
                </div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="rounded-[20px] border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-500">{error}</div>
        ) : rows.length === 0 ? (
          <div className="mt-20 text-center text-sm text-(--muted)">
            {sellsProducts && offersServices
              ? 'Completed orders and bookings will appear here so you can re-engage past clients and customers.'
              : offersServices
                ? 'When you start completing bookings, your past clients will appear here so you can re-engage them.'
                : 'When you start completing orders, your past customers will appear here so you can re-engage them.'}
          </div>
        ) : (
          rows.map((item) => {
            const fallbackNoun = offersServices ? 'Client' : 'Customer';
            const name = item.buyer_display_name || item.buyer_slug || fallbackNoun;
            const last = new Date(item.last_activity_at);
            const lastLabel = last.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const profileHref = item.buyer_slug && item.buyer_slug.trim() ? `/app/profile/${encodeURIComponent(item.buyer_slug.trim())}` : `/u/${item.buyer_id}`;
            const avatar = normalizeWebMediaUrl(item.buyer_logo_url || '');

            return (
              <Link key={item.buyer_id} href={fromDrawer ? withDrawerParam(profileHref) : profileHref} className="flex items-center gap-3 rounded-[20px] border border-(--border) bg-(--surface) p-4">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[12px] bg-(--background)">
                  {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <Users size={18} className="text-(--foreground)" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-black text-(--foreground)">{name}</p>
                  <p className="truncate text-[12px] text-(--muted)">
                    {item.total_completed_count} completed • {formatMoney(item.total_spend_major)}
                  </p>
                  <p className="truncate text-[11px] text-(--muted)">
                    {item.product_orders_count} order{item.product_orders_count !== 1 ? 's' : ''} • {item.service_bookings_count} booking
                    {item.service_bookings_count !== 1 ? 's' : ''} • Last activity {lastLabel}
                  </p>
                </div>
                <ChevronRight size={16} className="text-(--muted)" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
