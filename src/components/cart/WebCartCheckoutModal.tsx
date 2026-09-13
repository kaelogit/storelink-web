'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import {
  cartCheckoutStepLabel,
  resolveCartCheckoutSteps,
  type CartCheckoutStepId,
} from '@/lib/cartCheckoutSteps';

function WebCartCheckoutStepper({
  steps,
  activeIndex,
}: {
  steps: CartCheckoutStepId[];
  activeIndex: number;
}) {
  if (steps.length <= 1) return null;
  return (
    <div className="flex items-center gap-3" role="tablist" aria-label="Checkout steps">
      {steps.map((id, i) => {
        const on = i === activeIndex;
        const done = i < activeIndex;
        return (
          <div key={id} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span
              className={`h-2 w-2 rounded-full border ${
                on || done
                  ? 'border-(--foreground) bg-(--foreground)'
                  : 'border-(--border) bg-transparent'
              }`}
            />
            <span
              className={`truncate text-[10px] tracking-wide ${
                on ? 'font-black text-(--foreground)' : 'font-semibold text-(--muted)'
              }`}
            >
              {cartCheckoutStepLabel(id)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export type WebCartCheckoutModalProps = {
  open: boolean;
  sellerName: string;
  kind: 'products' | 'services';
  needsDelivery: boolean;
  needsWhen: boolean;
  sessionKey: string;
  initialStepIndex?: number;
  renderDelivery?: () => React.ReactNode;
  renderWhen?: () => React.ReactNode;
  renderReview: () => React.ReactNode;
  validateDelivery?: () => string | null;
  validateWhen?: () => string | null;
  onClose: () => void;
  onCommit: () => void | Promise<void>;
  onStepIndexChange?: (stepIndex: number, stepId: CartCheckoutStepId) => void;
  onContinue?: (from: CartCheckoutStepId, to: CartCheckoutStepId) => void;
  onAbandon?: (stepId: CartCheckoutStepId) => void;
  commitLabel: string;
  commitHint?: string;
  committing?: boolean;
  commitDisabled?: boolean;
};

/**
 * Option B checkout spine (web modal).
 * Delivery → When → Review — skip unused steps.
 */
export function WebCartCheckoutModal({
  open,
  sellerName,
  kind,
  needsDelivery,
  needsWhen,
  sessionKey,
  initialStepIndex = 0,
  renderDelivery,
  renderWhen,
  renderReview,
  validateDelivery,
  validateWhen,
  onClose,
  onCommit,
  onStepIndexChange,
  onContinue,
  onAbandon,
  commitLabel,
  commitHint,
  committing = false,
  commitDisabled = false,
}: WebCartCheckoutModalProps) {
  const steps = useMemo(
    () => resolveCartCheckoutSteps({ needsDelivery, needsWhen }),
    [needsDelivery, needsWhen],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);

  const abandon = useCallback(() => {
    const id = steps[stepIndex];
    if (id) onAbandon?.(id);
    onClose();
  }, [steps, stepIndex, onAbandon, onClose]);

  useEffect(() => {
    if (!open) return;
    const start = Math.min(Math.max(0, initialStepIndex), Math.max(0, steps.length - 1));
    setStepIndex(start);
    setStepError(null);
  }, [open, sessionKey, steps, initialStepIndex]);

  useEffect(() => {
    if (!open) return;
    const id = steps[stepIndex];
    if (id) onStepIndexChange?.(stepIndex, id);
  }, [open, stepIndex, steps, onStepIndexChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') abandon();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, abandon]);

  if (!open) return null;

  const active = steps[stepIndex] ?? 'review';
  const isLast = stepIndex >= steps.length - 1;

  const goBack = () => {
    setStepError(null);
    if (stepIndex <= 0) {
      abandon();
      return;
    }
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const goContinue = () => {
    if (active === 'delivery' && validateDelivery) {
      const err = validateDelivery();
      if (err) {
        setStepError(err);
        return;
      }
    }
    if (active === 'when' && validateWhen) {
      const err = validateWhen();
      if (err) {
        setStepError(err);
        return;
      }
    }
    setStepError(null);
    if (isLast) {
      void onCommit();
      return;
    }
    const nextIndex = Math.min(steps.length - 1, stepIndex + 1);
    const nextId = steps[nextIndex];
    if (active && nextId) onContinue?.(active, nextId);
    setStepIndex(nextIndex);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${kind === 'products' ? 'Order' : 'Booking'} checkout`}
      onClick={abandon}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-(--border) bg-(--background) shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-(--border) px-4 py-3">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--border)"
            aria-label={stepIndex <= 0 ? 'Back to bag' : 'Previous step'}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-xs font-black tracking-wide text-(--foreground)">
              {String(sellerName || 'Checkout').toUpperCase()}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold text-(--muted)">
              {kind === 'products' ? 'Product checkout' : 'Service checkout'}
            </p>
          </div>
          <button
            type="button"
            onClick={abandon}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--border)"
            aria-label="Close checkout"
          >
            <X size={16} />
          </button>
        </div>

        <div className="border-b border-(--border) px-4 py-3">
          <WebCartCheckoutStepper steps={steps} activeIndex={stepIndex} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {active === 'delivery' ? renderDelivery?.() : null}
          {active === 'when' ? renderWhen?.() : null}
          {active === 'review' ? renderReview() : null}
          {stepError ? (
            <p className="mt-3 text-xs font-semibold text-red-500" role="alert">
              {stepError}
            </p>
          ) : null}
        </div>

        <div className="border-t border-(--border) px-4 py-3">
          <button
            type="button"
            onClick={goContinue}
            disabled={commitDisabled || committing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-(--foreground) py-3 text-xs font-black text-(--background) disabled:opacity-50"
          >
            {committing ? (
              'Working…'
            ) : isLast ? (
              commitLabel
            ) : (
              <>
                Continue
                <ArrowRight size={14} />
              </>
            )}
          </button>
          {commitHint && isLast ? (
            <p className="mt-2 text-center text-[11px] font-semibold text-(--muted)">{commitHint}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
