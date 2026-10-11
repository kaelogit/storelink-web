'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import SettingsFrame from '../../SettingsFrame';
import {
  NOTIFICATION_HUB_CATEGORIES,
  NOTIFICATION_PREF_CAPTIONS,
  NOTIFICATION_PREF_LABELS,
  normalizeNotificationPrefs,
  type NotificationPrefKey,
  type NotificationPrefs,
} from '@/lib/notificationPrefs';

export default function NotificationCategoryClient() {
  const params = useParams<{ category: string }>();
  const raw = String(params?.category || '');
  const category = NOTIFICATION_HUB_CATEGORIES.find((c) => c.id === raw);
  const supabase = useMemo(() => createBrowserClient(), []);
  const [prefs, setPrefs] = useState<NotificationPrefs>(normalizeNotificationPrefs(null));
  const [profileId, setProfileId] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<NotificationPrefKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;
    setProfileId(uid);
    const { data } = await supabase.rpc('get_my_profile');
    setPrefs(normalizeNotificationPrefs((data as { notification_prefs?: NotificationPrefs } | null)?.notification_prefs));
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (key: NotificationPrefKey, value: boolean) => {
    if (!profileId) return;
    setSavingKey(key);
    setError(null);
    const previous = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      const { error: upErr } = await supabase.from('profiles').update({ notification_prefs: next }).eq('id', profileId);
      if (upErr) throw upErr;
    } catch (e: any) {
      setPrefs(previous);
      setError(e?.message || 'Could not update preference.');
    } finally {
      setSavingKey(null);
    }
  };

  if (!category) {
    return (
      <SettingsFrame title="Notifications" parentHref="/app/settings/notifications">
        <p className="text-sm text-(--muted)">Unknown notification category.</p>
      </SettingsFrame>
    );
  }

  return (
    <SettingsFrame title={category.label} subtitle={category.helpBody} parentHref="/app/settings/notifications">
      {error ? <p className="mb-3 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}
      <div className="space-y-2">
        {category.keys.map((key) => (
          <div key={key} className="flex items-center gap-3 rounded-xl border border-(--border) bg-(--surface) px-3 py-3">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-(--foreground)">{NOTIFICATION_PREF_LABELS[key]}</span>
              <span className="block text-xs text-(--muted)">{NOTIFICATION_PREF_CAPTIONS[key]}</span>
            </span>
            <button
              type="button"
              disabled={savingKey === key}
              onClick={() => void toggle(key, !prefs[key])}
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                prefs[key] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-(--background) text-(--muted)'
              }`}
            >
              {savingKey === key ? '…' : prefs[key] ? 'On' : 'Off'}
            </button>
          </div>
        ))}
      </div>
    </SettingsFrame>
  );
}
