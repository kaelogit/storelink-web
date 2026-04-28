'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  Eye,
  Gem,
  Package,
  RefreshCw,
  Settings,
  ShoppingBag,
  Store,
  UserPlus,
  Wand2,
  Zap,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { countSellerManageOrdersExcludingServicePlaceholders } from '@/lib/sellerProductOrderBadgeCount';
import { getSellerPlanState } from '@/lib/sellerStatus';
import { withDrawerParam } from '@/components/profile-web/profileHubPaths';

type ProfileRow = Record<string, unknown> & {
  id?: string;
  is_seller?: boolean | null;
  seller_type?: string | null;
  currency_code?: string | null;
  subscription_plan?: string | null;
  loyalty_enabled?: boolean | null;
  loyalty_percentage?: number | null;
};

function differenceInCalendarDays(a: Date, b: Date): number {
  const ms = 86400000;
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((ua - ub) / ms);
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SalesDashboardClient() {
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const supabase = useMemo(() => createBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [stats, setStats] = useState({
    revenue: 0,
    productRevenue: 0,
    serviceRevenue: 0,
    productCount: 0,
    serviceCount: 0,
    totalListings: 0,
    activeOrders: 0,
    activeServiceBookings: 0,
    storeViewsThisWeek: 0,
  });

  const planState = getSellerPlanState(profile);
  const isDiamond = planState.plan === 'diamond';
  const isExpired = planState.isExpired && profile?.is_seller;
  const currency = (profile?.currency_code as string) || 'NGN';

  const sellerType = profile?.seller_type as 'product' | 'service' | 'both' | undefined;
  const sellsProducts = !sellerType || sellerType === 'product' || sellerType === 'both';
  const offersServices = sellerType === 'service' || sellerType === 'both';
  const loyaltyEnabled = profile?.loyalty_enabled === true;
  const loyaltyPercentage = Number(profile?.loyalty_percentage) || 0;
  const loyaltySubtitle = loyaltyEnabled
    ? `Loyalty is ON • ${loyaltyPercentage > 0 ? loyaltyPercentage : 1}% cashback`
    : 'Loyalty is OFF • Enable coin rewards';

  const fetchStoreData = useCallback(async () => {
    const uid = profile?.id != null ? String(profile.id) : null;
    if (!uid) return;
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const startDate = weekAgo.toISOString().split('T')[0];

      const [
        products,
        services,
        sales,
        completedServiceSales,
        active,
        activeServiceBookings,
        viewsRes,
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('seller_id', uid),
        supabase.from('service_listings').select('*', { count: 'exact', head: true }).eq('seller_id', uid),
        supabase.from('orders').select('total_amount').eq('seller_id', uid).eq('status', 'COMPLETED'),
        supabase
          .from('service_orders')
          .select('amount_minor')
          .eq('seller_id', uid)
          .eq('status', 'completed'),
        countSellerManageOrdersExcludingServicePlaceholders(supabase, uid).then((n) => ({ count: n })),
        supabase
          .from('service_orders')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', uid)
          .in('status', ['requested', 'confirmed', 'paid', 'in_progress', 'disputed']),
        supabase
          .from('profile_views')
          .select('viewer_id')
          .eq('profile_id', uid)
          .gte('view_date', startDate)
          .lte('view_date', today),
      ]);

      type SalesRow = { total_amount?: number };
      type ServiceSaleRow = { amount_minor?: number };
      type ViewRow = { viewer_id?: string };

      const productRevenue =
        (sales as { data?: SalesRow[] })?.data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const serviceRevenue =
        (completedServiceSales as { data?: ServiceSaleRow[] })?.data?.reduce(
          (sum, row) => sum + (Number(row.amount_minor) || 0) / 100,
          0,
        ) || 0;
      const revenue = productRevenue + serviceRevenue;
      const viewData = (viewsRes as { data?: ViewRow[] })?.data;
      const uniqueViewers = viewData?.length
        ? new Set(viewData.map((r) => r.viewer_id).filter(Boolean)).size
        : 0;

      const productCount = (products as { count?: number }).count || 0;
      const serviceCount = (services as { count?: number }).count || 0;
      const totalListings = productCount + serviceCount;

      setStats({
        revenue,
        productRevenue,
        serviceRevenue,
        productCount,
        serviceCount,
        totalListings,
        activeOrders: (active as { count?: number }).count || 0,
        activeServiceBookings: (activeServiceBookings as { count?: number }).count || 0,
        storeViewsThisWeek: uniqueViewers,
      });
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error('Dashboard sync error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id, supabase]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!mounted) return;
        if (!uid) {
          setProfile(null);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
        if (!mounted) return;
        if (error) throw error;
        const row = (data as ProfileRow) || null;
        setProfile(row);
        if (row?.is_seller !== true) {
          setLoading(false);
        }
      } catch {
        if (!mounted) return;
        setProfile(null);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!profile?.id) return;
    void fetchStoreData();
  }, [profile?.id, fetchStoreData]);

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);

  const onRefresh = () => {
    setRefreshing(true);
    void fetchStoreData();
  };

  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/profile';
  const wrap = (path: string) => (fromDrawer ? withDrawerParam(path) : path);

  const planExpiryLabel = (() => {
    const expiryDate = planState.expiryDate;
    const now = new Date();
    let expiryLabel = 'Active • No scheduled expiry';
    if (expiryDate) {
      const daysLeft = differenceInCalendarDays(expiryDate, now);
      const monthsLeft = Math.max(0, Math.floor(daysLeft / 30));
      expiryLabel = isExpired
        ? 'Expired • Renew'
        : daysLeft <= 30
          ? `Renews ${formatShortDate(expiryDate)}`
          : monthsLeft >= 12
            ? `Active until ${formatShortDate(expiryDate)} • ${Math.floor(monthsLeft / 12)} yr left`
            : `Active until ${formatShortDate(expiryDate)} • ${monthsLeft} mo left`;
    }
    return expiryLabel;
  })();

  if (!loading && profile && profile.is_seller !== true) {
    return (
      <div className="rounded-3xl border border-(--border) bg-(--card) p-8 text-center">
        <p className="text-sm font-semibold text-(--muted)">This area is for sellers only.</p>
        <Link href="/app/seller/become" className="mt-4 inline-block text-sm font-bold text-emerald-600 hover:underline">
          Become a seller
        </Link>
        <div className="mt-4">
          <Link href="/app/profile" className="text-sm text-(--muted) hover:text-(--foreground)">
            Back to profile
          </Link>
        </div>
      </div>
    );
  }

  if (loading && !refreshing) {
    return (
      <div className="pb-8">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-(--border) bg-(--background)/95 px-1 py-3 backdrop-blur-sm md:px-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--surface)" aria-hidden />
          <span className="text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">
            SALES DASHBOARD
          </span>
          <div className="h-11 w-11 shrink-0" />
        </header>
        <div className="mx-auto max-w-xl pt-8">
          <div className="animate-pulse rounded-[28px] border border-(--border) bg-(--surface) p-5">
            <div className="h-2.5 w-28 rounded bg-(--border)" />
            <div className="mt-3 h-7 w-40 rounded bg-(--border)" />
          </div>
          <p className="mb-3 mt-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-(--muted) opacity-60">
            STORE CONTROLS
          </p>
          {[0, 1, 2, 3].map((k) => (
            <div key={k} className="mb-2 animate-pulse rounded-[28px] border border-(--border) bg-(--surface) p-5">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-2xl bg-(--border)" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/2 rounded bg-(--border)" />
                  <div className="h-2.5 w-2/5 rounded bg-(--border)" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-(--border) bg-(--background)/95 py-3 backdrop-blur-sm">
        <Link
          href={backHref}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--surface) text-(--foreground) transition hover:opacity-90"
          aria-label={fromDrawer ? 'Back to profile menu' : 'Back to profile'}
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </Link>
        <h1 className="min-w-0 flex-1 text-center text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">
          SALES DASHBOARD
        </h1>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--surface) text-(--foreground) disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw size={20} strokeWidth={2.5} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="mx-auto mt-6 max-w-xl space-y-6">
        {(planState.plan === 'standard' || planState.plan === 'diamond') && (
          <Link
            href="/app/subscription"
            className={`block rounded-[20px] border p-5 shadow-sm transition hover:opacity-95 ${
              isDiamond
                ? 'border-violet-500/40 bg-violet-500/6 dark:bg-violet-500/10'
                : 'border-(--border) bg-(--surface)'
            } ${isExpired ? 'border-amber-500/60 bg-amber-500/6' : ''}`}
          >
            <div className="flex gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  isDiamond ? 'bg-violet-500/20' : 'bg-emerald-500/15'
                }`}
              >
                {isDiamond ? (
                  <Gem size={20} className="text-violet-500" strokeWidth={2} />
                ) : (
                  <Store size={20} className="text-emerald-600" strokeWidth={2} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold tracking-tight text-(--foreground)">
                  {String(profile?.subscription_plan || '').toLowerCase() === 'diamond' ? 'Diamond' : 'Standard'} plan
                </p>
                <p className="mt-1 text-[13px] font-medium leading-snug text-(--muted)">{planExpiryLabel}</p>
                <p
                  className={`mt-2 text-[12px] font-semibold tracking-wide ${
                    isDiamond ? 'text-violet-600 dark:text-violet-400' : 'text-emerald-600'
                  }`}
                >
                  {isExpired ? 'Renew plan →' : isDiamond ? 'Manage subscription →' : 'Upgrade to Diamond →'}
                </p>
              </div>
            </div>
          </Link>
        )}

        <Link
          href={wrap('/app/activity/profile-views')}
          className="flex items-center gap-4 rounded-[20px] border border-(--border) bg-(--surface) p-5 shadow-sm transition hover:bg-(--surface)/80"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15">
            <Eye size={20} className="text-emerald-600" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold leading-snug text-(--foreground)">
              Your store was shown to{' '}
              <span className="font-black text-emerald-600">{stats.storeViewsThisWeek}</span> people this week
            </p>
            <p className="mt-0.5 text-[12px] font-semibold text-(--muted) opacity-80">
              Tap to see who viewed your profile
            </p>
          </div>
          <ChevronRight size={20} className="shrink-0 text-(--muted)" />
        </Link>

        <Link
          href={wrap('/app/seller/revenue')}
          className="block rounded-[28px] border border-(--border) bg-(--surface) p-5 shadow-sm transition hover:opacity-95"
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-(--muted)" strokeWidth={2} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--muted)">
              LIFETIME SALES
            </span>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-(--foreground)">{formatMoney(stats.revenue)}</p>
          {sellsProducts && offersServices ? (
            <p className="mt-2 text-[12px] font-semibold leading-snug text-(--muted) opacity-80">
              Products {formatMoney(stats.productRevenue)} · Services {formatMoney(stats.serviceRevenue)}
            </p>
          ) : offersServices ? (
            <p className="mt-2 text-[12px] font-semibold text-(--muted) opacity-80">Completed bookings (after checkout)</p>
          ) : (
            <p className="mt-2 text-[12px] font-semibold text-(--muted) opacity-80">Completed orders</p>
          )}
        </Link>

        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-(--muted) opacity-60">
            STORE CONTROLS
          </p>
          <div className="flex flex-col gap-2">
            {sellsProducts && (
              <NavTile
                href={wrap('/app/seller/orders')}
                icon={<ShoppingBag size={20} className="text-emerald-600" strokeWidth={2.5} />}
                label="Manage Orders"
                sub="Ship items & handle disputes"
                badge={stats.activeOrders}
              />
            )}
            {sellsProducts && (
              <NavTile
                href={wrap('/app/seller/inventory')}
                icon={<Package size={20} className="text-emerald-600" strokeWidth={2.5} />}
                label="Inventory"
                sub={
                  offersServices
                    ? `${stats.totalListings} Listing${stats.totalListings !== 1 ? 's' : ''} (${stats.productCount} product${stats.productCount !== 1 ? 's' : ''}, ${stats.serviceCount} service${stats.serviceCount !== 1 ? 's' : ''})`
                    : `${stats.productCount} Product${stats.productCount !== 1 ? 's' : ''} Listed`
                }
              />
            )}
            {offersServices && (
              <NavTile
                href={wrap('/app/bookings?perspective=seller')}
                icon={<Wand2 size={20} className="text-emerald-600" strokeWidth={2.5} />}
                label="Services & bookings"
                sub="Manage services and upcoming bookings"
                badge={stats.activeServiceBookings}
              />
            )}
            {(sellsProducts || offersServices) && (
              <NavTile
                href={wrap('/app/seller/clients')}
                icon={<UserPlus size={20} className="text-emerald-600" strokeWidth={2.5} />}
                label={sellsProducts && offersServices ? 'Past clients & customers' : offersServices ? 'Past clients' : 'Past customers'}
                sub={
                  sellsProducts && offersServices
                    ? 'See completed service clients and product customers'
                    : offersServices
                      ? 'See who has booked you before'
                      : 'See who has bought from you before'
                }
              />
            )}
            <NavTile
              href={wrap('/app/seller/loyalty')}
              icon={<Zap size={20} className="text-amber-500" strokeWidth={2.5} />}
              label="Store Rewards"
              sub={loyaltySubtitle}
            />
            <NavTile
              href={wrap('/app/settings/account')}
              icon={<Settings size={20} className="text-(--muted)" strokeWidth={2.5} />}
              label="Edit Shop Profile"
              sub="Branding & location settings"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function NavTile({
  href,
  icon,
  label,
  sub,
  badge = 0,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  sub: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-[28px] border border-(--border) bg-(--surface) p-5 shadow-sm transition hover:bg-(--surface)/80"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--background)">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-(--foreground)">{label}</span>
          {badge > 0 ? (
            <span className="flex min-h-5 min-w-5 items-center justify-center rounded-md bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
              {badge > 99 ? '99+' : badge}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[12px] font-semibold text-(--muted) opacity-70">{sub}</p>
      </div>
    </Link>
  );
}
