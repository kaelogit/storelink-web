'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Plus,
  Tag,
  XCircle,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { withDrawerParam } from '@/components/profile-web/profileHubPaths';

type MenuRow = { name: string; price: string; locked?: boolean };
const emptyMenuRow: MenuRow = { name: '', price: '', locked: false };

type ServiceListing = {
  id: string;
  title: string;
  description?: string | null;
  hero_price_min?: number | null;
  service_category?: string | null;
  delivery_type?: string | null;
  location_type?: string | null;
  is_active?: boolean;
  service_areas?: string[] | null;
  menu?: { name?: string; price?: string; price_minor?: number }[] | null;
};

type ProfileRow = { id: string; currency_code?: string | null; is_seller?: boolean | null };

export default function ServiceListingsClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const wrap = (p: string) => (fromDrawer ? withDrawerParam(p) : p);
  const backHref = fromDrawer ? '/app/profile?openHub=1' : wrap('/app/seller/inventory');

  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ServiceListing | null>(null);
  const [menuRows, setMenuRows] = useState<MenuRow[]>([emptyMenuRow]);
  const [isActive, setIsActive] = useState(true);

  const currency = profile?.currency_code || 'NGN';

  const formatMoneyMinor = (amountMinor: number | null | undefined) => {
    const safe = typeof amountMinor === 'number' ? amountMinor : 0;
    const major = safe / 100;
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency, minimumFractionDigits: 0 }).format(major);
  };

  const loadListings = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_listings')
        .select('*')
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setListings((data as ServiceListing[]) || []);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error('loadListings', e);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, supabase]);

  useEffect(() => {
    let a = true;
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!a) return;
        if (!uid) {
          setProfile(null);
          setReady(true);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('profiles')
          .select('id, currency_code, is_seller')
          .eq('id', uid)
          .single();
        if (!a) return;
        if (error) throw error;
        setProfile((data as ProfileRow) || null);
        setReady(true);
      } catch {
        if (a) {
          setProfile(null);
          setReady(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      a = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!profile?.id) return;
    void loadListings();
  }, [profile?.id, loadListings]);

  const openEdit = (listing: ServiceListing) => {
    setEditing(listing);
    setIsActive(!!listing.is_active);
    const parsed = Array.isArray((listing as ServiceListing & { menu?: unknown }).menu)
      ? (listing as ServiceListing & { menu: { name?: string; price?: string; price_minor?: number }[] }).menu
      : [];
    if (parsed.length) {
      const rows: MenuRow[] = parsed.map((row) => ({
        name: String(row.name || '').trim(),
        price: row.price_minor != null ? String(Number(row.price_minor) / 100) : String(row.price || '').replace(/\D/g, '') || '',
        locked: true,
      }));
      setMenuRows(rows);
    } else {
      setMenuRows([emptyMenuRow]);
    }
  };

  const updateMenuRow = (index: number, patch: Partial<MenuRow>) => {
    setMenuRows((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], ...patch };
      return clone;
    });
  };

  const addMenuRow = () => {
    setMenuRows((prev) => [...prev, { ...emptyMenuRow }]);
  };

  const removeMenuRow = (index: number) => {
    setMenuRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSave = async () => {
    if (!editing || !profile?.id) return;
    const normalizedRows = menuRows
      .map((row) => ({
        name: row.name.trim(),
        price_minor: Math.round(Number(row.price || '0') * 100),
      }))
      .filter((r) => r.name && r.price_minor > 0);
    if (!normalizedRows.length) {
      return;
    }
    const heroPriceMin = Math.min(...normalizedRows.map((r) => r.price_minor));
    setSaving(true);
    try {
      const payload = {
        title: editing.title,
        description: editing.description || null,
        hero_price_min: heroPriceMin,
        currency_code: currency,
        service_category: editing.service_category || 'nail_tech',
        delivery_type: editing.delivery_type || 'in_person',
        location_type: editing.location_type || null,
        service_areas: (editing as { service_areas?: string[] | null }).service_areas || null,
        is_active: isActive,
        menu: normalizedRows,
      };
      const { error } = await supabase
        .from('service_listings')
        .update(payload)
        .eq('id', editing.id)
        .eq('seller_id', profile.id);
      if (error) throw error;
      setEditing(null);
      setMenuRows([emptyMenuRow]);
      await loadListings();
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error('Save service_listing', e);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (listing: ServiceListing) => {
    const next = !listing.is_active;
    setListings((prev) => prev.map((l) => (l.id === listing.id ? { ...l, is_active: next } : l)));
    try {
      const { error } = await supabase.from('service_listings').update({ is_active: next }).eq('id', listing.id);
      if (error) throw error;
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error('toggle', e);
      void loadListings();
    }
  };

  if (!ready) {
    return (
      <div className="py-20 text-center text-sm text-(--muted)">Loading…</div>
    );
  }
  if (profile && profile.is_seller !== true) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-(--border) bg-(--card) p-8 text-center">
        <p className="text-sm font-semibold text-(--muted)">This area is for sellers only.</p>
        <Link href="/app/seller/become" className="mt-4 inline-block text-sm font-bold text-emerald-600 hover:underline">
          Become a seller
        </Link>
      </div>
    );
  }
  if (!profile?.id) {
    return <div className="py-16 text-center text-sm text-(--muted)">Sign in to manage service listings.</div>;
  }

  return (
    <div className="pb-112">
      <header className="sticky top-0 z-20 border-b border-(--border) bg-(--background)/95 py-3 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <Link
            href={backHref}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--surface) text-(--foreground)"
            aria-label="Back"
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[12px] font-black uppercase tracking-[0.2em] text-(--foreground)">Listed services</h1>
            <p className="mt-0.5 text-sm text-(--muted)">Manage listed services from here.</p>
          </div>
        </div>
        <div className="mt-3">
          <Link
            href={wrap('/app/seller/post-service')}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-(--foreground) px-4 py-2.5 text-xs font-black text-(--background) hover:opacity-95"
          >
            <Plus size={16} />
            New service
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="mt-8 flex justify-center text-(--muted)">Loading services…</div>
      ) : (
        <ul className="mt-4 space-y-2">
          {listings.length === 0 ? (
            <li className="flex flex-col items-center py-12 text-center">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5">
                <Tag className="text-emerald-600" size={14} />
                <span className="text-[10px] font-black tracking-[0.15em] text-emerald-600">SERVICES</span>
              </div>
              <h2 className="text-lg font-black text-(--foreground)">No listed services yet.</h2>
              <p className="mt-2 max-w-sm text-sm text-(--muted)">Post a new service from the studio or the post hub.</p>
              <Link
                href={wrap('/app/seller/post-service')}
                className="mt-4 text-sm font-bold text-emerald-600 hover:underline"
              >
                Open service studio →
              </Link>
            </li>
          ) : (
            listings.map((item) => (
              <li
                key={item.id}
                className="rounded-[22px] border-2 border-(--border) bg-(--card) p-5 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="line-clamp-1 text-base font-black text-(--foreground)">{item.title}</span>
                    <div
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 ${
                        item.is_active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-(--surface) text-(--muted)'
                      }`}
                    >
                      {item.is_active ? <CheckCircle2 className="text-emerald-500" size={14} /> : <XCircle size={14} />}
                      <span className="text-[10px] font-extrabold tracking-wide">
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-(--background) px-2 py-0.5 text-[10px] font-semibold text-(--muted)">
                        <Tag size={12} className="shrink-0" />
                        {String((item.service_category || '')).replace(/_/g, ' ')}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-(--background) px-2 py-0.5 text-[10px] font-semibold text-(--muted)">
                        <MapPin size={12} className="shrink-0" />
                        {item.delivery_type === 'online'
                          ? 'Online'
                          : item.location_type === 'i_travel'
                            ? 'I travel'
                            : item.location_type === 'both'
                              ? 'Studio & Home'
                              : 'In person'}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-1">
                      <span className="text-[10px] font-semibold text-(--muted)">From</span>
                      <span className="text-base font-black text-(--foreground)">
                        {formatMoneyMinor(item.hero_price_min as number)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 flex items-center justify-between text-xs text-(--muted)">
                    <span>Tap to edit prices and add menu items.</span>
                    <ChevronRight size={16} />
                  </p>
                </button>
                <div className="mt-2 border-t border-(--border) pt-2">
                  <button
                    type="button"
                    onClick={() => void toggleActive(item)}
                    className="w-full rounded-2xl border-2 border-(--border) py-2 text-sm font-semibold text-(--foreground) hover:bg-(--surface)"
                  >
                    {item.is_active ? 'Pause listing' : 'Activate listing'}
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {editing ? (
        <div className="fixed bottom-0 left-0 right-0 z-30 max-h-[min(85vh,520px)] border-t border-(--border) bg-(--background) px-4 pb-6 pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.1)] sm:left-[max(0px,calc(50%-24rem))] sm:right-[max(0px,calc(50%-24rem))] sm:max-w-3xl sm:mx-auto">
          <h3 className="mb-3 text-base font-black text-(--foreground)">Edit listed service</h3>
          <div className="max-h-72 overflow-y-auto pr-0.5">
            <p className="text-[10px] font-black tracking-widest text-(--muted)">TITLE *</p>
            <div className="mt-1 rounded-xl border border-(--border) bg-(--surface) px-3 py-2.5 text-sm font-semibold text-(--foreground)">
              {editing.title}
            </div>
            <p className="mt-3 text-[10px] font-black tracking-widest text-(--muted)">DESCRIPTION</p>
            <div className="mt-1 min-h-24 rounded-xl border border-(--border) bg-(--surface) px-3 py-2.5 text-left text-sm text-(--foreground)">
              {editing.description || 'No description'}
            </div>
            <p className="mt-4 text-[10px] font-black tracking-widest text-(--muted)">MENU ITEMS (NAME + PRICE) *</p>
            {menuRows.map((row, index) => (
              <div key={index} className="mb-2 flex flex-wrap items-center gap-2">
                <input
                  className="min-w-0 flex-1 basis-[48%] rounded-lg border border-(--border) bg-(--surface) px-2 py-2 text-sm"
                  value={row.name}
                  onChange={(e) => updateMenuRow(index, { name: e.target.value })}
                  readOnly={!!row.locked}
                />
                <input
                  className="h-9 w-24 flex-none rounded-lg border border-(--border) bg-(--surface) px-2 text-sm font-extrabold"
                  value={row.price}
                  onChange={(e) => updateMenuRow(index, { price: e.target.value.replace(/\D/g, '') })}
                  inputMode="numeric"
                />
                {menuRows.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeMenuRow(index)}
                    className="shrink-0 text-xs text-(--muted) hover:underline"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              onClick={addMenuRow}
              className="mb-3 mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-(--border) py-2 text-sm font-bold text-(--foreground)"
            >
              <Plus size={14} /> Add another service
            </button>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`mb-1 flex w-full items-center gap-2 rounded-xl border p-3 text-left text-sm font-bold ${
                isActive
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-(--border) bg-(--surface)'
              }`}
            >
              {isActive ? <CheckCircle2 className="text-emerald-600" size={18} /> : <XCircle className="text-(--muted)" size={18} />}
              {isActive ? 'Listing is active' : 'Listing is paused'}
            </button>
          </div>
          <div className="mt-2 flex gap-2 border-t border-(--border) pt-3">
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setMenuRows([emptyMenuRow]);
              }}
              className="h-12 flex-1 rounded-2xl border border-(--border) text-sm font-bold text-(--foreground)"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="h-12 flex-[1.2] rounded-2xl bg-(--foreground) text-sm font-extrabold text-(--background) disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
