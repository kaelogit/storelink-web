'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Lock, Mail, Phone } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import SettingsFrame from '../SettingsFrame';
import Button from '@/components/ui/Button';

type ProfileRow = {
  id: string;
  is_seller?: boolean | null;
  full_name?: string | null;
  display_name?: string | null;
  slug?: string | null;
  bio?: string | null;
  logo_url?: string | null;
  email?: string | null;
  phone_number?: string | null;
  location_city?: string | null;
  location_state?: string | null;
  location_country_code?: string | null;
  handle_last_changed_at?: string | null;
  location_last_changed_at?: string | null;
};

const HANDLE_LOCK_DAYS = 30;
const LOCATION_LOCK_DAYS = 30;

function isLocked(lastChanged: string | null | undefined, days: number) {
  if (!lastChanged) return false;
  const base = new Date(lastChanged);
  if (Number.isNaN(base.getTime())) return false;
  const unlock = new Date(base.getTime() + days * 86400000);
  return unlock > new Date();
}

function lockLabel(lastChanged: string | null | undefined, days: number) {
  if (!lastChanged) return null;
  const base = new Date(lastChanged);
  if (Number.isNaN(base.getTime())) return null;
  const unlock = new Date(base.getTime() + days * 86400000);
  return unlock.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function AccountSettingsClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const withDrawer = (href: string) => (fromDrawer ? `${href}${href.includes('?') ? '&' : '?'}fromDrawer=1` : href);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const [form, setForm] = useState({
    full_name: '',
    slug: '',
    bio: '',
    phone_number: '',
    location_city: '',
    location_state: '',
  });

  const handleLocked = isLocked(profile?.handle_last_changed_at, HANDLE_LOCK_DAYS);
  const locationLocked = isLocked(profile?.location_last_changed_at, LOCATION_LOCK_DAYS);
  const handleUnlockText = lockLabel(profile?.handle_last_changed_at, HANDLE_LOCK_DAYS);
  const locationUnlockText = lockLabel(profile?.location_last_changed_at, LOCATION_LOCK_DAYS);

  const load = useCallback(async () => {
    setError(null);
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData.user?.id;
    if (!uid) {
      setProfile(null);
      return;
    }
    const { data, error: pErr } = await supabase
      .from('profiles')
      .select(
        'id,is_seller,full_name,display_name,slug,bio,logo_url,email,phone_number,location_city,location_state,location_country_code,handle_last_changed_at,location_last_changed_at'
      )
      .eq('id', uid)
      .maybeSingle();
    if (pErr) throw pErr;
    const p = (data as ProfileRow) || null;
    setProfile(p);
    setForm({
      full_name: String(p?.full_name || p?.display_name || ''),
      slug: String(p?.slug || ''),
      bio: String(p?.bio || ''),
      phone_number: String(p?.phone_number || ''),
      location_city: String(p?.location_city || ''),
      location_state: String(p?.location_state || ''),
    });
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Could not load account settings.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  const checkSlugAvailability = useCallback(
    async (targetSlug: string) => {
      const normalized = targetSlug
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      if (!normalized) {
        setSlugStatus('idle');
        return;
      }
      setSlugStatus('checking');
      const { data } = await supabase.from('profiles').select('slug').eq('slug', normalized).maybeSingle();
      const taken = Boolean(data && (data as any).slug !== profile?.slug);
      setSlugStatus(taken ? 'taken' : 'available');
      if (!taken && normalized !== form.slug) {
        setForm((prev) => ({ ...prev, slug: normalized }));
      }
    },
    [form.slug, profile?.slug, supabase]
  );

  const onSave = useCallback(async () => {
    if (!profile?.id) return;
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      const updates: any = {
        full_name: form.full_name.trim(),
        display_name: form.full_name.trim(),
        bio: form.bio.trim(),
        phone_number: form.phone_number.trim(),
        updated_at: new Date().toISOString(),
      };

      const normalizedSlug = form.slug.trim().toLowerCase();
      if (!handleLocked && normalizedSlug && normalizedSlug !== String(profile.slug || '').toLowerCase()) {
        if (slugStatus === 'taken') {
          throw new Error('Username is taken. Pick a different handle.');
        }
        updates.slug = normalizedSlug;
        updates.handle_last_changed_at = new Date().toISOString();
      }

      const locationChanged =
        form.location_city.trim() !== String(profile.location_city || '') ||
        form.location_state.trim() !== String(profile.location_state || '');
      if (!locationLocked && locationChanged) {
        updates.location_city = form.location_city.trim();
        updates.location_state = form.location_state.trim();
        updates.location_last_changed_at = new Date().toISOString();
      }

      const { error: upErr } = await supabase.from('profiles').update(updates).eq('id', profile.id);
      if (upErr) throw upErr;
      await load();
      setSavedMessage('Changes saved.');
    } catch (e: any) {
      setError(e?.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }, [form, handleLocked, load, locationLocked, profile, slugStatus, supabase]);

  if (loading) {
    return (
      <SettingsFrame title="Personal & shop" subtitle="Manage your profile and store-facing details.">
        <p className="text-sm text-(--muted)">Loading account settings…</p>
      </SettingsFrame>
    );
  }

  if (!profile?.id) {
    return (
      <SettingsFrame title="Personal & shop" subtitle="Manage your profile and store-facing details.">
        <p className="text-sm text-(--muted)">Sign in to manage account settings.</p>
      </SettingsFrame>
    );
  }

  return (
    <SettingsFrame title="Personal & shop" subtitle="Public identity, private details, and seller profile metadata.">
      <div className="space-y-5">
        {error ? <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}
        {savedMessage ? <p className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{savedMessage}</p> : null}

        <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Public identity</p>
          <label className="mb-3 block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-(--muted)">Display name</span>
            <input
              value={form.full_name}
              onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
              maxLength={40}
              className="h-11 w-full rounded-xl border border-(--border) bg-(--card) px-3 text-sm font-semibold text-(--foreground) outline-none"
            />
          </label>
          <label className="mb-3 block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-(--muted)">Username (@)</span>
            <div className="flex h-11 items-center gap-2 rounded-xl border border-(--border) bg-(--card) px-3">
              <input
                value={form.slug}
                onChange={(e) => {
                  const next = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                  setForm((prev) => ({ ...prev, slug: next }));
                  setSlugStatus('idle');
                }}
                onBlur={() => {
                  if (!handleLocked && form.slug.trim()) void checkSlugAvailability(form.slug);
                }}
                disabled={handleLocked}
                className="w-full bg-transparent text-sm font-semibold text-(--foreground) outline-none disabled:text-(--muted)"
              />
              {handleLocked ? <Lock size={14} className="text-(--muted)" /> : null}
              {!handleLocked && slugStatus === 'checking' ? <span className="text-xs text-(--muted)">…</span> : null}
              {!handleLocked && slugStatus === 'available' ? <CheckCircle2 size={15} className="text-emerald-500" /> : null}
              {!handleLocked && slugStatus === 'taken' ? <AlertCircle size={15} className="text-rose-400" /> : null}
            </div>
            {handleLocked && handleUnlockText ? <span className="mt-1 block text-xs text-rose-300">Handle locked until {handleUnlockText}</span> : null}
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-(--muted)">Bio</span>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
              maxLength={150}
              rows={4}
              className="w-full rounded-xl border border-(--border) bg-(--card) px-3 py-2 text-sm font-medium text-(--foreground) outline-none"
            />
          </label>
        </section>

        <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Location</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-(--muted)">State</span>
              <input
                value={form.location_state}
                onChange={(e) => setForm((prev) => ({ ...prev, location_state: e.target.value }))}
                disabled={locationLocked}
                className="h-11 w-full rounded-xl border border-(--border) bg-(--card) px-3 text-sm font-semibold text-(--foreground) outline-none disabled:text-(--muted)"
              />
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-(--muted)">City</span>
              <input
                value={form.location_city}
                onChange={(e) => setForm((prev) => ({ ...prev, location_city: e.target.value }))}
                disabled={locationLocked}
                className="h-11 w-full rounded-xl border border-(--border) bg-(--card) px-3 text-sm font-semibold text-(--foreground) outline-none disabled:text-(--muted)"
              />
            </label>
          </div>
          {locationLocked && locationUnlockText ? <p className="mt-2 text-xs text-rose-300">Location locked until {locationUnlockText}</p> : null}
        </section>

        <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Private information</p>
          <div className="space-y-3">
            <label>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-(--muted)">Email</span>
              <div className="flex h-11 items-center gap-2 rounded-xl border border-(--border) bg-(--card) px-3 text-sm text-(--muted)">
                <Mail size={16} />
                <span>{profile.email || '—'}</span>
                <Lock size={14} className="ml-auto" />
              </div>
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-(--muted)">Phone number</span>
              <div className="flex h-11 items-center gap-2 rounded-xl border border-(--border) bg-(--card) px-3">
                <Phone size={16} className="text-(--muted)" />
                <input
                  value={form.phone_number}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold text-(--foreground) outline-none"
                />
              </div>
            </label>
          </div>
        </section>

        {profile.is_seller ? (
          <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Seller tools</p>
            <div className="flex flex-wrap gap-2">
              <Link href={withDrawer('/app/seller/verification-consent')} className="rounded-xl border border-(--border) bg-(--card) px-3 py-2 text-sm font-semibold text-(--foreground)">
                Identity verification
              </Link>
              <Link href={withDrawer('/app/settings/bank')} className="rounded-xl border border-(--border) bg-(--card) px-3 py-2 text-sm font-semibold text-(--foreground)">
                Payout & bank
              </Link>
              <Link href={withDrawer('/app/subscription')} className="rounded-xl border border-(--border) bg-(--card) px-3 py-2 text-sm font-semibold text-(--foreground)">
                Membership
              </Link>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4">
            <p className="text-sm font-semibold text-(--foreground)">Want to start selling?</p>
            <p className="mt-1 text-sm text-(--muted)">Open your shop from the seller setup flow. Standard seller usage is free.</p>
            <Link href={withDrawer('/app/seller/what-is-selling')} className="mt-3 inline-flex rounded-xl bg-(--foreground) px-3 py-2 text-sm font-black uppercase tracking-wide text-(--background)">
              Start seller setup
            </Link>
          </section>
        )}

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving || slugStatus === 'taken'}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </SettingsFrame>
  );
}
