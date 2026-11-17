'use client';

import { useEffect, useId } from 'react';

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Dialog label for a11y */
  titleId?: string;
  /** Max width of the panel (default max-w-lg) */
  className?: string;
  /** Overlay z-index class (default z-[200]) */
  zClassName?: string;
  showHandle?: boolean;
  /** Extra panel classes (padding, max-height, etc.) */
  panelClassName?: string;
};

/**
 * Shared overlay: bottom sheet on narrow viewports, centered card on sm+.
 * Mobile NativeSheet parity for product web.
 */
export function Sheet({
  open,
  onClose,
  children,
  titleId,
  className = 'max-w-lg',
  zClassName = 'z-[200]',
  showHandle = true,
  panelClassName = '',
}: SheetProps) {
  const autoTitleId = useId();
  const labelledBy = titleId || autoTitleId;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 ${zClassName} flex items-end justify-center sm:items-center`}>
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative z-10 w-full ${className} rounded-t-sl-2xl border border-(--border) bg-(--card) shadow-2xl sm:rounded-sl-2xl ${panelClassName}`}
      >
        {showHandle ? (
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="h-1 w-9 rounded-full bg-(--border)" />
          </div>
        ) : null}
        {/* Hidden fallback label when caller doesn't set titleId on a heading */}
        {!titleId ? (
          <span id={autoTitleId} className="sr-only">
            Dialog
          </span>
        ) : null}
        {children}
      </div>
    </div>
  );
}
