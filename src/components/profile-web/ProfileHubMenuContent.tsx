'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  Bell,
  ChevronRight,
  Coins,
  Heart,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserPlus,
  Wand2,
  X,
} from 'lucide-react';
import { countSellerManageOrdersExcludingServicePlaceholders } from '@/lib/sellerProductOrderBadgeCount';
import { profileHubPaths, withDrawerParam } from './profileHubPaths';

export type ProfileHubMenuProfile = {
  id: string;
  is_seller?: boolean | null;
  seller_type?: string | null;
};

type ProfileHubMenuContentProps = {
  supabase: SupabaseClient;
  profile: ProfileHubMenuProfile | null;
  /** When true, load seller badges (same triggers as app drawer). */
  active: boolean;
  /** `sheet`: drag handle + EXPLORE header row with close. `plain`: scrollable body only. */
  variant?: 'sheet' | 'plain';
  onNavigate?: () => void;
  onClose?: () => void;
  className?: string;
  /** Appended inside scroll area after Help (e.g. theme + logout on desktop). */
  footerInsideScroll?: ReactNode;
};

function MenuRow({
  href,
  label,
  sub,
  badge,
  onNavigate,
  icon,
}: {
  href: string;
  label: string;
  sub?: string;
  badge?: number;
  onNavigate?: () => void;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={withDrawerParam(href)}
      onClick={onNavigate}
      className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-(--surface)"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--surface)">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-bold tracking-tight text-(--foreground)">{label}</p>
          {badge != null && badge > 0 ? (
            <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-black text-white">
              {badge > 99 ? '99+' : badge}
            </span>
          ) : null}
        </div>
        {sub ? <p className="mt-0.5 text-[12px] font-medium text-(--muted)">{sub}</p> : null}
      </div>
      <ChevronRight size={14} className="shrink-0 text-(--border)" strokeWidth={3} />
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 px-2 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted) opacity-80">{children}</p>
  );
}

export default function ProfileHubMenuContent({
  supabase,
  profile,
  active,
  variant = 'plain',
  onNavigate,
  onClose,
  className,
  footerInsideScroll,
}: ProfileHubMenuContentProps) {
  const isSeller = profile?.is_seller === true;
  const sellerType = profile?.seller_type as 'product' | 'service' | 'both' | undefined;
  const sellsProducts = !!isSeller && (!sellerType || sellerType === 'product' || sellerType === 'both');
  const offersServices = !!isSeller && (sellerType === 'service' || sellerType === 'both');

  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [upcomingBookingCount, setUpcomingBookingCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const loadSellerBadges = async () => {
      if (!active || !isSeller || !profile?.id) return;
      try {
        const jobs: Array<Promise<{ count?: number } | { count: number | null }>> = [];
        if (sellsProducts) {
          jobs.push(countSellerManageOrdersExcludingServicePlaceholders(supabase, profile.id).then((n) => ({ count: n })));
        }
        if (offersServices) {
          jobs.push(
            Promise.resolve(
              supabase
                .from('service_orders')
                .select('id', { count: 'exact', head: true })
                .eq('seller_id', profile.id)
                .in('status', ['requested', 'confirmed', 'paid', 'in_progress', 'disputed']),
            ).then((res) => ({ count: res.count })),
          );
        }
        const results = await Promise.all(jobs);
        if (!mounted) return;
        let cursor = 0;
        if (sellsProducts) {
          setActiveOrderCount(Number((results[cursor] as { count?: number })?.count ?? 0));
          cursor += 1;
        } else {
          setActiveOrderCount(0);
        }
        if (offersServices) {
          setUpcomingBookingCount(Number((results[cursor] as { count?: number | null })?.count ?? 0));
        } else {
          setUpcomingBookingCount(0);
        }
      } catch {
        if (!mounted) return;
        setActiveOrderCount(0);
        setUpcomingBookingCount(0);
      }
    };
    void loadSellerBadges();
    return () => {
      mounted = false;
    };
  }, [active, isSeller, profile?.id, sellsProducts, offersServices, supabase]);

  const inventorySub = useMemo(() => {
    if (sellsProducts && offersServices) return 'Manage products and services';
    if (offersServices) return 'Manage listed services';
    return 'Manage products & Flash Drops';
  }, [sellsProducts, offersServices]);

  const pastClientsLabel = useMemo(() => {
    if (sellsProducts && offersServices) return 'Past clients & customers';
    if (offersServices) return 'Past clients';
    return 'Past customers';
  }, [sellsProducts, offersServices]);

  const pastClientsSub = useMemo(() => {
    if (sellsProducts && offersServices) return 'See completed service clients and product customers';
    if (offersServices) return 'See who has booked you before';
    return 'See who has bought from you before';
  }, [sellsProducts, offersServices]);

  const scrollBody = (
    <>
      {variant === 'sheet' ? (
        <div className="mb-6 flex items-center justify-between px-1 pt-1">
          <p className="text-[12px] font-black tracking-[0.2em] text-(--foreground)">EXPLORE HUB</p>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--surface) text-(--foreground)"
              aria-label="Close menu"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mb-4 px-1">
          <p className="text-[12px] font-black tracking-[0.2em] text-(--foreground)">EXPLORE HUB</p>
        </div>
      )}

      {isSeller ? (
        <section className="mb-8">
          <SectionLabel>Sales menu</SectionLabel>
          <div className="flex flex-col gap-0.5">
            <MenuRow
              href={profileHubPaths.salesDashboard}
              label="Sales dashboard"
              sub="Revenue & analytics"
              onNavigate={onNavigate}
              icon={<LayoutDashboard size={20} className="text-emerald-600" strokeWidth={2.2} />}
            />
            <MenuRow
              href={profileHubPaths.inventory}
              label="My inventory"
              sub={inventorySub}
              onNavigate={onNavigate}
              icon={<Package size={20} className="text-emerald-600" strokeWidth={2.2} />}
            />
            {sellsProducts ? (
              <MenuRow
                href={profileHubPaths.manageOrders}
                label="Manage orders"
                sub="Ship items & handle disputes"
                badge={activeOrderCount}
                onNavigate={onNavigate}
                icon={<ShoppingBag size={20} className="text-emerald-600" strokeWidth={2.2} />}
              />
            ) : null}
            {offersServices ? (
              <MenuRow
                href={profileHubPaths.servicesBookings}
                label="Services & bookings"
                sub="Manage services and upcoming bookings"
                badge={upcomingBookingCount}
                onNavigate={onNavigate}
                icon={<Wand2 size={20} className="text-emerald-600" strokeWidth={2.2} />}
              />
            ) : null}
            {isSeller ? (
              <MenuRow
                href={profileHubPaths.pastClients}
                label={pastClientsLabel}
                sub={pastClientsSub}
                onNavigate={onNavigate}
                icon={<UserPlus size={20} className="text-emerald-600" strokeWidth={2.2} />}
              />
            ) : null}
            <MenuRow
              href={profileHubPaths.verifications}
              label="Verifications"
              sub="KYC & identity check"
              onNavigate={onNavigate}
              icon={<ShieldCheck size={20} className="text-emerald-600" strokeWidth={2.2} />}
            />
            <MenuRow
              href={profileHubPaths.membership}
              label="Membership"
              sub="Standard (free) & Diamond"
              onNavigate={onNavigate}
              icon={<Sparkles size={20} className="text-violet-500" fill="currentColor" strokeWidth={2} />}
            />
            <MenuRow
              href={profileHubPaths.payoutSettings}
              label="Payout settings"
              sub="Bank account & withdrawals"
              onNavigate={onNavigate}
              icon={<Landmark size={20} className="text-emerald-600" strokeWidth={2.2} />}
            />
          </div>
        </section>
      ) : null}

      <section className="mb-8">
        <SectionLabel>Account</SectionLabel>
        <div className="flex flex-col gap-0.5">
          {!isSeller ? (
            <MenuRow
              href={profileHubPaths.membership}
              label="Membership"
              sub="Standard (free) & Diamond"
              onNavigate={onNavigate}
              icon={<Sparkles size={20} className="text-violet-500" fill="currentColor" strokeWidth={2} />}
            />
          ) : null}
          <MenuRow
            href={profileHubPaths.wallet}
            label="My wallet"
            sub="Loyalty points & history"
            onNavigate={onNavigate}
            icon={<Coins size={20} className="text-amber-500" fill="currentColor" strokeWidth={2} />}
          />
          <MenuRow
            href={profileHubPaths.inviteUsers}
            label="Invite users"
            sub="Earn 2,500 signup, 1,000 first order, then 250 for 2 months"
            onNavigate={onNavigate}
            icon={<UserPlus size={20} className="text-emerald-600" strokeWidth={2.2} />}
          />
          <MenuRow
            href={profileHubPaths.activityAlerts}
            label="Activity & alerts"
            sub="Likes, comments, updates"
            onNavigate={onNavigate}
            icon={<Bell size={20} className="text-(--foreground)" strokeWidth={2.2} />}
          />
          <MenuRow
            href={profileHubPaths.myPurchases}
            label="My purchases"
            sub="Product orders & service bookings"
            onNavigate={onNavigate}
            icon={<ShoppingBag size={20} className="text-(--foreground)" strokeWidth={2.2} />}
          />
          {!isSeller ? (
            <MenuRow
              href={profileHubPaths.bankDetails}
              label="Bank details"
              sub="For refunds & payouts"
              onNavigate={onNavigate}
              icon={<Landmark size={20} className="text-(--foreground)" strokeWidth={2.2} />}
            />
          ) : null}
          <MenuRow
            href={profileHubPaths.wishlist}
            label="Wishlist"
            sub="Your saved discoveries"
            onNavigate={onNavigate}
            icon={<Heart size={20} className="text-rose-500" fill="currentColor" strokeWidth={2} />}
          />
        </div>
      </section>

      <div className="mb-6 h-px bg-(--border) opacity-60" />

      <section className="mb-4">
        <div className="flex flex-col gap-0.5">
          <MenuRow
            href={profileHubPaths.settings}
            label="Settings"
            onNavigate={onNavigate}
            icon={<Settings2 size={20} className="text-(--muted)" strokeWidth={2.2} />}
          />
          <MenuRow
            href={profileHubPaths.helpSupport}
            label="Help & support"
            sub="View tickets & FAQs"
            onNavigate={onNavigate}
            icon={<LifeBuoy size={20} className="text-(--muted)" strokeWidth={2.2} />}
          />
        </div>
      </section>

      {footerInsideScroll}

      {!isSeller ? (
        <Link
          href={withDrawerParam(profileHubPaths.becomeSeller)}
          onClick={onNavigate}
          className="mt-4 flex items-center gap-3 rounded-t-2xl bg-(--foreground) px-4 py-4 text-left text-(--background) shadow-lg"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-black tracking-tight">Become a seller</p>
            <p className="mt-1 text-[12px] font-semibold opacity-70">Open your shop and join the marketplace.</p>
          </div>
          <ChevronRight size={18} strokeWidth={3} className="shrink-0 text-(--background)" />
        </Link>
      ) : null}
    </>
  );

  return (
    <div className={variant === 'sheet' ? `flex min-h-0 flex-1 flex-col ${className ?? ''}`.trim() : className}>
      {variant === 'sheet' ? (
        <>
          <div className="mx-auto mb-2 mt-2 h-1 w-8 shrink-0 rounded-full bg-(--border) opacity-40" aria-hidden />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-6">{scrollBody}</div>
        </>
      ) : (
        <div className={`px-1 pb-2 ${className ?? ''}`.trim()}>{scrollBody}</div>
      )}
    </div>
  );
}
