'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, Info, Plus, UserCheck, X, Zap } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { uploadFileToR2 } from '@/lib/mediaUpload';
import { withDrawerParam } from '@/components/profile-web/profileHubPaths';
import { CLAWBACK_SUPPORT_RETURN, clawbackSupportParams } from '@/lib/clawbackSupportRoutes';
import Button from '@/components/ui/Button';

const MAX_SHOTS = 3;
const MIN_MESSAGE = 10;

const categories = [
  { id: 'PAYMENT', label: 'Payment', Icon: CreditCard },
  { id: 'IDENTITY', label: 'Identity', Icon: UserCheck },
  { id: 'TECHNICAL', label: 'App issue', Icon: Zap },
  { id: 'GENERAL', label: 'Other', Icon: Info },
] as const;

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

export default function SupportNewPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const fromClawback = searchParams.get('fromClawback') === '1' || searchParams.get('fromClawback') === 'true';
  const targetUserId = searchParams.get('targetUserId');
  const reportChatId = searchParams.get('chatId');
  const refId = searchParams.get('refId');

  const [category, setCategory] = useState<string>(searchParams.get('category') || '');
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [message, setMessage] = useState(searchParams.get('prefilledMessage') || searchParams.get('message') || '');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fromClawback || searchParams.get('prefilledMessage') || searchParams.get('category')) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc('get_my_open_clawback_debt');
      if (cancelled || !data) return;
      const params = clawbackSupportParams(data as any);
      setCategory(params.category);
      setSubject(params.subject);
      setMessage(params.prefilledMessage);
    })();
    return () => {
      cancelled = true;
    };
  }, [fromClawback, searchParams, supabase]);

  const canSubmit = Boolean(category && subject.trim() && message.trim().length >= MIN_MESSAGE);

  const uploadShot = async (file: File, userId: string, index: number) => {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${userId}/support_${Date.now()}_${index}.${ext}`;
    return uploadFileToR2(file, `chat-attachments/${path}`);
  };

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id;
      if (!uid) throw new Error('Sign in required.');

      try {
        const { data } = await supabase.rpc('check_and_log_action', {
          p_user_id: uid,
          p_action: 'support_ticket_submit',
          p_limit: 5,
          p_window_seconds: 86400,
          p_target_key: category || 'GENERAL',
          p_metadata: { category, subject },
        });
        if ((data as { allowed?: boolean } | null)?.allowed === false) {
          const retry = (data as { retry_after_seconds?: number } | null)?.retry_after_seconds ?? 60;
          throw new Error(`You have submitted too many tickets. Try again in ${retry}s.`);
        }
      } catch (rateErr: any) {
        if (String(rateErr?.message || '').includes('too many')) throw rateErr;
      }

      if (category === 'SAFETY' && targetUserId) {
        try {
          await supabase.rpc('submit_abuse_report', {
            p_reporter_id: uid,
            p_subject_user_id: targetUserId,
            p_category: 'SAFETY',
            p_details: message.trim(),
            p_source: reportChatId ? 'chat_request' : 'profile_report',
            p_target_id: reportChatId || null,
          });
        } catch {
          // ticket still submits
        }
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
          subject: subject.trim(),
          message: body,
          status: 'open',
          priority: category === 'PAYMENT' || category === 'IDENTITY' ? 'high' : 'normal',
          reference_id: refId || null,
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

      if (fromClawback) {
        router.push(CLAWBACK_SUPPORT_RETURN);
        return;
      }
      const next = fromDrawer ? withDrawerParam('/app/activity/support-history') : '/app/activity/support-history';
      router.push(next);
    } catch (e: any) {
      setError(e?.message || 'Could not submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <p className="mb-4 text-sm text-(--muted)">Tell us what went wrong and we will reply in your support thread.</p>
      {error ? <p className="mb-3 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {categories.map(({ id, label, Icon }) => {
          const selected = category === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setCategory(id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold ${
                selected ? 'border-(--foreground) bg-(--surface) text-(--foreground)' : 'border-(--border) bg-(--card) text-(--muted)'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </div>
      {category === 'SAFETY' ? (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          This report is marked as a safety issue.
        </p>
      ) : null}

      <label className="mb-3 block">
        <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Subject</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="h-11 w-full rounded-xl border border-(--border) bg-(--card) px-3 text-sm text-(--foreground) outline-none"
          placeholder="Subject (e.g. Missing payout)"
        />
      </label>

      <label className="mb-2 block">
        <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Details</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="w-full rounded-xl border border-(--border) bg-(--card) px-3 py-2 text-sm text-(--foreground) outline-none"
          placeholder="Describe the issue..."
        />
      </label>
      <p className="mb-4 text-xs text-(--muted)">{message.trim().length}/{MIN_MESSAGE} minimum characters</p>

      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Screenshots (optional)</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {files.map((file, i) => (
          <ShotPreview
            key={`${file.name}-${file.size}-${i}`}
            file={file}
            onRemove={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
          />
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

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={() => void onSubmit()} disabled={!canSubmit || submitting}>
          {submitting ? 'Submitting…' : 'Submit ticket'}
        </Button>
      </div>
    </div>
  );
}
