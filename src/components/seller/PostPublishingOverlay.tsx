'use client';

import { Loader2 } from 'lucide-react';

export type PostPublishingTone = 'emerald' | 'amber' | 'violet';

export function PostPublishingOverlay({
  open,
  label,
  progress,
  stage,
  tone,
}: {
  open: boolean;
  label: string;
  progress: number;
  stage: 'uploading' | 'finalizing' | 'compressing' | null;
  tone: PostPublishingTone;
}) {
  if (!open) return null;

  const accent =
    tone === 'amber' ? 'text-amber-500' : tone === 'violet' ? 'text-violet-500' : 'text-emerald-500';
  const bar =
    tone === 'amber' ? 'bg-amber-500' : tone === 'violet' ? 'bg-violet-500' : 'bg-emerald-500';

  const stageLabel =
    stage === 'finalizing' ? 'Finalizing' : stage === 'compressing' ? 'Compressing' : 'Uploading';

  return (
    <div className="fixed inset-0 z-190 flex items-center justify-center bg-black/65 p-6 backdrop-blur-[2px]">
      <div
        role="status"
        aria-live="polite"
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-(--card) px-8 py-8 text-center shadow-2xl"
      >
        <Loader2 className={`mx-auto h-10 w-10 animate-spin ${accent}`} aria-hidden />
        <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-(--foreground)">{label}</p>
        <p className="mt-2 text-sm font-bold text-(--muted)">
          {stageLabel} · {Math.max(1, Math.min(100, progress))}%
        </p>
        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-(--surface)">
          <div className={`h-full rounded-full transition-[width] duration-300 ${bar}`} style={{ width: `${Math.max(1, Math.min(100, progress))}%` }} />
        </div>
        <p className="mt-4 text-xs font-medium text-(--muted)">Hang tight — do not close this tab.</p>
      </div>
    </div>
  );
}
