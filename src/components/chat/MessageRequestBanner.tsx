'use client';

import { Ban, Flag, MessageCircle, Trash2 } from 'lucide-react';

type MessageRequestBannerProps = {
  partnerName?: string | null;
  onReport: () => void;
  onBlock: () => void;
  onDelete: () => void;
};

export function MessageRequestBanner({ partnerName, onReport, onBlock, onDelete }: MessageRequestBannerProps) {
  const label = partnerName?.trim() || 'This person';

  return (
    <div className="mx-4 mb-3 rounded-[14px] border border-(--border) bg-(--surface) p-4">
      <div className="flex items-center gap-2">
        <MessageCircle size={18} className="text-emerald-600" strokeWidth={2.2} />
        <p className="text-sm font-bold text-(--foreground)">Message request</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-(--muted)">
        {label} isn&apos;t someone you follow or have ordered from yet. Reply to move this chat to Primary, or report
        or block if it looks like spam.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onReport}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-(--border) px-2 py-2.5 text-xs font-semibold text-(--foreground)"
        >
          <Flag size={14} className="text-amber-500" />
          Report
        </button>
        <button
          type="button"
          onClick={onBlock}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-(--border) px-2 py-2.5 text-xs font-semibold text-red-500"
        >
          <Ban size={14} />
          Block
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-(--border) px-2 py-2.5 text-xs font-semibold text-(--muted)"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
}
