'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Lock, Unlock, UserX } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import SettingsFrame from '../SettingsFrame';

type ProfileRow = {
  id: string;
  is_wardrobe_private?: boolean | null;
};

export default function PrivacySettingsClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const withDrawer = (href: string) => (fromDrawer ? `${href}${href.includes('?') ? '&' : '?'}fromDrawer=1` : href);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData.user?.id;
    if (!uid) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id,is_wardrobe_private')
      .eq('id', uid)
      .maybeSingle();
    if (error) throw error;
    setProfile((data as ProfileRow) || null);
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Could not load privacy settings.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  const toggleWardrobe = useCallback(
    async (next: boolean) => {
      if (!profile?.id) return;
      setSaving(true);
      setError(null);
      const previous = Boolean(profile.is_wardrobe_private);
      setProfile((p) => (p ? { ...p, is_wardrobe_private: next } : p));
      try {
        const { error } = await supabase.from('profiles').update({ is_wardrobe_private: next }).eq('id', profile.id);
        if (error) throw error;
      } catch (e: any) {
        setProfile((p) => (p ? { ...p, is_wardrobe_private: previous } : p));
        setError(e?.message || 'Could not update privacy setting.');
      } finally {
        setSaving(false);
      }
    },
    [profile, supabase]
  );

  return (
    <SettingsFrame title="Privacy" subtitle="Visibility preferences and interaction controls.">
      <div className="space-y-5">
        {error ? <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}

        <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Visibility</p>
          {loading ? (
            <p className="text-sm text-(--muted)">Loading privacy options…</p>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-(--border) bg-(--card) px-3 py-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-(--background)">
                {profile?.is_wardrobe_private ? <Lock size={16} /> : <Unlock size={16} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-(--foreground)">Private wardrobe</span>
                <span className="block text-xs text-(--muted)">Only you can see your collection.</span>
              </span>
              <button
                type="button"
                disabled={saving}
                onClick={() => void toggleWardrobe(!Boolean(profile?.is_wardrobe_private))}
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                  profile?.is_wardrobe_private ? 'bg-emerald-500/20 text-emerald-400' : 'bg-(--background) text-(--muted)'
                }`}
              >
                {saving ? 'Saving…' : profile?.is_wardrobe_private ? 'On' : 'Off'}
              </button>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Interactions</p>
          <Link href={withDrawer('/app/settings/blocked-users')} className="flex items-center gap-3 rounded-xl border border-(--border) bg-(--card) px-3 py-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-(--background)">
              <UserX size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-(--foreground)">Blocked accounts</span>
              <span className="block text-xs text-(--muted)">Manage users you have restricted.</span>
            </span>
          </Link>
        </section>
      </div>
    </SettingsFrame>
  );
}
