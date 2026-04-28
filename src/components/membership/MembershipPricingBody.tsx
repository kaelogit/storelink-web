'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Gem, Percent } from 'lucide-react';
import Link from 'next/link';
import {
  BILLING_DURATIONS,
  MEMBERSHIP_FOOTNOTES,
  SELLER_STANDARD,
  SELLER_DIAMOND,
  BUYER_STANDARD,
  BUYER_DIAMOND,
  SELLER_COMPARISON_ROWS,
  BUYER_COMPARISON_ROWS,
  calculateDiamondPrice,
  formatMembershipMoney,
} from '@/lib/membershipCopy';

type MembershipPricingBodyProps = {
  /** In-app: compact intro + link to KYC. */
  appContext?: boolean;
  /** In-app: only show seller or buyer view (no role toggle). Marketing site omits this to keep both. */
  lockedRole?: 'seller' | 'buyer' | null;
  /** In-app: optional profile-driven hint (e.g. current plan line). */
  currentPlanLine?: string | null;
  /** Profile `currency_code` (defaults to NGN). */
  billingCurrency?: string;
  /** In-app: opens Paystack for Diamond checkout with the selected term length. */
  onRequestDiamondPay?: (months: number) => void;
  diamondPayDisabled?: boolean;
};

export default function MembershipPricingBody({
  appContext,
  lockedRole = null,
  currentPlanLine,
  billingCurrency = 'NGN',
  onRequestDiamondPay,
  diamondPayDisabled,
}: MembershipPricingBodyProps) {
  const [freeRole, setFreeRole] = useState<'seller' | 'buyer'>('seller');
  const role = lockedRole ?? freeRole;
  const [selectedMonths, setSelectedMonths] = useState(1);
  const diamond = calculateDiamondPrice(role, selectedMonths, billingCurrency);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {appContext && currentPlanLine ? (
        <p className="text-center text-sm text-(--muted) font-medium mb-8 px-4">{currentPlanLine}</p>
      ) : null}

      <div className="mt-0 flex flex-col items-center gap-8">
        {lockedRole ? (
          <div
            className="w-full max-w-[340px] py-3.5 rounded-2xl border border-(--border) bg-(--card) text-center text-sm font-black uppercase tracking-wider text-(--foreground)"
            role="status"
            aria-label={lockedRole === 'seller' ? 'I sell' : 'I buy'}
          >
            {lockedRole === 'seller' ? 'I sell' : 'I buy'}
          </div>
        ) : (
          <div className="bg-(--card) p-1.5 rounded-2xl border border-(--border) shadow-sm flex relative w-full max-w-[340px]">
            <button
              type="button"
              onClick={() => {
                setFreeRole('seller');
                setSelectedMonths(1);
              }}
              className={`flex-1 relative z-10 py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-colors duration-300 ${
                freeRole === 'seller' ? 'text-white' : 'text-(--muted) hover:text-(--foreground)'
              }`}
            >
              I sell
            </button>
            <button
              type="button"
              onClick={() => {
                setFreeRole('buyer');
                setSelectedMonths(1);
              }}
              className={`flex-1 relative z-10 py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-colors duration-300 ${
                freeRole === 'buyer' ? 'text-white' : 'text-(--muted) hover:text-(--foreground)'
              }`}
            >
              I shop
            </button>
            <motion.div
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-(--charcoal) rounded-xl shadow-md"
              initial={false}
              animate={{ x: freeRole === 'seller' ? 0 : '100%' }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
            />
          </div>
        )}

        <div className="flex flex-wrap justify-center bg-(--card) p-1.5 rounded-2xl border border-(--border) shadow-sm w-fit max-w-full">
          {BILLING_DURATIONS.map((d) => {
            const isActive = selectedMonths === d.months;
            return (
              <button
                type="button"
                key={d.months}
                onClick={() => setSelectedMonths(d.months)}
                className={`relative px-5 md:px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-200/50 dark:ring-emerald-800/50'
                    : 'bg-transparent text-(--muted) hover:text-(--foreground) hover:bg-(--surface)'
                }`}
              >
                {d.label}
                {d.discount > 0 && (
                  <span
                    className={`absolute -top-2.5 -right-2 text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-sm border ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-(--card) text-(--foreground) border-(--border)'
                    }`}
                  >
                    -{d.discount * 100}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-0 pt-10 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${role}-${selectedMonths}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className={`grid gap-8 items-stretch ${role === 'seller' ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' : 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto'}`}
          >
            {role === 'seller' ? (
              <>
                <PricingCard
                  title={SELLER_STANDARD.title}
                  desc={SELLER_STANDARD.description}
                  price="Free"
                  subPrice="For every seller account"
                  features={[...SELLER_STANDARD.features]}
                  cta={appContext ? 'Included for your store' : 'Get the app'}
                  href={appContext ? undefined : '/download'}
                  featured
                />
                <PricingCard
                  title={SELLER_DIAMOND.title}
                  desc={SELLER_DIAMOND.description}
                  price={formatMembershipMoney(diamond.finalPrice, billingCurrency)}
                  subPrice={
                    selectedMonths > 1
                      ? `≈ ${formatMembershipMoney(diamond.perMonth, billingCurrency)}/mo · billed for ${selectedMonths} mo`
                      : 'Per billing term above'
                  }
                  features={[...SELLER_DIAMOND.features]}
                  cta={appContext && !onRequestDiamondPay ? 'Pay in the mobile app' : 'Get the app'}
                  href={appContext && !onRequestDiamondPay ? undefined : '/download'}
                  diamond
                  savings={diamond.discount > 0 ? `Save ${(diamond.discount * 100).toFixed(0)}%` : null}
                  payButton={
                    appContext && onRequestDiamondPay
                      ? {
                          label: 'Upgrade with Paystack',
                          onClick: () => onRequestDiamondPay(selectedMonths),
                          disabled: diamondPayDisabled,
                        }
                      : undefined
                  }
                />
              </>
            ) : (
              <>
                <PricingCard
                  title="Shopper (Standard)"
                  desc={BUYER_STANDARD.description}
                  price="Free"
                  subPrice="Forever"
                  features={[...BUYER_STANDARD.features]}
                  cta={appContext ? 'Always free' : 'Download the app'}
                  href={appContext ? undefined : '/download'}
                  featured
                />
                <PricingCard
                  title="Diamond"
                  desc={BUYER_DIAMOND.description}
                  price={formatMembershipMoney(diamond.finalPrice, billingCurrency)}
                  subPrice={
                    selectedMonths > 1
                      ? `≈ ${formatMembershipMoney(diamond.perMonth, billingCurrency)}/mo · ${selectedMonths} mo`
                      : 'Per billing term above'
                  }
                  features={[...BUYER_DIAMOND.features]}
                  cta={appContext && !onRequestDiamondPay ? 'Pay in the mobile app' : 'Get the app'}
                  href={appContext && !onRequestDiamondPay ? undefined : '/download'}
                  diamond
                  savings={diamond.discount > 0 ? `Save ${(diamond.discount * 100).toFixed(0)}%` : null}
                  payButton={
                    appContext && onRequestDiamondPay
                      ? {
                          label: 'Upgrade with Paystack',
                          onClick: () => onRequestDiamondPay(selectedMonths),
                          disabled: diamondPayDisabled,
                        }
                      : undefined
                  }
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {role === 'seller' && !appContext && (
        <div className="mt-4 mb-6 flex justify-center px-2">
          <div className="inline-flex flex-col md:flex-row items-center gap-4 bg-(--card)/80 backdrop-blur-md px-8 py-5 rounded-3xl border border-(--border) shadow-xl shadow-(--charcoal)/5 max-w-2xl">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
              <Percent size={20} className="text-emerald-600" strokeWidth={3} />
            </div>
            <p className="text-sm text-(--muted) font-medium text-left">
              <span className="text-(--foreground) font-black text-sm uppercase tracking-wider block mb-1">Fair play fee</span>
              A total <span className="text-emerald-600 font-bold">4%</span> seller-side fee (2.5% platform + 1.5% processing) only when you complete a
              sale. No sale, no fee.
            </p>
          </div>
        </div>
      )}

      {appContext && (lockedRole === 'seller' || !lockedRole) && (
        <p className="text-center text-xs text-(--muted) max-w-lg mx-auto px-4 leading-relaxed mb-4">
          {MEMBERSHIP_FOOTNOTES.identity}{' '}
          <Link href="/app/seller/verification-consent" className="text-emerald-600 font-semibold hover:underline">
            Verification
          </Link>
          .
        </p>
      )}
      {appContext && lockedRole === 'buyer' && (
        <p className="text-center text-xs text-(--muted) max-w-lg mx-auto px-4 leading-relaxed mb-4">
          Identity verification (KYC) is separate from Diamond: it applies if you open a store or are asked to verify — not the same as this membership.
        </p>
      )}

      <section
        className={`${appContext ? 'pt-4 pb-2' : 'py-16'} border-t border-(--border) mt-2`}
      >
        <div className="text-center mb-8 px-2">
          <h2 className="text-2xl md:text-3xl font-display font-black text-(--foreground)">Compare at a glance</h2>
          <p className="mt-2 text-sm text-(--muted) max-w-lg mx-auto">
            One free Standard tier, one optional Diamond upgrade. No legacy “shop tiers” — just membership.
          </p>
        </div>

        {role === 'seller' ? (
          <ComparisonTable rows={SELLER_COMPARISON_ROWS} rightLabel="Diamond" foot={MEMBERSHIP_FOOTNOTES.identity} />
        ) : (
          <ComparisonTable rows={BUYER_COMPARISON_ROWS} rightLabel="Diamond" foot={null} />
        )}
      </section>
    </div>
  );
}

function ComparisonTable({
  rows,
  rightLabel,
  foot,
}: {
  rows: { label: string; standard: string; diamond: string }[];
  rightLabel: string;
  foot: string | null;
}) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-(--border) shadow-lg bg-(--card) max-w-4xl mx-auto">
      <table className="w-full text-left border-collapse min-w-[520px]">
        <thead>
          <tr className="bg-(--surface)">
            <th className="p-4 md:p-5 border-b border-(--border) w-[36%] text-xs font-black uppercase tracking-widest text-(--muted)">Feature</th>
            <th className="p-4 md:p-5 border-b border-(--border) text-center text-sm font-black text-emerald-600">Standard (free)</th>
            <th className="p-4 md:p-5 border-b border-(--border) text-center text-sm font-black text-violet-600">{rightLabel}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-(--border)">
          {rows.map((r) => (
            <tr key={r.label} className="hover:bg-(--surface)/60 transition-colors">
              <td className="p-4 md:p-5 text-sm font-semibold text-(--foreground)">{r.label}</td>
              <td className="p-4 md:p-5 text-sm text-(--foreground) text-center align-top">{r.standard}</td>
              <td className="p-4 md:p-5 text-sm text-(--foreground) text-center font-medium align-top bg-violet-50/20 dark:bg-violet-950/20">
                {r.diamond}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {foot ? <p className="text-xs text-(--muted) p-4 border-t border-(--border)">* {foot}</p> : null}
    </div>
  );
}

interface PricingCardProps {
  title: string;
  desc: string;
  price: string;
  subPrice: string;
  features: string[];
  cta: string;
  href?: string;
  featured?: boolean;
  diamond?: boolean;
  savings?: string | null;
  payButton?: { label: string; onClick: () => void; disabled?: boolean };
}

function PricingCard({ title, desc, price, subPrice, features, cta, href, featured, diamond, savings, payButton }: PricingCardProps) {
  const content = (
    <div
      className={`relative p-7 md:p-9 rounded-[2.5rem] border flex flex-col h-full min-h-[420px] transform-gpu transition-transform duration-300 hover:-translate-y-0.5 ${
        diamond
          ? 'bg-(--charcoal) border-violet-500/50 text-white shadow-2xl shadow-violet-900/30'
          : featured
            ? 'bg-(--card) border-emerald-500 shadow-xl shadow-emerald-500/10 z-10'
            : 'bg-(--card) border-(--border) shadow-lg shadow-(--charcoal)/5'
      }`}
    >
      {featured && !diamond && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
          Default
        </div>
      )}
      {diamond && (
        <div className="absolute top-0 right-0 bg-linear-to-bl from-violet-500 to-violet-600 text-white px-5 py-2.5 rounded-bl-4xl rounded-tr-[2.4rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md">
          <Gem size={14} className="fill-white/20" /> Diamond
        </div>
      )}
      {savings && (
        <div
          className={`absolute top-8 right-8 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
            diamond
              ? 'bg-violet-900/50 text-violet-300 border border-violet-500/30'
              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
          }`}
        >
          {savings}
        </div>
      )}
      <div className="mb-6">
        <h3 className={`text-xl md:text-2xl font-black mb-1 tracking-tight ${diamond ? 'text-white' : 'text-(--foreground)'}`}>{title}</h3>
        <p className={`text-sm font-medium ${diamond ? 'text-white/60' : 'text-(--muted)'}`}>{desc}</p>
      </div>
      <div className="mb-6">
        <div className="text-4xl font-black tracking-tighter tabular-nums" style={{ color: diamond ? 'white' : 'inherit' }}>
          {price}
        </div>
        <span className={`text-xs font-bold mt-1.5 block uppercase tracking-wide ${diamond ? 'text-white/50' : 'text-(--muted)'}`}>{subPrice}</span>
      </div>
      <div className="flex-1 space-y-3 mb-8">
        {features.map((feat, i) => (
          <div key={i} className="flex items-start gap-3">
            <div
              className={`mt-0.5 p-1 rounded-full shrink-0 ${diamond ? 'bg-violet-500/20 text-violet-300' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500'}`}
            >
              <Check size={14} strokeWidth={4} />
            </div>
            <span className={`text-sm font-medium leading-relaxed ${diamond ? 'text-white/85' : 'text-(--foreground)'}`}>{feat}</span>
          </div>
        ))}
      </div>
      {payButton ? (
        <button
          type="button"
          disabled={payButton.disabled}
          onClick={payButton.onClick}
          className={`w-full py-3.5 rounded-2xl flex items-center justify-center font-bold text-sm uppercase tracking-wide transition-all text-center disabled:opacity-50 ${
            diamond
              ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30'
              : 'bg-(--charcoal) text-white'
          }`}
        >
          {payButton.label}
        </button>
      ) : href ? (
        <Link
          href={href}
          className={`w-full py-3.5 rounded-2xl flex items-center justify-center font-bold text-sm uppercase tracking-wide transition-all text-center ${
            diamond
              ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30'
              : featured
                ? 'bg-(--charcoal) hover:opacity-90 text-white'
                : 'bg-(--card) border-2 border-(--border) hover:border-(--foreground)/20 text-(--foreground)'
          }`}
        >
          {cta}
        </Link>
      ) : (
        <p className="w-full py-3.5 rounded-2xl text-center text-sm font-bold uppercase tracking-wide text-(--muted) border border-(--border) border-dashed">
          {cta}
        </p>
      )}
    </div>
  );
  return content;
}
