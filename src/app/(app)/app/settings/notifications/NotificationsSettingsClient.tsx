'use client';

import { Bell } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import SettingsFrame, { useSettingsDrawer } from '../SettingsFrame';
import { SettingsNavRow } from '../SettingsNavRow';
import {
  categoryPrefStatus,
  normalizeNotificationPrefs,
  NOTIFICATION_HUB_CATEGORIES,
  type NotificationPrefs,
} from '@/lib/notificationPrefs';

export default function NotificationsSettingsClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const { wrap } = useSettingsDrawer();
  const [prefs, setPrefs] = useState<NotificationPrefs>(normalizeNotificationPrefs(null));
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;
    const { data } = await supabase.from('profiles').select('notification_prefs').eq('id', uid).maybeSingle();
    setPrefs(normalizeNotificationPrefs((data as { notification_prefs?: NotificationPrefs } | null)?.notification_prefs));
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await load();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  return (
    <SettingsFrame title="Notifications" subtitle="Choose which StoreLink alerts you get" parentHref="/app/settings">
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
          <Bell size={36} strokeWidth={1.6} />
        </span>
        <p className="text-lg font-black text-(--foreground)">Notifications</p>
      </div>
      {loading ? <p className="mb-3 text-sm text-(--muted)">Loading preferences…</p> : null}
      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Push notifications</p>
      <div className="divide-y divide-(--border) overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
        {NOTIFICATION_HUB_CATEGORIES.map((cat) => {
          const status = categoryPrefStatus(prefs, cat.keys);
          return (
            <SettingsNavRow
              key={cat.id}
              href={wrap(cat.path)}
              label={cat.label}
              value={status === 'Partial' ? 'Custom' : status}
            />
          );
        })}
      </div>
    </SettingsFrame>
  );
}
