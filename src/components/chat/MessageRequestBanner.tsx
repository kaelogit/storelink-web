'use client';

import { MESSAGE_REQUEST_BODY, messageRequestHeadline } from '@/lib/messageRequests';

type MessageRequestBannerProps = {
  partnerName?: string | null;
  accepting?: boolean;
  onReport: () => void;
  onDelete: () => void;
  onAccept: () => void;
};

export function MessageRequestBanner({
  partnerName,
  accepting = false,
  onReport,
  onDelete,
  onAccept,
}: MessageRequestBannerProps) {
  return (
    <div className="border-t border-(--border) bg-(--card) px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
      <p className="text-center text-base font-black tracking-tight text-(--foreground)">
        {messageRequestHeadline(partnerName)}
      </p>
      <p className="mt-1 text-center text-sm leading-snug text-(--muted)">{MESSAGE_REQUEST_BODY}</p>
      <div className="mt-3 flex items-center">
        <button
          type="button"
          onClick={onReport}
          disabled={accepting}
          className="flex-1 py-3 text-sm font-semibold text-red-500 disabled:opacity-50"
        >
          Report
        </button>
        <span className="h-4 w-px bg-(--border)" />
        <button
          type="button"
          onClick={onDelete}
          disabled={accepting}
          className="flex-1 py-3 text-sm font-semibold text-(--foreground) disabled:opacity-50"
        >
          Delete
        </button>
        <span className="h-4 w-px bg-(--border)" />
        <button
          type="button"
          onClick={onAccept}
          disabled={accepting}
          className="flex-1 py-3 text-sm font-bold text-(--foreground) disabled:opacity-50"
        >
          {accepting ? 'Accepting…' : 'Accept'}
        </button>
      </div>
    </div>
  );
}
