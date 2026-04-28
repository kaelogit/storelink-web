'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DownloadCloud, FileText, ShieldCheck, Trash2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import SettingsFrame from '../SettingsFrame';

type ProfileRow = { location_country_code?: string | null };

export default function DataSettingsClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [countryCode, setCountryCode] = useState('NG');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id;
      if (!uid || !mounted) return;
      const { data } = await supabase.from('profiles').select('location_country_code').eq('id', uid).maybeSingle();
      const p = (data as ProfileRow | null) ?? null;
      if (p?.location_country_code && mounted) {
        setCountryCode(String(p.location_country_code).toUpperCase());
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const clearLocalData = useCallback(async () => {
    setBusy(true);
    setInfo(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      }
      setInfo('Local cache cleared. You may need to sign in again on some tabs.');
    } catch {
      setInfo('Could not fully clear local cache in this browser.');
    } finally {
      setBusy(false);
    }
  }, []);

  const mailtoHref = `mailto:support@storelink.ng?subject=${encodeURIComponent('Data Export Request')}&body=${encodeURIComponent(
    'Hello, I would like to request a copy of my personal data associated with this account.'
  )}`;

  return (
    <SettingsFrame title="Data & storage" subtitle="Storage tools, legal docs, and data export requests.">
      <div className="space-y-5">
        {info ? <p className="rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--muted)">{info}</p> : null}

        <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Storage</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void clearLocalData()}
            className="flex w-full items-center gap-3 rounded-xl border border-(--border) bg-(--card) px-3 py-3 text-left disabled:opacity-70"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/15 text-rose-300">
              <Trash2 size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-(--foreground)">Clear cache</span>
              <span className="block text-xs text-(--muted)">Free local space and remove cached assets.</span>
            </span>
            <span className="text-xs font-bold text-(--muted)">{busy ? 'Clearing…' : ''}</span>
          </button>
        </section>

        <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Your data</p>
          <div className="space-y-2">
            <a href={mailtoHref} className="flex items-center gap-3 rounded-xl border border-(--border) bg-(--card) px-3 py-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-(--background)">
                <DownloadCloud size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-(--foreground)">Download my data</span>
                <span className="block text-xs text-(--muted)">Send a request to support.</span>
              </span>
            </a>
            <Link href={`/privacy/${countryCode.toLowerCase()}`} className="flex items-center gap-3 rounded-xl border border-(--border) bg-(--card) px-3 py-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-(--background)">
                <ShieldCheck size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-(--foreground)">Privacy policy</span>
                <span className="block text-xs text-(--muted)">How we use your data.</span>
              </span>
            </Link>
            <Link href={`/terms/${countryCode.toLowerCase()}`} className="flex items-center gap-3 rounded-xl border border-(--border) bg-(--card) px-3 py-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-(--background)">
                <FileText size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-(--foreground)">Terms of service</span>
                <span className="block text-xs text-(--muted)">Usage rules and agreements.</span>
              </span>
            </Link>
          </div>
        </section>
      </div>
    </SettingsFrame>
  );
}
