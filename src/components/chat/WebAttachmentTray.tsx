'use client';

import { useMemo } from 'react';
import { Send, X } from 'lucide-react';
import { ICON_STROKE } from '@/lib/iconChrome';

export type StagedAttachment = {
  id: string;
  file: File;
  previewUrl: string;
};

type Props = {
  items: StagedAttachment[];
  caption: string;
  onCaptionChange: (v: string) => void;
  onRemove: (id: string) => void;
  onSend: () => void;
  onCancel: () => void;
  sending?: boolean;
};

/** Mobile AttachmentTray language: hero + 2-up rail + caption/send. */
export function WebAttachmentTray({
  items,
  caption,
  onCaptionChange,
  onRemove,
  onSend,
  onCancel,
  sending = false,
}: Props) {
  const hero = items[0] || null;
  const rail = useMemo(() => items.slice(1, 3), [items]);

  if (!hero) return null;

  return (
    <div className="border-t border-(--border) bg-(--card) px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-(--muted)">
          {items.length} {items.length === 1 ? 'photo' : 'photos'}
        </p>
        <button type="button" onClick={onCancel} className="text-xs font-bold text-(--muted)" aria-label="Cancel attach">
          Cancel
        </button>
      </div>
      <div className="relative mb-2 overflow-hidden rounded-sl-2xl bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={hero.previewUrl} alt="" className="max-h-[220px] w-full object-contain" />
        <button
          type="button"
          onClick={() => onRemove(hero.id)}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white"
          aria-label="Remove photo"
        >
          <X size={16} strokeWidth={ICON_STROKE.chrome} />
        </button>
      </div>
      {rail.length > 0 ? (
        <div className="mb-2 grid grid-cols-2 gap-2">
          {rail.map((item) => (
            <div key={item.id} className="relative overflow-hidden rounded-sl-xl bg-(--surface)">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.previewUrl} alt="" className="h-24 w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white"
                aria-label="Remove photo"
              >
                <X size={14} strokeWidth={ICON_STROKE.chrome} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <input
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Add a caption…"
          className="h-11 min-w-0 flex-1 rounded-sl-xl border border-(--border) bg-(--surface) px-3 text-sm text-(--foreground) outline-none placeholder:text-(--muted)"
        />
        <button
          type="button"
          disabled={sending}
          onClick={onSend}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sl-xl bg-emerald-600 text-white disabled:opacity-50"
          aria-label="Send photos"
        >
          <Send size={16} strokeWidth={ICON_STROKE.chromeActive} />
        </button>
      </div>
    </div>
  );
}
