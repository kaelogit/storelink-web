'use client';

import { AlertTriangle, Check, Clock3, Loader2, RefreshCcw } from 'lucide-react';
import {
  getRefundTimelineSteps,
  type RefundTimelineResult,
  type RefundTimelineStepKey,
} from '@/lib/refundTimeline';

type Props = {
  timeline: RefundTimelineResult;
};

function StepIcon({
  stepKey,
  active,
  complete,
  failed,
}: {
  stepKey: RefundTimelineStepKey;
  active: boolean;
  complete: boolean;
  failed: boolean;
}) {
  if (failed && stepKey === 'failed') return AlertTriangle;
  if (complete) return Check;
  if (active && stepKey === 'processing') return RefreshCcw;
  return Clock3;
}

export default function RefundStatusTimelineWeb({ timeline }: Props) {
  if (!timeline.visible) return null;

  const steps = getRefundTimelineSteps(timeline);
  const wrapClass = timeline.isFailed
    ? 'border-red-500/30 bg-red-500/5'
    : 'border-emerald-500/25 bg-emerald-500/5';

  return (
    <div className={`rounded-2xl border p-4 ${wrapClass}`}>
      <p className="text-sm font-bold text-(--foreground)">{timeline.headline}</p>
      {timeline.detail ? (
        <p className="mt-1 text-xs font-medium leading-relaxed text-(--muted)">{timeline.detail}</p>
      ) : null}

      <div className="mt-3 space-y-3">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isComplete = index < timeline.activeIndex;
          const isActive = index === timeline.activeIndex;
          const isFailedStep = timeline.isFailed && step.key === 'failed';
          const accent = isFailedStep ? 'text-red-500 border-red-500 bg-red-500' : 'text-emerald-600 border-emerald-600 bg-emerald-600';
          const IconComponent = StepIcon({
            stepKey: step.key,
            active: isActive,
            complete: isComplete,
            failed: timeline.isFailed,
          });

          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    isComplete || isActive ? accent : 'border-(--border) bg-(--background)'
                  }`}
                >
                  {isActive && step.key === 'processing' && !timeline.isComplete && !timeline.isFailed ? (
                    <Loader2 size={12} className="animate-spin text-white" />
                  ) : (
                    <IconComponent
                      size={12}
                      strokeWidth={2.5}
                      className={isComplete || isActive ? 'text-white' : 'text-(--muted)'}
                    />
                  )}
                </div>
                {!isLast ? (
                  <div
                    className={`mt-1 w-0.5 flex-1 min-h-6 rounded-full ${
                      isComplete ? (isFailedStep ? 'bg-red-500' : 'bg-emerald-600') : 'bg-(--border)'
                    }`}
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 pb-2">
                <p
                  className={`text-xs font-bold ${
                    isActive || isComplete ? 'text-(--foreground)' : 'text-(--muted)'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[11px] font-medium leading-relaxed text-(--muted)">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
