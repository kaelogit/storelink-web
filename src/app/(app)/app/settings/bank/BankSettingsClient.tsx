'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronRight, Landmark, Search, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import {
  confirmBankDetailsChange,
  formatPhoneForDisplay,
  sendPhoneOtp,
} from '@/lib/phoneOtp';

type BankItem = { name: string; code: string };

type BankDetails = {
  bank_name?: string | null;
  bank_code?: string | null;
  account_name?: string | null;
  account_number?: string | null;
  recipient_code?: string | null;
  currency?: string | null;
};

type BankFormState = {
  bank_name: string;
  bank_code: string;
  account_name: string;
  account_number: string;
  currency: string;
};

type ProfileRow = {
  id: string;
  is_seller?: boolean | null;
  bank_details?: BankDetails | null;
  phone_number?: string | null;
  phone_verified?: boolean | null;
};

export default function BankSettingsClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/profile';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [banks, setBanks] = useState<BankItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);

  const hasExistingDetails = Boolean(profile?.bank_details?.recipient_code);
  const phoneE164 = String(profile?.phone_number || '').trim();
  const phoneVerified = Boolean(profile?.phone_verified && phoneE164);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<BankFormState>({
    bank_name: '',
    bank_code: '',
    account_number: '',
    account_name: '',
    currency: 'NGN',
  });

  const loadProfile = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id;
    if (!uid) {
      setProfile(null);
      return;
    }
    const { data, error: pErr } = await supabase
      .from('profiles')
      .select('id, is_seller, bank_details, phone_number, phone_verified')
      .eq('id', uid)
      .maybeSingle();
    if (pErr) throw pErr;
    const p = (data as ProfileRow | null) ?? null;
    setProfile(p);
    const bank = p?.bank_details || {};
    setForm({
      bank_name: String(bank.bank_name || ''),
      bank_code: String(bank.bank_code || ''),
      account_number: String(bank.account_number || ''),
      account_name: String(bank.account_name || ''),
      currency: String(bank.currency || 'NGN'),
    });
    setIsEditing(!bank.recipient_code);
    setAwaitingOtp(false);
    setOtpCode('');
  }, [supabase]);

  const loadBanks = useCallback(async () => {
    const { data } = await supabase.functions.invoke('paystack-account-resolve', {
      body: { action: 'list_banks' },
    });
    if (data?.status && Array.isArray(data.data)) {
      setBanks(data.data as BankItem[]);
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([loadProfile(), loadBanks()]);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load payout settings.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadBanks, loadProfile]);

  const filteredBanks = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter((b) => b.name.toLowerCase().includes(q));
  }, [banks, pickerSearch]);

  const verifyAccount = useCallback(
    async (account_number: string, bank_code: string) => {
      setVerifying(true);
      setError(null);
      try {
        const { data, error: invokeError } = await supabase.functions.invoke('paystack-account-resolve', {
          body: { account_number, bank_code },
        });
        if (invokeError || !data?.success) {
          throw new Error('Invalid account details. Please check account number and bank.');
        }
        setForm((prev) => ({
          ...prev,
          account_name: String(data.account_name || ''),
        }));
      } catch (e: any) {
        setForm((prev) => ({ ...prev, account_name: '' }));
        setError(e?.message || 'Could not verify account.');
      } finally {
        setVerifying(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    const ready = isEditing && form.account_number.length === 10 && !!form.bank_code;
    if (!ready) return;
    const t = setTimeout(() => {
      void verifyAccount(form.account_number, form.bank_code);
    }, 300);
    return () => clearTimeout(t);
  }, [form.account_number, form.bank_code, isEditing, verifyAccount]);

  const save = useCallback(async () => {
    if (!profile?.id) return;
    if (!form.account_name || form.account_number.length !== 10 || !form.bank_code) {
      setError('Please verify account first.');
      return;
    }
    if (!phoneVerified) {
      setError('Verify your phone number before setting or changing payout details.');
      return;
    }

    const payload: BankFormState = {
      bank_name: form.bank_name,
      bank_code: form.bank_code,
      account_name: form.account_name,
      account_number: form.account_number,
      currency: 'NGN',
    };

    setSaving(true);
    setError(null);
    try {
      if (hasExistingDetails) {
        if (!awaitingOtp) {
          setOtpSending(true);
          const sent = await sendPhoneOtp(phoneE164);
          setOtpSending(false);
          if (!sent.ok) throw new Error(sent.message);
          setAwaitingOtp(true);
          setOtpCode('');
          return;
        }
        if (otpCode.trim().length < 4) {
          setError('Enter the SMS code to confirm the change.');
          return;
        }
        const confirmed = await confirmBankDetailsChange(otpCode.trim(), payload);
        if (!confirmed.ok) throw new Error(confirmed.message);
      } else {
        const { data, error: invokeErr } = await supabase.functions.invoke('paystack-account-resolve', {
          body: {
            action: 'save_first_time',
            account_number: form.account_number,
            bank_code: form.bank_code,
            bank_name: form.bank_name,
          },
        });
        if (invokeErr) throw invokeErr;
        if (!data?.success) {
          throw new Error(data?.message || 'Could not save bank account.');
        }
      }
      await loadProfile();
      setIsEditing(false);
      setAwaitingOtp(false);
      setOtpCode('');
    } catch (e: any) {
      setError(e?.message || 'Could not save bank account.');
    } finally {
      setSaving(false);
      setOtpSending(false);
    }
  }, [
    awaitingOtp,
    form,
    hasExistingDetails,
    loadProfile,
    otpCode,
    phoneE164,
    phoneVerified,
    profile?.id,
    supabase,
  ]);

  const resendOtp = useCallback(async () => {
    if (!phoneE164) return;
    setOtpSending(true);
    setError(null);
    try {
      const sent = await sendPhoneOtp(phoneE164);
      if (!sent.ok) throw new Error(sent.message);
      setAwaitingOtp(true);
    } catch (e: any) {
      setError(e?.message || 'Could not resend code.');
    } finally {
      setOtpSending(false);
    }
  }, [phoneE164]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl pb-8">
        <div className="h-12 w-12 animate-pulse rounded-full bg-(--border) lg:hidden" />
        <div className="mt-4 h-36 animate-pulse rounded-3xl border border-(--border) bg-(--surface)" />
      </div>
    );
  }

  if (!profile?.id) {
    return <p className="py-10 text-center text-sm text-(--muted)">Sign in to set up payout details.</p>;
  }

  if (profile.is_seller !== true) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-(--border) bg-(--card) p-8 text-center">
        <p className="text-sm font-semibold text-(--muted)">Payout settings are available for seller accounts.</p>
        <Link href={fromDrawer ? '/app/seller/become?fromDrawer=1' : '/app/seller/become'} className="mt-4 inline-block text-sm font-bold text-emerald-600 hover:underline">
          Become a seller
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between border-b border-(--border) bg-(--background)/95 px-1 py-3 backdrop-blur-sm lg:hidden">
        <Link
          href={backHref}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--surface) text-(--foreground) transition hover:opacity-90"
          aria-label={fromDrawer ? 'Back to profile menu' : 'Back to profile'}
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </Link>
        <h1 className="min-w-0 flex-1 text-center text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">
          Payout & Bank
        </h1>
        <div className="h-11 w-11 shrink-0" aria-hidden />
      </header>

      {error ? <p className="mb-4 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p> : null}

      {!isEditing && hasExistingDetails ? (
        <section className="rounded-[24px] border border-(--border) bg-(--surface) p-6">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
              <Landmark size={22} />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black tracking-widest text-white">
              <CheckCircle2 size={12} />
              VERIFIED
            </span>
          </div>
          <p className="text-lg font-black text-(--foreground)">{form.bank_name}</p>
          <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-(--muted)">{form.account_name}</p>
          <div className="my-5 h-px bg-(--border)" />
          <p className="text-xl font-black tracking-[0.2em] text-(--foreground)">**** **** {form.account_number.slice(-4)}</p>
          <Button className="mt-6 w-full" variant="outline" onClick={() => setIsEditing(true)}>
            Change bank account
          </Button>
        </section>
      ) : (
        <section className="rounded-[24px] border border-(--border) bg-(--surface) p-6">
          <div className="mb-5 rounded-2xl bg-emerald-500/10 p-4 text-sm text-(--foreground)">
            Use an account that matches your official identity to avoid payout delays.
          </div>

          <label className="mb-2 ml-1 block text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Bank name</label>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="flex h-14 w-full items-center justify-between rounded-2xl border border-(--border) bg-(--card) px-4 text-left"
          >
            <span className={`text-[15px] font-bold ${form.bank_name ? 'text-(--foreground)' : 'text-(--muted)'}`}>
              {form.bank_name || 'Select bank'}
            </span>
            <ChevronRight size={18} className="text-(--muted)" />
          </button>

          <label className="mb-2 mt-6 ml-1 block text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Account number</label>
          <div className="flex h-14 items-center rounded-2xl border border-(--border) bg-(--card) px-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={form.account_number}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '');
                setForm((prev) => ({ ...prev, account_number: v, account_name: '' }));
              }}
              placeholder="0000000000"
              className="w-full bg-transparent text-[15px] font-bold text-(--foreground) outline-none placeholder:text-(--muted)"
            />
            {verifying ? <span className="ml-3 text-xs text-(--muted)">Verifying…</span> : null}
          </div>

          {form.account_name ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-600">
              <CheckCircle2 size={16} />
              <span>{form.account_name}</span>
            </div>
          ) : null}

          {hasExistingDetails && awaitingOtp ? (
            <div className="mt-6">
              <label className="mb-2 ml-1 block text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">
                SMS code ({formatPhoneForDisplay(phoneE164)})
              </label>
              <div className="flex h-14 items-center rounded-2xl border border-(--border) bg-(--card) px-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full bg-transparent text-[15px] font-bold tracking-[0.3em] text-(--foreground) outline-none placeholder:text-(--muted)"
                />
              </div>
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-(--muted) hover:underline"
                disabled={otpSending}
                onClick={() => {
                  void resendOtp();
                }}
              >
                {otpSending ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          ) : null}

          {!phoneVerified ? (
            <p className="mt-4 text-sm text-amber-600">
              Verify your phone number in profile settings before saving payout details.
            </p>
          ) : null}

          <div className="mt-8 flex items-center gap-3">
            {hasExistingDetails ? (
              <Button
                variant="ghost"
                className="min-w-24"
                onClick={() => {
                  setIsEditing(false);
                  setAwaitingOtp(false);
                  setOtpCode('');
                }}
              >
                Cancel
              </Button>
            ) : null}
            <Button className="flex-1" onClick={save} disabled={saving || otpSending || !form.account_name || !phoneVerified}>
              {saving || otpSending
                ? 'Working…'
                : hasExistingDetails
                  ? awaitingOtp
                    ? 'Confirm change'
                    : 'Send code & save'
                  : 'Save account'}
            </Button>
          </div>
        </section>
      )}

      {showPicker ? (
        <div className="fixed inset-0 z-50 bg-black/45 p-4">
          <div className="mx-auto mt-10 w-full max-w-xl overflow-hidden rounded-3xl border border-(--border) bg-(--card)">
            <div className="flex items-center justify-between border-b border-(--border) px-5 py-4">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-(--foreground)">Select bank</p>
              <button type="button" onClick={() => setShowPicker(false)} className="rounded-lg p-1.5 hover:bg-(--surface)" aria-label="Close bank picker">
                <X size={20} className="text-(--foreground)" />
              </button>
            </div>
            <div className="border-b border-(--border) p-4">
              <div className="flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface) px-3 py-2.5">
                <Search size={16} className="text-(--muted)" />
                <input
                  autoFocus
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search banks..."
                  className="w-full bg-transparent text-sm text-(--foreground) outline-none placeholder:text-(--muted)"
                />
              </div>
            </div>
            <div className="max-h-[55vh] overflow-auto">
              {filteredBanks.map((bank) => (
                <button
                  key={bank.code}
                  type="button"
                  className="w-full border-b border-(--border) px-5 py-3.5 text-left text-sm font-semibold text-(--foreground) hover:bg-(--surface)"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, bank_name: bank.name, bank_code: bank.code, account_name: '' }));
                    setShowPicker(false);
                    setPickerSearch('');
                  }}
                >
                  {bank.name}
                </button>
              ))}
              {filteredBanks.length === 0 ? <p className="px-5 py-8 text-center text-sm text-(--muted)">No banks found.</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
