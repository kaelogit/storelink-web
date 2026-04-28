'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, Info, UserCheck, Zap } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { withDrawerParam } from '@/components/profile-web/profileHubPaths';
import Button from '@/components/ui/Button';

const categories = [
  { id: 'PAYMENT', label: 'Payment', Icon: CreditCard },
  { id: 'IDENTITY', label: 'Identity', Icon: UserCheck },
  { id: 'TECHNICAL', label: 'App issue', Icon: Zap },
  { id: 'GENERAL', label: 'Other', Icon: Info },
] as const;

export default function SupportNewPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';

  const [category, setCategory] = useState<string>(searchParams.get('category') || '');
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = Boolean(category && subject.trim() && message.trim().length >= 10);

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id;
      if (!uid) throw new Error('Sign in required.');

      const body = message.trim();
      const { data: ticketRow, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: uid,
          category,
          subject: subject.trim(),
          message: body,
          status: 'open',
          priority: category === 'PAYMENT' || category === 'IDENTITY' ? 'high' : 'normal',
        })
        .select('id')
        .single();
      if (error) throw error;

      if (ticketRow?.id) {
        await supabase.from('support_messages').insert({
          ticket_id: ticketRow.id,
          sender_id: uid,
          message: body,
          is_admin_reply: false,
        });
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
      <p className="mb-4 text-xs text-(--muted)">{message.trim().length}/10 minimum characters</p>

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
