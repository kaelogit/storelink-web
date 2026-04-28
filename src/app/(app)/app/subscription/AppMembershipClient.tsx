'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PaystackTerminalModal } from '@/components/payments/PaystackTerminalModal';
import { createBrowserClient } from '@/lib/supabase';
import { calculateDiamondPrice } from '@/lib/membershipCopy';
import { getSellerPlanState, showDiamondBadge } from '@/lib/sellerStatus';
import MembershipPricingBody from '@/components/membership/MembershipPricingBody';

type Profile = {
  id?: string;
  is_seller?: boolean | null;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  subscription_expiry?: string | null;
  display_name?: string | null;
  email?: string | null;
  currency_code?: string | null;
};

export default function AppMembershipClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/profile';
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [paystackOpen, setPaystackOpen] = useState(false);
  const [pendingDiamondMonths, setPendingDiamondMonths] = useState<number | null>(null);
  const [upgradeBusy, setUpgradeBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getUser();
      const uid = sessionData?.user?.id;
      if (!uid) {
        setProfile(null);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, is_seller, subscription_plan, subscription_status, subscription_expiry, display_name, currency_code')
        .eq('id', uid)
        .maybeSingle();
      if (error) throw error;
      const row = (data as Profile) || null;
      const email = sessionData.user?.email ?? null;
      setProfile(row ? { ...row, email } : null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const lockedRole = useMemo<'seller' | 'buyer'>(() => {
    if (!profile?.id) return 'buyer';
    return profile.is_seller ? 'seller' : 'buyer';
  }, [profile]);

  const billingCurrency = String(profile?.currency_code || 'NGN').toUpperCase();

  const canOfferDiamondCheckout = !!profile?.id && !showDiamondBadge(profile);

  const line = useMemo(() => {
    if (!profile?.id) return 'Sign in to sync your current plan. You can still review Standard vs Diamond below.';
    const ps = getSellerPlanState(profile);
    const diamondUi = showDiamondBadge(profile);
    if (diamondUi) {
      return profile.is_seller
        ? "You're on Diamond for your store (active)."
        : "You're on Diamond (active) — your profile uses the Diamond badge and halo where applicable.";
    }
    if (ps.plan === 'diamond' && ps.isExpired) {
      return 'Your Diamond membership has expired. Renew below or continue on Standard (free).';
    }
    if (profile.is_seller) {
      return "You're on Standard for selling — the default free tier. Upgrade to Diamond below for extra visibility and AI listing tools.";
    }
    return "You're a Standard shopper. Diamond is optional — upgrade below if you want Spotlight reach and the Diamond badge.";
  }, [profile]);

  const handleRequestDiamondPay = useCallback((months: number) => {
    setPendingDiamondMonths(months);
    setPaystackOpen(true);
  }, []);

  const paystackAmount = useMemo(() => {
    if (!profile?.id || pendingDiamondMonths == null) return 0;
    return calculateDiamondPrice(lockedRole, pendingDiamondMonths, billingCurrency).finalPrice;
  }, [billingCurrency, lockedRole, pendingDiamondMonths, profile?.id]);

  const handleSubscriptionPaySuccess = useCallback(
    async (_reference: string) => {
      setPaystackOpen(false);
      if (!profile?.id || pendingDiamondMonths == null) return;
      setUpgradeBusy(true);
      try {
        const { error } = await supabase.rpc('upgrade_user_subscription', {
          p_user_id: profile.id,
          p_plan: 'diamond',
          p_months: pendingDiamondMonths,
        });
        if (error) throw error;
        await load();
        window.alert('Upgrade successful! You are now on Diamond.');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Payment may have succeeded but upgrade failed. Contact support.';
        window.alert(msg);
      } finally {
        setUpgradeBusy(false);
        setPendingDiamondMonths(null);
      }
    },
    [load, pendingDiamondMonths, profile?.id, supabase],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 md:py-8">
      <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between border-b border-(--border) bg-(--background)/95 px-1 py-3 backdrop-blur-sm lg:hidden">
        <Link
          href={backHref}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--surface) text-(--foreground) transition hover:opacity-90"
          aria-label={fromDrawer ? 'Back to profile menu' : 'Back to profile'}
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </Link>
        <h1 className="min-w-0 flex-1 text-center text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">
          Membership
        </h1>
        <div className="h-11 w-11 shrink-0" aria-hidden />
      </header>

      <div className="mx-auto mb-6 max-w-2xl text-center">
        <h1 className="mb-0 hidden text-2xl font-black tracking-tight text-(--foreground) lg:block">Membership</h1>
        <p className="mt-0 text-sm text-(--muted) lg:mt-2">
          {loading ? (
            'Matching this page to your account…'
          ) : lockedRole === 'seller' ? (
            <>
              Free Standard for your store, optional Diamond for extra reach and listing AI. You&apos;re viewing{' '}
              <span className="font-semibold text-(--foreground)">I sell</span> pricing.
            </>
          ) : (
            <>
              Free Standard to shop, optional Diamond for Spotlight reach and a Diamond badge. You&apos;re viewing{' '}
              <span className="font-semibold text-(--foreground)">I buy</span> pricing.
            </>
          )}
        </p>
      </div>

      {upgradeBusy ? (
        <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/40 p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-(--border) bg-(--card) px-6 py-4 shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            <p className="text-sm font-semibold text-(--foreground)">Applying your upgrade…</p>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="py-12 text-center text-sm text-(--muted)">Loading your account…</p>
      ) : (
        <MembershipPricingBody
          appContext
          lockedRole={lockedRole}
          currentPlanLine={line}
          billingCurrency={billingCurrency}
          onRequestDiamondPay={canOfferDiamondCheckout ? handleRequestDiamondPay : undefined}
          diamondPayDisabled={upgradeBusy}
        />
      )}

      <PaystackTerminalModal
        isOpen={paystackOpen && pendingDiamondMonths != null && !!profile?.id}
        onClose={() => {
          setPaystackOpen(false);
          setPendingDiamondMonths(null);
        }}
        onSuccess={(ref) => void handleSubscriptionPaySuccess(ref)}
        email={String(profile?.email || '').trim() || `member-${profile?.id || 'user'}@storelink.ng`}
        amount={paystackAmount}
        currency={billingCurrency}
        metadata={{
          profile_id: profile?.id,
          plan_type: 'diamond',
          duration_months: pendingDiamondMonths ?? 1,
          is_seller_upgrade: lockedRole === 'seller',
        }}
      />
    </div>
  );
}
