'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, MessageSquare, Tag, Truck } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import SettingsFrame from '../SettingsFrame';

type NotificationPrefs = {
  orders: boolean;
  chat: boolean;
  marketing: boolean;
  app_updates: boolean;
};

type ProfileRow = {
  id: string;
  notification_prefs?: Partial<NotificationPrefs> | null;
};

const defaultPrefs: NotificationPrefs = {
  orders: true,
  chat: true,
  marketing: false,
  app_updates: true,
};

export default function NotificationsSettingsClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof NotificationPrefs | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData.user?.id;
    if (!uid) {
      setProfile(null);
      setPrefs(defaultPrefs);
      return;
    }
    const { data, error } = await supabase.from('profiles').select('id,notification_prefs').eq('id', uid).maybeSingle();
    if (error) throw error;
    const p = (data as ProfileRow) || null;
    const pPrefs = p?.notification_prefs || {};
    setProfile(p);
    setPrefs({
      orders: Boolean(pPrefs.orders ?? defaultPrefs.orders),
      chat: Boolean(pPrefs.chat ?? defaultPrefs.chat),
      marketing: Boolean(pPrefs.marketing ?? defaultPrefs.marketing),
      app_updates: Boolean(pPrefs.app_updates ?? defaultPrefs.app_updates),
    });
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Could not load notification settings.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  const toggle = useCallback(
    async (key: keyof NotificationPrefs, value: boolean) => {
      if (!profile?.id) return;
      setSavingKey(key);
      setError(null);
      const previous = prefs;
      const next = { ...prefs, [key]: value };
      setPrefs(next);
      try {
        const { error } = await supabase.from('profiles').update({ notification_prefs: next }).eq('id', profile.id);
        if (error) throw error;
      } catch (e: any) {
        setPrefs(previous);
        setError(e?.message || 'Could not update notification preference.');
      } finally {
        setSavingKey(null);
      }
    },
    [prefs, profile?.id, supabase]
  );

  return (
    <SettingsFrame title="Notifications" subtitle="Choose which updates you want to receive.">
      <div className="space-y-5">
        {error ? <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}
        {loading ? <p className="text-sm text-(--muted)">Loading notification settings…</p> : null}

        <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Activity</p>
          <div className="space-y-2">
            <ToggleRow
              label="Order updates"
              sub="Status changes and delivery alerts."
              Icon={Truck}
              checked={prefs.orders}
              busy={savingKey === 'orders'}
              onToggle={(v) => void toggle('orders', v)}
            />
            <ToggleRow
              label="Messages"
              sub="Direct chats from buyers and sellers."
              Icon={MessageSquare}
              checked={prefs.chat}
              busy={savingKey === 'chat'}
              onToggle={(v) => void toggle('chat', v)}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">General</p>
          <div className="space-y-2">
            <ToggleRow
              label="Promotions & tips"
              sub="Marketing updates and feature tips."
              Icon={Tag}
              checked={prefs.marketing}
              busy={savingKey === 'marketing'}
              onToggle={(v) => void toggle('marketing', v)}
            />
            <ToggleRow
              label="App updates"
              sub="Release notes and improvements."
              Icon={Bell}
              checked={prefs.app_updates}
              busy={savingKey === 'app_updates'}
              onToggle={(v) => void toggle('app_updates', v)}
            />
          </div>
        </section>
      </div>
    </SettingsFrame>
  );
}

function ToggleRow({
  label,
  sub,
  Icon,
  checked,
  onToggle,
  busy,
}: {
  label: string;
  sub: string;
  Icon: any;
  checked: boolean;
  onToggle: (next: boolean) => void;
  busy: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-(--border) bg-(--card) px-3 py-2">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-(--background)">
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-(--foreground)">{label}</span>
        <span className="block text-xs text-(--muted)">{sub}</span>
      </span>
      <button
        type="button"
        onClick={() => onToggle(!checked)}
        disabled={busy}
        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
          checked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-(--background) text-(--muted)'
        }`}
      >
        {busy ? 'Saving…' : checked ? 'On' : 'Off'}
      </button>
    </div>
  );
}
