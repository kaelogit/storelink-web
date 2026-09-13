'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { uploadFileToR2 } from '@/lib/mediaUpload';
import SettingsFrame, { useSettingsDrawer } from '../../SettingsFrame';
import Button from '@/components/ui/Button';

const MAX_SHOTS = 3;
const MIN_MESSAGE = 10;

function ShotPreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  if (!url) return <div className="h-20 w-20 rounded-xl border border-(--border) bg-(--surface)" />;
  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-(--border)">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
        aria-label="Remove screenshot"
      >
        <X size={12} />
      </button>
    </div>
  );
}

export default function FeedbackSubmitClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { wrap } = useSettingsDrawer();
  const supabase = useMemo(() => createBrowserClient(), []);
  const isIssue = searchParams.get('type') !== 'suggestion';
  const defaultSubject = isIssue ? 'App issue' : 'Product suggestion';
  const category = isIssue ? 'TECHNICAL' : 'SUGGESTION';
  const priority = isIssue ? 'normal' : 'low';

  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSubmit = message.trim().length >= MIN_MESSAGE && subject.trim().length > 0;

  const uploadShot = async (file: File, userId: string, index: number) => {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${userId}/feedback_${Date.now()}_${index}.${ext}`;
    return uploadFileToR2(file, `chat-attachments/${path}`);
  };

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error('Sign in required.');

      try {
        const { data } = await supabase.rpc('check_and_log_action', {
          p_user_id: uid,
          p_action: 'support_ticket_submit',
          p_limit: 5,
          p_window_seconds: 86400,
          p_target_key: category,
          p_metadata: { category, subject, source: 'settings_feedback' },
        });
        if ((data as { allowed?: boolean } | null)?.allowed === false) {
          throw new Error('You’ve sent too many reports. Try again later.');
        }
      } catch (rateErr: any) {
        if (String(rateErr?.message || '').includes('too many')) throw rateErr;
      }

      const attachmentUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        try {
          attachmentUrls.push(await uploadShot(files[i], uid, i));
        } catch {
          // submit without that screenshot
        }
      }

      const body = message.trim();
      const { data: ticketRow, error: ticketErr } = await supabase
        .from('support_tickets')
        .insert({
          user_id: uid,
          category,
          subject: subject.trim() || defaultSubject,
          message: body,
          status: 'open',
          priority,
          attachment_urls: attachmentUrls,
        })
        .select('id')
        .single();
      if (ticketErr) throw ticketErr;

      if (ticketRow?.id) {
        await supabase.from('support_messages').insert({
          ticket_id: ticketRow.id,
          sender_id: uid,
          message: body,
          is_admin_reply: false,
        });
      }
      setDone(true);
    } catch (e: any) {
      setError(e?.message || 'Couldn’t send. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <SettingsFrame title={isIssue ? 'Report a technical issue' : 'Help us improve'} parentHref="/app/settings/feedback">
        <p className="mb-4 text-sm text-(--foreground)">
          {isIssue
            ? 'Our team will review your report. You can follow up in Help & support if we reply.'
            : 'Thanks for the suggestion. We read every one.'}
        </p>
        <Button onClick={() => router.push(wrap('/app/settings/feedback'))}>Done</Button>
      </SettingsFrame>
    );
  }

  return (
    <SettingsFrame
      title={isIssue ? 'Report a technical issue' : 'Help us improve'}
      subtitle={
        isIssue
          ? 'Describe the bug and add screenshots if you have them.'
          : 'Share an idea. Screenshots of mockups or examples are welcome.'
      }
      parentHref="/app/settings/feedback"
    >
      {error ? <p className="mb-3 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}
      <label className="mb-4 block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-(--muted)">Subject</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="h-11 w-full rounded-xl border border-(--border) bg-(--surface) px-3 text-sm font-semibold text-(--foreground) outline-none"
        />
      </label>
      <label className="mb-2 block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-(--muted)">Details</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder={isIssue ? 'What went wrong? Include steps if you can…' : 'What would make StoreLink better for you?'}
          className="w-full rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--foreground) outline-none"
        />
      </label>
      <p className="mb-4 text-xs text-(--muted)">
        {message.trim().length}/{MIN_MESSAGE} minimum characters
      </p>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-(--muted)">Screenshots (optional)</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {files.map((file, i) => (
          <ShotPreview key={`${file.name}-${file.size}-${i}`} file={file} onRemove={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} />
        ))}
        {files.length < MAX_SHOTS ? (
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-(--border) bg-(--surface) text-(--muted)">
            <Plus size={18} />
            <span className="text-[10px] font-semibold">Add</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const next = e.target.files?.[0];
                if (!next) return;
                setFiles((prev) => (prev.length >= MAX_SHOTS ? prev : [...prev, next]));
                e.target.value = '';
              }}
            />
          </label>
        ) : null}
      </div>
      <Button onClick={() => void submit()} disabled={!canSubmit || busy}>
        {busy ? 'Sending…' : 'Submit'}
      </Button>
    </SettingsFrame>
  );
}
