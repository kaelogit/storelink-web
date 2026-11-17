'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Paperclip, Send, ShoppingBag, Smile } from 'lucide-react';
import { WebAttachmentTray, type StagedAttachment } from '@/components/chat/WebAttachmentTray';
import { ICON_STROKE } from '@/lib/iconChrome';

const QUICK_EMOJI = ['👍', '🙏', '😂', '🔥', '❤️', '✅', '👏', '😊'];

type ChatMessageComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSendText: () => void;
  onPickImage: (file: File, caption?: string) => void;
  sending?: boolean;
  uploadingImage?: boolean;
  replyTo: { id: string; snippet: string } | null;
  onClearReply: () => void;
  showCommerceAttach?: boolean;
  onOpenCommercePicker?: () => void;
  /** Gap 8: hide photo / listing attach until partner accepts */
  allowAttachments?: boolean;
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
  allowAttachments = true,
}: ChatMessageComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<StagedAttachment[]>([]);
  const [stageCaption, setStageCaption] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const busy = sending || uploadingImage;

  useEffect(() => {
    return () => {
      staged.forEach((s) => URL.revokeObjectURL(s.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearStaged = useCallback(() => {
    setStaged((prev) => {
      prev.forEach((s) => URL.revokeObjectURL(s.previewUrl));
      return [];
    });
    setStageCaption('');
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 3);
    if (list.length === 0) return;
    setStaged((prev) => {
      const room = Math.max(0, 3 - prev.length);
      const next = list.slice(0, room).map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...prev, ...next].slice(0, 3);
    });
  }, []);

  const sendStaged = useCallback(async () => {
    if (staged.length === 0 || busy) return;
    const caption = stageCaption.trim();
    const files = [...staged];
    clearStaged();
    for (let i = 0; i < files.length; i++) {
      onPickImage(files[i].file, i === 0 ? caption || undefined : undefined);
    }
  }, [busy, clearStaged, onPickImage, stageCaption, staged]);

  if (staged.length > 0) {
    return (
      <WebAttachmentTray
        items={staged}
        caption={stageCaption}
        onCaptionChange={setStageCaption}
        onRemove={(id) => {
          setStaged((prev) => {
            const hit = prev.find((p) => p.id === id);
            if (hit) URL.revokeObjectURL(hit.previewUrl);
            return prev.filter((p) => p.id !== id);
          });
        }}
        onSend={() => void sendStaged()}
        onCancel={clearStaged}
        sending={busy}
      />
    );
  }

  return (
    <div className="border-t border-(--border) bg-(--card) p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {replyTo ? (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-(--border) bg-(--surface) px-2 py-1.5">
          <p className="truncate text-xs text-(--muted)">Replying to: {replyTo.snippet}</p>
          <button type="button" onClick={onClearReply} className="text-xs font-semibold text-(--muted)">
            Cancel
          </button>
        </div>
      ) : null}
      {!allowAttachments ? (
        <p className="mb-2 text-[11px] font-semibold text-(--muted)">
          Text only until they accept your message request.
        </p>
      ) : null}
      {emojiOpen ? (
        <div className="mb-2 flex flex-wrap gap-1 rounded-sl-xl border border-(--border) bg-(--surface) p-2">
          {QUICK_EMOJI.map((e) => (
            <button
              key={e}
              type="button"
              className="rounded-lg px-2 py-1 text-lg hover:bg-(--card)"
              onClick={() => {
                onDraftChange(`${draft}${e}`);
                setEmojiOpen(false);
              }}
            >
              {e}
            </button>
          ))}
        </div>
      ) : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSendText();
        }}
        className="flex items-center gap-2"
      >
        {allowAttachments ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sl-xl border border-(--border) bg-(--surface) text-(--foreground) disabled:opacity-50"
              aria-label="Attach photo"
            >
              {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} strokeWidth={ICON_STROKE.chrome} />}
            </button>
            {showCommerceAttach && onOpenCommercePicker ? (
              <button
                type="button"
                disabled={busy}
                onClick={onOpenCommercePicker}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sl-xl border border-(--border) bg-(--surface) text-(--foreground) disabled:opacity-50"
                aria-label="Share listing"
              >
                <ShoppingBag size={16} strokeWidth={ICON_STROKE.chrome} />
              </button>
            ) : null}
          </>
        ) : null}
        <button
          type="button"
          onClick={() => setEmojiOpen((v) => !v)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sl-xl border border-(--border) bg-(--surface) text-(--foreground)"
          aria-label="Emoji"
        >
          <Smile size={16} strokeWidth={ICON_STROKE.chrome} />
        </button>
        <input
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Type a message"
          className="h-11 w-full rounded-sl-xl border border-(--border) bg-(--surface) px-3 text-sm text-(--foreground) outline-none placeholder:text-(--muted)"
        />
        <button
          type="submit"
          disabled={!draft.trim() || busy}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sl-xl bg-emerald-600 text-white disabled:opacity-50"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} strokeWidth={ICON_STROKE.chromeActive} />}
        </button>
      </form>
      {showCommerceAttach && allowAttachments ? (
        <p className="mt-1.5 flex items-center gap-1 text-[10px] text-(--muted)">
          <Paperclip size={10} />
          Share photos or listings with buyers in Primary chats.
        </p>
      ) : null}
    </div>
  );
}
