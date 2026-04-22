'use client';

import Link from 'next/link';
import { CheckCircle2, X } from 'lucide-react';

export type PostPublishResultTone = 'emerald' | 'amber' | 'violet';

type Action = { label: string; href: string };

export function PostPublishResultSheet({
  open,
  onClose,
  title,
  description,
  tone,
  primaryAction,
  secondaryAction,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  tone: PostPublishResultTone;
  primaryAction: Action;
  secondaryAction?: Action;
}) {
  if (!open) return null;

  const ring =
    tone === 'amber'
      ? 'border-amber-400/60 bg-amber-500/15'
      : tone === 'violet'
        ? 'border-violet-400/60 bg-violet-500/15'
        : 'border-emerald-400/60 bg-emerald-500/15';
  const icon =
    tone === 'amber' ? 'text-amber-600 dark:text-amber-400' : tone === 'violet' ? 'text-violet-600 dark:text-violet-400' : 'text-emerald-600 dark:text-emerald-400';
  const primaryBtn =
    tone === 'amber'
      ? 'bg-amber-600 text-white hover:bg-amber-700'
      : tone === 'violet'
        ? 'bg-violet-600 text-white hover:bg-violet-700'
        : 'bg-emerald-600 text-white hover:bg-emerald-700';

  return (
    <div className="fixed inset-0 z-200 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <button type="button" aria-label="Dismiss" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-result-title"
        className="relative z-201 w-full max-w-md rounded-t-3xl border border-(--border) bg-(--card) p-6 shadow-2xl sm:rounded-3xl"
      >
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1 text-(--muted) hover:bg-(--surface) hover:text-(--foreground)" aria-label="Close">
          <X size={20} />
        </button>
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border ${ring}`}>
          <CheckCircle2 size={32} className={icon} strokeWidth={2.2} />
        </div>
        <h2 id="publish-result-title" className="mt-4 text-center text-xl font-black text-(--foreground)">
          {title}
        </h2>
        {description ? <p className="mt-2 text-center text-sm font-medium leading-relaxed text-(--muted)">{description}</p> : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href={primaryAction.href}
            onClick={onClose}
            className={`inline-flex h-12 flex-1 items-center justify-center rounded-xl px-4 text-sm font-black ${primaryBtn}`}
          >
            {primaryAction.label}
          </Link>
          {secondaryAction ? (
            <Link
              href={secondaryAction.href}
              onClick={onClose}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-(--border) bg-(--surface) px-4 text-sm font-black text-(--foreground) hover:bg-(--card)"
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
