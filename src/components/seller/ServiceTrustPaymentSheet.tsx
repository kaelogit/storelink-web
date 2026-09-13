'use client';

import { ShieldCheck, X } from 'lucide-react';
import type { DepositMode } from '@/lib/depositPaymentHolds';
import {
  cancellationPolicyPlaceholder,
  depositPolicyPlaceholder,
} from '@/lib/serviceTrustPaymentCopy';

export type ServiceTrustPaymentSheetProps = {
  open: boolean;
  onClose: () => void;
  serviceCategory: string;
  contentLocked?: boolean;
  cancellationPolicy: string;
  onCancellationPolicyChange: (value: string) => void;
  depositEnabled: boolean;
  onDepositEnabledChange: (value: boolean) => void;
  depositMode: DepositMode;
  onDepositModeChange: (mode: DepositMode) => void;
  depositPercentInput: string;
  onDepositPercentChange: (value: string) => void;
  depositFixedMajor: string;
  onDepositFixedChange: (value: string) => void;
  depositPolicy: string;
  onDepositPolicyChange: (value: string) => void;
};

/** Nested editor for cancellation + deposit — keeps post-service main canvas clean. */
export function ServiceTrustPaymentSheet({
  open,
  onClose,
  serviceCategory,
  contentLocked,
  cancellationPolicy,
  onCancellationPolicyChange,
  depositEnabled,
  onDepositEnabledChange,
  depositMode,
  onDepositModeChange,
  depositPercentInput,
  onDepositPercentChange,
  depositFixedMajor,
  onDepositFixedChange,
  depositPolicy,
  onDepositPolicyChange,
}: ServiceTrustPaymentSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl border border-(--border) bg-(--card) sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trust-payment-title"
      >
        <div className="flex items-center justify-between border-b border-(--border) px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-(--muted)" />
            <h2 id="trust-payment-title" className="text-sm font-black text-(--foreground)">
              Trust & payment
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--border) text-(--foreground)"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-4 py-4">
          <p className="text-xs font-semibold leading-relaxed text-(--muted)">
            Shown to buyers before they request or pay. Platform escrow rules still apply.
            {contentLocked ? ' Editable while the listing is locked.' : ''}
          </p>

          <div>
            <label className="text-xs font-black tracking-widest text-(--muted)">
              CANCELLATION POLICY (OPTIONAL)
            </label>
            <textarea
              value={cancellationPolicy}
              onChange={(e) => onCancellationPolicyChange(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={3}
              className="mt-2 w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm font-semibold text-(--foreground)"
              placeholder={cancellationPolicyPlaceholder(serviceCategory)}
            />
          </div>

          <div>
            <label className="text-xs font-black tracking-widest text-(--muted)">
              DEPOSIT TO HOLD BOOKING (OPTIONAL)
            </label>
            <p className="mt-1 text-xs text-(--muted)">
              Buyers pay this deposit into escrow after you confirm to hold the booking. The balance is
              due before work can start. You still get paid on start/complete — not when the deposit lands.
            </p>
            <label className="mt-3 flex items-center justify-between rounded-2xl border border-(--border) bg-(--surface) px-4 py-3">
              <span className="text-sm font-bold text-(--foreground)">Require a deposit</span>
              <input
                type="checkbox"
                checked={depositEnabled}
                onChange={(e) => onDepositEnabledChange(e.target.checked)}
                className="h-4 w-4 accent-emerald-600"
              />
            </label>
            {depositEnabled ? (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {(['percent', 'fixed'] as DepositMode[]).map((mode) => {
                    const on = depositMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => onDepositModeChange(mode)}
                        className={`h-9 rounded-full border px-3 text-xs font-bold ${
                          on
                            ? 'border-(--foreground) bg-(--foreground) text-(--background)'
                            : 'border-(--border) bg-(--surface) text-(--foreground)'
                        }`}
                      >
                        {mode === 'percent' ? 'Percent' : 'Fixed amount'}
                      </button>
                    );
                  })}
                </div>
                {depositMode === 'percent' ? (
                  <input
                    value={depositPercentInput}
                    onChange={(e) =>
                      onDepositPercentChange(e.target.value.replace(/[^\d.]/g, '').slice(0, 5))
                    }
                    inputMode="decimal"
                    placeholder="Percent (e.g. 30)"
                    className="h-11 w-full rounded-xl border border-(--border) bg-(--surface) px-4 text-sm font-semibold text-(--foreground)"
                  />
                ) : (
                  <input
                    value={depositFixedMajor}
                    onChange={(e) => onDepositFixedChange(e.target.value.replace(/[^\d.]/g, ''))}
                    inputMode="decimal"
                    placeholder="Deposit amount (₦)"
                    className="h-11 w-full rounded-xl border border-(--border) bg-(--surface) px-4 text-sm font-semibold text-(--foreground)"
                  />
                )}
              </div>
            ) : null}
          </div>

          <div>
            <label className="text-xs font-black tracking-widest text-(--muted)">
              DEPOSIT / PAYMENT NOTE (OPTIONAL)
            </label>
            <textarea
              value={depositPolicy}
              onChange={(e) => onDepositPolicyChange(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={3}
              className="mt-2 w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm font-semibold text-(--foreground)"
              placeholder={depositPolicyPlaceholder(serviceCategory)}
            />
          </div>
        </div>

        <div className="border-t border-(--border) p-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-full rounded-xl bg-(--foreground) text-sm font-black text-(--background)"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
