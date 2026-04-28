'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, Circle, Edit3, MapPin, Phone, Plus, Trash2, Truck } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import SettingsFrame from '../SettingsFrame';
import Button from '@/components/ui/Button';

type ShippingAddress = {
  id: string;
  label: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone_contact: string;
  is_default: boolean;
};

type ProfileRow = {
  id: string;
  phone_number?: string | null;
  shipping_details?: ShippingAddress[] | Record<string, any> | null;
};

function newId() {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const emptyAddress = (phoneNumber = '', asDefault = false): ShippingAddress => ({
  id: newId(),
  label: 'Home',
  street_address: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'Nigeria',
  phone_contact: phoneNumber || '',
  is_default: asDefault,
});

export default function ShippingSettingsClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ShippingAddress>(emptyAddress());

  const load = useCallback(async () => {
    setError(null);
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData.user?.id;
    if (!uid) {
      setProfile(null);
      setAddresses([]);
      return;
    }
    const { data, error } = await supabase.from('profiles').select('id,phone_number,shipping_details').eq('id', uid).maybeSingle();
    if (error) throw error;
    const p = (data as ProfileRow) || null;
    setProfile(p);
    const raw = p?.shipping_details;
    if (Array.isArray(raw)) {
      setAddresses(raw as ShippingAddress[]);
      return;
    }
    if (raw && typeof raw === 'object' && (raw as any).street_address) {
      // Migration path: old single-object format into array format used by checkout.
      const migrated: ShippingAddress[] = [
        {
          id: newId(),
          label: 'Default Address',
          street_address: String((raw as any).street_address || ''),
          city: String((raw as any).city || ''),
          state: String((raw as any).state || ''),
          postal_code: String((raw as any).postal_code || ''),
          country: String((raw as any).country || 'Nigeria'),
          phone_contact: String((raw as any).phone_contact || ''),
          is_default: true,
        },
      ];
      setAddresses(migrated);
      await supabase.from('profiles').update({ shipping_details: migrated, updated_at: new Date().toISOString() }).eq('id', uid);
      return;
    }
    setAddresses([]);
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Could not load shipping settings.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  const saveToDb = useCallback(
    async (next: ShippingAddress[]) => {
      if (!profile?.id) return;
      setSaving(true);
      setError(null);
      const previous = addresses;
      setAddresses(next);
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ shipping_details: next, updated_at: new Date().toISOString() })
          .eq('id', profile.id);
        if (error) throw error;
      } catch (e: any) {
        setAddresses(previous);
        setError(e?.message || 'Could not save addresses.');
      } finally {
        setSaving(false);
      }
    },
    [addresses, profile?.id, supabase]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyAddress(profile?.phone_number || '', addresses.length === 0));
    setShowEditor(true);
  };

  const openEdit = (item: ShippingAddress) => {
    setEditingId(item.id);
    setForm(item);
    setShowEditor(true);
  };

  const onSubmit = async () => {
    if (!form.street_address.trim() || !form.city.trim() || !form.phone_contact.trim()) {
      setError('Address, city, and phone are required.');
      return;
    }
    let next = [...addresses];
    if (form.is_default) next = next.map((a) => ({ ...a, is_default: false }));
    if (editingId) {
      next = next.map((a) => (a.id === editingId ? form : a));
    } else {
      next.push(form);
    }
    await saveToDb(next);
    setShowEditor(false);
  };

  const onDelete = async (id: string) => {
    const next = addresses.filter((a) => a.id !== id);
    await saveToDb(next);
  };

  const onSetDefault = async (id: string) => {
    const next = addresses.map((a) => ({ ...a, is_default: a.id === id }));
    await saveToDb(next);
  };

  return (
    <SettingsFrame title="Shipping addresses" subtitle="Manage delivery addresses used during checkout.">
      <div className="space-y-4">
        {error ? <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}

        <div className="flex justify-end">
          <Button onClick={openCreate} disabled={saving}>
            <span className="inline-flex items-center gap-1">
              <Plus size={15} />
              Add address
            </span>
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-(--muted)">Loading addresses…</p>
        ) : addresses.length === 0 ? (
          <div className="rounded-2xl border border-(--border) bg-(--surface) p-8 text-center">
            <Truck size={44} className="mx-auto mb-2 text-(--muted)" />
            <p className="text-sm font-semibold text-(--foreground)">No addresses saved yet.</p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 rounded-xl bg-(--foreground) px-4 py-2 text-sm font-black uppercase tracking-wide text-(--background)"
            >
              Add new address
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((item) => (
              <div key={item.id} className={`rounded-2xl border bg-(--surface) p-4 ${item.is_default ? 'border-emerald-500/50' : 'border-(--border)'}`}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <p className="text-sm font-bold text-(--foreground)">{item.label}</p>
                    {item.is_default ? (
                      <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-400">Default</span>
                    ) : null}
                  </div>
                  <button type="button" onClick={() => void onSetDefault(item.id)} className="text-(--muted)">
                    {item.is_default ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} />}
                  </button>
                </div>
                <p className="whitespace-pre-line text-sm text-(--muted)">
                  {item.street_address}
                  {'\n'}
                  {item.city}, {item.state} {item.postal_code}
                  {'\n'}
                  {item.country}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-(--foreground)">
                  <Phone size={14} />
                  {item.phone_contact}
                </p>
                <div className="mt-3 flex justify-end gap-3 border-t border-(--border) pt-3">
                  <button type="button" onClick={() => openEdit(item)} className="inline-flex items-center gap-1 text-sm font-semibold text-(--foreground)">
                    <Edit3 size={14} />
                    Edit
                  </button>
                  <button type="button" onClick={() => void onDelete(item.id)} className="inline-flex items-center gap-1 text-sm font-semibold text-rose-300">
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showEditor ? (
          <div className="rounded-2xl border border-(--border) bg-(--surface) p-4">
            <p className="mb-3 text-sm font-black text-(--foreground)">{editingId ? 'Edit address' : 'New address'}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Label">
                <input
                  value={form.label}
                  onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-(--border) bg-(--card) px-3 text-sm text-(--foreground) outline-none"
                />
              </Field>
              <Field label="Phone contact">
                <input
                  value={form.phone_contact}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone_contact: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-(--border) bg-(--card) px-3 text-sm text-(--foreground) outline-none"
                />
              </Field>
              <Field label="Street address" full>
                <input
                  value={form.street_address}
                  onChange={(e) => setForm((prev) => ({ ...prev, street_address: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-(--border) bg-(--card) px-3 text-sm text-(--foreground) outline-none"
                />
              </Field>
              <Field label="City">
                <input
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-(--border) bg-(--card) px-3 text-sm text-(--foreground) outline-none"
                />
              </Field>
              <Field label="State">
                <input
                  value={form.state}
                  onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-(--border) bg-(--card) px-3 text-sm text-(--foreground) outline-none"
                />
              </Field>
              <Field label="Postal code">
                <input
                  value={form.postal_code}
                  onChange={(e) => setForm((prev) => ({ ...prev, postal_code: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-(--border) bg-(--card) px-3 text-sm text-(--foreground) outline-none"
                />
              </Field>
              <Field label="Country">
                <input
                  value={form.country}
                  onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-(--border) bg-(--card) px-3 text-sm text-(--foreground) outline-none"
                />
              </Field>
            </div>
            <label className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-(--foreground)">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm((prev) => ({ ...prev, is_default: e.target.checked }))}
              />
              Set as default address
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowEditor(false)}>
                Cancel
              </Button>
              <Button onClick={() => void onSubmit()} disabled={saving}>
                {saving ? 'Saving…' : 'Save address'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </SettingsFrame>
  );
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label className={full ? 'md:col-span-2' : ''}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-(--muted)">{label}</span>
      {children}
    </label>
  );
}
