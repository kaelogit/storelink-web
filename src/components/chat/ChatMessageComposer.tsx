'use client';

import { useRef } from 'react';
import { Camera, Loader2, Paperclip, Send, ShoppingBag } from 'lucide-react';

type ChatMessageComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSendText: () => void;
  onPickImage: (file: File) => void;
  sending?: boolean;
  uploadingImage?: boolean;
  replyTo: { id: string; snippet: string } | null;
  onClearReply: () => void;
  showCommerceAttach?: boolean;
  onOpenCommercePicker?: () => void;
};

export function ChatMessageComposer({
  draft,
  onDraftChange,
  onSendText,
  onPickImage,
  sending = false,
  uploadingImage = false,
  replyTo,
  onClearReply,
  showCommerceAttach = false,
  onOpenCommercePicker,
}: ChatMessageComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busy = sending || uploadingImage;

  return (
    <div className="border-t border-(--border) bg-(--card) p-3">
      {replyTo ? (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-(--border) bg-(--surface) px-2 py-1.5">
          <p className="truncate text-xs text-(--muted)">Replying to: {replyTo.snippet}</p>
          <button type="button" onClick={onClearReply} className="text-xs font-semibold text-(--muted)">
            Cancel
          </button>
        </div>
      ) : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSendText();
        }}
        className="flex items-center gap-2"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPickImage(file);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-(--border) bg-(--surface) text-(--foreground) disabled:opacity-50"
          aria-label="Attach photo"
        >
          {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
        </button>
        {showCommerceAttach && onOpenCommercePicker ? (
          <button
            type="button"
            disabled={busy}
            onClick={onOpenCommercePicker}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-(--border) bg-(--surface) text-(--foreground) disabled:opacity-50"
            aria-label="Share listing"
          >
            <ShoppingBag size={16} />
          </button>
        ) : null}
        <input
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Type a message"
          className="h-11 w-full rounded-xl border border-(--border) bg-(--surface) px-3 text-sm text-(--foreground) outline-none placeholder:text-(--muted)"
        />
        <button
          type="submit"
          disabled={!draft.trim() || busy}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white disabled:opacity-50"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
      {showCommerceAttach ? (
        <p className="mt-1.5 flex items-center gap-1 text-[10px] text-(--muted)">
          <Paperclip size={10} />
          Share photos or listings with buyers in Primary chats.
        </p>
      ) : null}
    </div>
  );
}
