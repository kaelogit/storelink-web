'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, Plus, X } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { withDrawerParam } from '@/components/profile-web/profileHubPaths';
import {
  createDeliveryZoneId,
  parseStoreDeliverySettings,
  type DeliveryZone,
  type OutsideZonePolicy,
} from '@/lib/foodDeliveryZones';

type ZoneRow = { id: string; name: string; fee: string; note: string };

export default function SellerDeliveryZonesClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/seller/dashboard';
  const wrap = useCallback((href: string) => (fromDrawer ? withDrawerParam(href) : href), [fromDrawer]);

  const [userId, setUserId] = useState<string | null>(null);
  const [currency, setCurrency] = useState('NGN');
  const [storeSettingsRaw, setStoreSettingsRaw] = useState<Record<string, unknown>>({});
  const [offersPickup, setOffersPickup] = useState(true);
  const [pickupNote, setPickupNote] = useState('');
  const [rows, setRows] = useState<ZoneRow[]>([]);
  const [freeAbove, setFreeAbove] = useState('');
  const [outside, setOutside] = useState<OutsideZonePolicy>('quote');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      setUserId(uid);
      if (!uid) return;
      const { data, error: qErr } = await supabase
        .from('profiles')
        .select('currency_code, store_settings')
        .eq('id', uid)
        .maybeSingle();
      if (qErr) throw qErr;
      setCurrency(String(data?.currency_code || 'NGN'));
      const raw =
        data?.store_settings && typeof data.store_settings === 'object'
          ? (data.store_settings as Record<string, unknown>)
          : {};
      setStoreSettingsRaw(raw);
      const parsed = parseStoreDeliverySettings(raw);
      setOffersPickup(parsed ? parsed.offers_pickup !== false : true);
      setPickupNote(parsed?.pickup_note || '');
      setRows(
        (parsed?.delivery_zones || []).map((z) => ({
          id: z.id,
          name: z.name,
          fee: z.fee_minor > 0 ? String(Math.floor(z.fee_minor / 100)) : '',
          note: z.note || '',
        })),
      );
      setFreeAbove(
        parsed?.delivery_free_above_minor
          ? String(Math.floor(parsed.delivery_free_above_minor / 100))
          : '',
      );
      setOutside(parsed?.outside_zone ?? 'quote');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load settings.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!userId || saving) return;
    setSaving(true);
    setError(null);
    try {
      const zones: DeliveryZone[] = rows
        .map((row) => {
          const name = row.name.trim();
          if (!name) return null;
          const feeMajor = Number(String(row.fee).replace(/[^\d]/g, '')) || 0;
          const note = String(row.note || '').trim();
          return {
            id: row.id || createDeliveryZoneId(),
            name,
            fee_minor: Math.max(0, Math.floor(feeMajor * 100)),
            ...(note ? { note } : {}),
          } satisfies DeliveryZone;
        })
        .filter((z): z is DeliveryZone => Boolean(z))
        .slice(0, 6);

      if (!offersPickup && zones.length === 0) {
        setError('Enable pickup or add at least one delivery zone.');
        setSaving(false);
        return;
      }

      const freeAboveMajor = Number(String(freeAbove).replace(/[^\d]/g, '')) || 0;
      const noteTrim = pickupNote.trim().slice(0, 300);
      const nextSettings: Record<string, unknown> = {
        ...storeSettingsRaw,
        offers_pickup: offersPickup,
        ...(noteTrim && offersPickup ? { pickup_note: noteTrim } : {}),
        ...(zones.length
          ? {
              delivery_zones: zones,
              outside_zone: outside,
              ...(freeAboveMajor > 0
                ? { delivery_free_above_minor: Math.floor(freeAboveMajor * 100) }
                : {}),
            }
          : {}),
      };

      if (!offersPickup) delete nextSettings.pickup_note;
      if (!zones.length) {
        delete nextSettings.delivery_zones;
        delete nextSettings.delivery_free_above_minor;
        delete nextSettings.outside_zone;
      } else if (freeAboveMajor <= 0) {
        delete nextSettings.delivery_free_above_minor;
      }

      const { error: uErr } = await supabase
        .from('profiles')
        .update({ store_settings: nextSettings })
        .eq('id', userId);
      if (uErr) throw uErr;
      setStoreSettingsRaw(nextSettings);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not save delivery settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href={wrap(backHref)} className="inline-flex items-center gap-2 text-sm font-bold text-(--muted)">
          <ArrowLeft size={18} /> Back
        </Link>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || loading || !userId}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
        >
          {savedFlash ? 'Saved' : saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <h1 className="text-2xl font-black text-(--foreground)">Pickup & delivery</h1>
      <p className="mt-1 text-sm text-(--muted)">
        Shop-level options for product orders. You fulfill — not StoreLink.
      </p>

      {loading ? <p className="mt-6 text-sm text-(--muted)">Loading…</p> : null}
      {error ? <p className="mt-4 text-sm font-semibold text-red-500">{error}</p> : null}

      {!loading ? (
        <div className="mt-6 space-y-4">
          <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black tracking-widest text-(--muted)">OFFER PICKUP</p>
                <p className="mt-1 text-sm text-(--muted)">
                  Buyers can collect from you instead of delivery.
                </p>
              </div>
              <input
                type="checkbox"
                checked={offersPickup}
                onChange={(e) => setOffersPickup(e.target.checked)}
                className="mt-1 h-4 w-4 accent-emerald-600"
              />
            </div>
            {offersPickup ? (
              <input
                value={pickupNote}
                onChange={(e) => setPickupNote(e.target.value.slice(0, 300))}
                maxLength={300}
                className="mt-3 w-full rounded-xl border border-(--border) bg-(--background) px-3 py-2.5 text-sm font-semibold text-(--foreground)"
                placeholder="Pickup note (e.g. Lekki Phase 1 · Mon–Sat 10–6)"
              />
            ) : null}
          </section>

          <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
            <div className="mb-2 flex items-center gap-2">
              <MapPin size={14} className="text-emerald-600" />
              <p className="text-[10px] font-black tracking-widest text-(--muted)">
                DELIVERY ZONES ({currency})
              </p>
            </div>
            <p className="mb-3 text-sm text-(--muted)">
              For product orders when buyers choose Delivery. Outside zones can quote in chat; you can update
              the fee before payment.
            </p>

            <div className="space-y-3">
              {rows.map((row, idx) => (
                <div key={row.id} className="space-y-2 rounded-xl border border-(--border) p-3">
                  <div className="flex gap-2">
                    <input
                      value={row.name}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r)),
                        )
                      }
                      className="min-w-0 flex-1 rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm font-semibold"
                      placeholder={idx === 0 ? 'e.g. Ajah / Sangotedo' : 'Zone name'}
                    />
                    <input
                      value={row.fee}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, fee: e.target.value.replace(/[^\d]/g, '') } : r,
                          ),
                        )
                      }
                      inputMode="numeric"
                      className="w-24 rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm font-semibold"
                      placeholder="Fee"
                    />
                    <button
                      type="button"
                      onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                      className="rounded-lg border border-(--border) px-2 text-(--muted)"
                      aria-label="Remove zone"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    value={row.note}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r) => (r.id === row.id ? { ...r, note: e.target.value } : r)),
                      )
                    }
                    className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm"
                    placeholder="Note (optional)"
                  />
                </div>
              ))}
            </div>

            {rows.length < 6 ? (
              <button
                type="button"
                onClick={() =>
                  setRows((prev) => [...prev, { id: createDeliveryZoneId(), name: '', fee: '', note: '' }])
                }
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600"
              >
                <Plus size={16} /> Add zone
              </button>
            ) : null}

            {rows.length > 0 ? (
              <div className="mt-4 space-y-3 border-t border-(--border) pt-4">
                <div>
                  <label className="text-[10px] font-black tracking-widest text-(--muted)">
                    FREE DELIVERY ABOVE ({currency})
                  </label>
                  <input
                    value={freeAbove}
                    onChange={(e) => setFreeAbove(e.target.value.replace(/[^\d]/g, ''))}
                    inputMode="numeric"
                    className="mt-2 w-full rounded-xl border border-(--border) bg-(--background) px-3 py-2.5 text-sm font-semibold"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-widest text-(--muted)">OUTSIDE ZONES</p>
                  <div className="mt-2 inline-flex rounded-lg border border-(--border) bg-(--background) p-1">
                    <button
                      type="button"
                      onClick={() => setOutside('quote')}
                      className={`rounded-md px-3 py-1.5 text-[11px] font-black ${
                        outside === 'quote' ? 'bg-emerald-600 text-white' : 'text-(--foreground)'
                      }`}
                    >
                      Quote in chat
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutside('block')}
                      className={`rounded-md px-3 py-1.5 text-[11px] font-black ${
                        outside === 'block' ? 'bg-emerald-600 text-white' : 'text-(--foreground)'
                      }`}
                    >
                      Block
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
