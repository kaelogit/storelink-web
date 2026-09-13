'use client';

import Link from 'next/link';
import { ChevronRight, FileText, HandCoins, ShieldAlert } from 'lucide-react';
import {
  formatBookingRef,
  formatClawbackAmount,
  formatClawbackReason,
  getClawbackBodyCopy,
  getClawbackHeadline,
  getClawbackSecondaryCopy,
  type ClawbackDebtPreview,
} from '@/lib/clawbackExplanation';

export function ClawbackExplanationCard({
  debt,
  variant = 'full',
  showPolicyLink = true,
  showRepayAction = false,
  showViewBookingAction = false,
  repayHref = '/app/seller/clawback-due',
}: {
  debt: ClawbackDebtPreview;
  variant?: 'full' | 'compact';
  showPolicyLink?: boolean;
  showRepayAction?: boolean;
  showViewBookingAction?: boolean;
  repayHref?: string;
}) {
  const isOpen = debt.status === 'open';
  const cardClass = isOpen
    ? 'border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-950/40'
    : debt.status === 'paid'
      ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-950/30'
      : 'border-(--border) bg-(--surface)';
  const accent = isOpen ? 'text-red-600' : debt.status === 'paid' ? 'text-emerald-600' : 'text-(--muted)';

  return (
    <div className={`rounded-2xl border p-4 ${cardClass}`}>
      <div className="flex items-start gap-2">
        {isOpen ? <ShieldAlert size={20} className={`mt-0.5 shrink-0 ${accent}`} strokeWidth={2.5} /> : <HandCoins size={20} className={`mt-0.5 shrink-0 ${accent}`} strokeWidth={2.2} />}
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-black ${accent}`}>{getClawbackHeadline(debt.status)}</p>
          <p className="mt-1 text-sm text-(--foreground)">{getClawbackBodyCopy(debt.status)}</p>
          {variant === 'full' ? <p className="mt-2 text-sm text-(--muted)">{getClawbackSecondaryCopy()}</p> : null}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-(--border) bg-(--background) p-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-(--muted)">
          Amount {isOpen ? 'due' : debt.status === 'paid' ? 'repaid' : 'waived'}
        </p>
        <p className="text-xl font-black text-(--foreground)">{formatClawbackAmount(debt)}</p>
        <div className="mt-2 flex justify-between gap-3 text-sm">
          <span className="font-bold text-(--muted)">Booking</span>
          <span className="font-semibold text-(--foreground)">{formatBookingRef(debt.service_order_id)}</span>
        </div>
        <div className="mt-1 flex justify-between gap-3 text-sm">
          <span className="shrink-0 font-bold text-(--muted)">Why</span>
          <span className="text-right font-semibold text-(--foreground)">{formatClawbackReason(debt.reason)}</span>
        </div>
      </div>

      {showPolicyLink ? (
        <Link href="/terms" className="mt-3 flex items-center gap-2 rounded-xl border border-(--border) px-3 py-3 text-sm font-semibold text-(--muted)">
          <FileText size={16} />
          <span className="flex-1">Read service & dispute policy</span>
          <ChevronRight size={16} />
        </Link>
      ) : null}

      {showRepayAction && isOpen ? (
        <Link href={repayHref} className="mt-3 flex h-11 items-center justify-center rounded-xl bg-emerald-600 text-xs font-black tracking-widest text-white">
          REPAY NOW
        </Link>
      ) : null}

      {showViewBookingAction ? (
        <Link
          href={`/app/bookings/${encodeURIComponent(debt.service_order_id)}`}
          className="mt-2 flex items-center gap-2 text-sm font-bold text-emerald-600"
        >
          <span className="flex-1">View booking details</span>
          <ChevronRight size={16} />
        </Link>
      ) : null}
    </div>
  );
}
