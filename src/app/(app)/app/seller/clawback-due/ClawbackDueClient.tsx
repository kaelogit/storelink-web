'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ChevronRight, Headphones, HelpCircle, MessageSquare, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { PaystackTerminalModal } from '@/components/payments/PaystackTerminalModal';
import { ClawbackExplanationCard } from '@/components/seller/ClawbackExplanationCard';
import Button from '@/components/ui/Button';
import { clawbackSupportHref } from '@/lib/clawbackSupportRoutes';
import type { ClawbackDebtPreview } from '@/lib/clawbackExplanation';
import { fromSmallestUnit } from '@/lib/paystackPublic';

type OpenDebt = ClawbackDebtPreview & {
  order_id?: string;
  seller_id?: string;
  buyer_id?: string;
};

type SupportTicketPreview = {
  id: string;
  subject: string;
  status: string;
  updated_at: string;
};

export default function ClawbackDueClient() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [debt, setDebt] = useState<OpenDebt | null>(null);
  const [tickets, setTickets] = useState<SupportTicketPreview[]>([]);
  const [email, setEmail] = useState('');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [currencyFallback, setCurrencyFallback] = useState('NGN');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setDebt(null);
      return;
    }
    setProfileId(uid);
    setEmail(auth.user?.email || '');
    const [{ data, error: debtErr }, { data: profile }, { data: ticketRows }] = await Promise.all([
      supabase.rpc('get_my_open_clawback_debt'),
      supabase.from('profiles').select('email,currency_code').eq('id', uid).maybeSingle(),
      supabase
        .from('support_tickets')
        .select('id, subject, status, updated_at')
        .eq('user_id', uid)
        .in('status', ['open', 'pending'])
        .order('updated_at', { ascending: false })
        .limit(5),
    ]);
    if (debtErr) throw debtErr;
    setEmail(String(profile?.email || auth.user?.email || ''));
    setCurrencyFallback(String(profile?.currency_code || 'NGN'));
    setDebt((data ?? null) as OpenDebt | null);
    setTickets((ticketRows as SupportTicketPreview[]) || []);
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await load();
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Couldn’t verify status');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  useEffect(() => {
    if (!loading && !error && !debt) {
      router.replace('/app');
    }
  }, [debt, error, loading, router]);

  const retry = async () => {
    setFetching(true);
    try {
      await load();
    } catch (e: any) {
      setError(e?.message || 'Couldn’t verify status');
    } finally {
      setFetching(false);
    }
  };

  const onPaySuccess = async () => {
    setPayOpen(false);
    setVerifyingPayment(true);
    let unlocked = false;
    for (let i = 0; i < 20; i += 1) {
      const { data } = await supabase.rpc('get_my_open_clawback_debt');
      if (!data) {
        unlocked = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    try {
      await load();
    } catch {
      // ignore — unlock flag already set
    }
    setVerifyingPayment(false);
    if (unlocked) router.replace('/app/seller/clawback-success');
  };

  const leave = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.replace('/app');
  };

  if (loading) {
    return (
      <GateShell title="Account status" onClose={leave}>
        <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full bg-emerald-500/20" />
        <p className="text-center text-lg font-black text-(--foreground)">Checking account status</p>
        <p className="mt-2 text-center text-sm text-(--muted)">Hang tight — we’re confirming your seller account standing.</p>
      </GateShell>
    );
  }

  if (error) {
    return (
      <GateShell title="Account status" onClose={leave}>
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/15">
          <ShieldAlert size={30} className="text-amber-500" />
        </div>
        <p className="text-center text-lg font-black text-(--foreground)">Couldn’t verify status</p>
        <p className="mt-2 text-center text-sm text-(--muted)">
          We couldn’t confirm your repayment status right now. Check your connection and try again.
        </p>
        <p className="mt-4 rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 text-center text-sm text-(--muted)">
          If this keeps happening, message support — you can still get help while we retry.
        </p>
        <Button className="mt-5 w-full" onClick={() => void retry()} disabled={fetching}>
          <span className="inline-flex items-center gap-2">
            <RefreshCw size={16} />
            {fetching ? 'Trying…' : 'Try again'}
          </span>
        </Button>
        <Link
          href="/app/activity/support-new?fromClawback=1"
          className="mt-2 flex h-12 items-center justify-center gap-2 rounded-xl border border-(--border) bg-(--surface) text-sm font-bold text-(--foreground)"
        >
          <Headphones size={16} />
          Contact support
        </Link>
      </GateShell>
    );
  }

  if (!debt) return null;

  const currency = debt.currency_code || currencyFallback || 'NGN';
  const amountMain = fromSmallestUnit(Number(debt.amount_minor || 0), currency);

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between border-b border-(--border) bg-(--background)/95 px-1 py-3 backdrop-blur-sm lg:hidden">
        <button type="button" onClick={leave} className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface)" aria-label="Close">
          <X size={22} strokeWidth={2.5} />
        </button>
        <h1 className="min-w-0 flex-1 text-center text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">
          Repayment due
        </h1>
        <div className="h-11 w-11" />
      </header>

      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
          <ShieldAlert size={20} className="text-amber-600" />
        </span>
        <div>
          <p className="text-sm font-black text-(--foreground)">Repayment required</p>
          <p className="mt-1 text-sm text-(--muted)">
            Your seller account is paused until this balance is cleared. You can still message our support team below.
          </p>
        </div>
      </div>

      <ClawbackExplanationCard debt={debt} variant="full" showViewBookingAction />

      <div className="mt-4 rounded-2xl border border-(--border) bg-(--surface) p-4">
        <p className="text-sm font-black text-(--foreground)">Your options</p>
        <div className="mt-3 flex gap-3">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-black text-emerald-600">1</span>
          <p className="text-sm text-(--muted)">Pay now with Paystack — access restores automatically once payment confirms.</p>
        </div>
        <div className="mt-2 flex gap-3">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[11px] font-black text-amber-600">2</span>
          <p className="text-sm text-(--muted)">
            Questions or disagreement? Open a support ticket — you can reply here while your account stays paused.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Headphones size={18} className="text-emerald-600" />
          <p className="text-sm font-black text-(--foreground)">Support</p>
        </div>
        <p className="mb-3 text-sm text-(--muted)">Need help understanding this charge? Message our team — support stays available during repayment.</p>
        {tickets.length > 0 ? (
          <div className="mb-2 space-y-2">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/app/activity/support-detail?ticketId=${encodeURIComponent(ticket.id)}&fromClawback=1`}
                className="flex items-center gap-2 rounded-xl border border-(--border) bg-(--background) px-3 py-2"
              >
                <MessageSquare size={16} className="text-emerald-600" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-(--foreground)">{ticket.subject}</span>
                  <span className="text-[11px] font-semibold text-(--muted)">{String(ticket.status || 'open').toUpperCase()} · Tap to reply</span>
                </span>
                <ChevronRight size={16} className="text-(--muted)" />
              </Link>
            ))}
          </div>
        ) : null}
        <Link
          href="/app/activity/support-history?fromClawback=1"
          className="mt-1 flex items-center gap-2 rounded-xl border border-(--border) bg-(--background) px-3 py-3 text-sm font-bold text-(--foreground)"
        >
          <MessageSquare size={16} />
          <span className="flex-1">View support tickets</span>
          <ChevronRight size={16} className="text-(--muted)" />
        </Link>
        <Link
          href={clawbackSupportHref(debt)}
          className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-500/15 px-3 py-3 text-sm font-bold text-emerald-600"
        >
          <HelpCircle size={16} />
          <span className="flex-1">Ask about this repayment</span>
          <ChevronRight size={16} />
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface) px-3 py-3">
        <AlertTriangle size={16} className="shrink-0 text-(--muted)" />
        <p className="text-sm font-semibold text-(--muted)">After successful payment, your StoreLink access is restored automatically.</p>
      </div>

      <button
        type="button"
        disabled={verifyingPayment}
        onClick={() => setPayOpen(true)}
        className="mt-4 flex h-14 w-full items-center justify-center rounded-xl bg-emerald-600 text-sm font-black tracking-[0.12em] text-white disabled:opacity-70"
      >
        {verifyingPayment ? 'VERIFYING PAYMENT...' : 'PAY NOW'}
      </button>

      <PaystackTerminalModal
        isOpen={payOpen}
        onClose={() => setPayOpen(false)}
        onSuccess={() => void onPaySuccess()}
        email={email}
        amount={amountMain}
        currency={currency}
        metadata={{
          purpose: 'seller_clawback_repayment',
          clawback_debt_id: debt.id,
          seller_id: profileId,
          service_order_id: debt.service_order_id,
        }}
      />
    </div>
  );
}

function GateShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl pb-10">
      <header className="mb-8 flex items-center justify-between border-b border-(--border) py-3 lg:hidden">
        <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface)" aria-label="Close">
          <X size={22} strokeWidth={2.5} />
        </button>
        <h1 className="min-w-0 flex-1 text-center text-[12px] font-black uppercase tracking-[0.18em]">{title}</h1>
        <div className="h-11 w-11" />
      </header>
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-2">{children}</div>
    </div>
  );
}
