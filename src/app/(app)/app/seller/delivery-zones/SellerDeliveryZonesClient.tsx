'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, MapPin, Pencil, Plus, X } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { withDrawerParam } from '@/components/profile-web/profileHubPaths';
import {
  createDeliveryZoneId,
  DEFAULT_ZONE_RADIUS_KM,
  deliveryZoneRadiusKm,
  MAX_ZONE_RADIUS_KM,
  MIN_ZONE_RADIUS_KM,
  parseStoreDeliverySettings,
  type DeliveryZone,
  type OutsideZonePolicy,
} from '@/lib/foodDeliveryZones';

type ZoneRow = {
  id: string;
  name: string;
  fee: string;
  note: string;
  latitude: number | null;
  longitude: number | null;
  radiusKm: string;
};

type ScreenMode = 'view' | 'edit';
type GeocodeHit = { lat: number; lon: number; display_name: string };

const DEBOUNCE_MS = 350;

function hydrateFromStoreSettings(storeSettings: unknown): {
  offersPickup: boolean;
  pickupNote: string;
  rows: ZoneRow[];
  freeAbove: string;
  outside: OutsideZonePolicy;
} {
  const parsed = parseStoreDeliverySettings(storeSettings);
  const raw =
    storeSettings && typeof storeSettings === 'object'
      ? (storeSettings as Record<string, unknown>)
      : null;
  return {
    offersPickup: parsed ? parsed.offers_pickup !== false : true,
    pickupNote: parsed?.pickup_note || (typeof raw?.pickup_note === 'string' ? raw.pickup_note : '') || '',
    rows: (parsed?.delivery_zones || []).map((z) => ({
      id: z.id,
      name: z.name,
      fee: z.fee_minor > 0 ? String(Math.floor(z.fee_minor / 100)) : '',
      note: z.note || '',
      latitude: typeof z.latitude === 'number' ? z.latitude : null,
      longitude: typeof z.longitude === 'number' ? z.longitude : null,
      radiusKm: String(deliveryZoneRadiusKm(z)),
    })),
    freeAbove: parsed?.delivery_free_above_minor
      ? String(Math.floor(parsed.delivery_free_above_minor / 100))
      : '',
    outside: parsed?.outside_zone ?? 'quote',
  };
}

function emptyRow(): ZoneRow {
  return {
    id: createDeliveryZoneId(),
    name: '',
    fee: '',
    note: '',
    latitude: null,
    longitude: null,
    radiusKm: String(DEFAULT_ZONE_RADIUS_KM),
  };
}

export default function SellerDeliveryZonesClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/seller/dashboard';
  const wrap = useCallback((href: string) => (fromDrawer ? withDrawerParam(href) : href), [fromDrawer]);

  const [mode, setMode] = useState<ScreenMode>('view');
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

  const [pinRowId, setPinRowId] = useState<string | null>(null);
  const [pinQuery, setPinQuery] = useState('');
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [pinLoading, setPinLoading] = useState(false);
  const inFlightRef = useRef<AbortController | null>(null);

  const applyHydrated = useCallback((raw: Record<string, unknown>) => {
    const next = hydrateFromStoreSettings(raw);
    setOffersPickup(next.offersPickup);
    setPickupNote(next.pickupNote);
    setRows(next.rows);
    setFreeAbove(next.freeAbove);
    setOutside(next.outside);
  }, []);

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
      applyHydrated(raw);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load settings.');
    } finally {
      setLoading(false);
    }
  }, [supabase, applyHydrated]);

  useEffect(() => {
    void load();
  }, [load]);

  const startEdit = () => {
    applyHydrated(storeSettingsRaw);
    setError(null);
    setPinRowId(null);
    setPinQuery('');
    setHits([]);
    setMode('edit');
  };

  const cancelEdit = () => {
    applyHydrated(storeSettingsRaw);
    setError(null);
    setPinRowId(null);
    setPinQuery('');
    setHits([]);
    setMode('view');
  };

  const searchPin = useCallback(
    async (q: string) => {
      const normalized = q.trim();
      if (normalized.length < 3) {
        setHits([]);
        return;
      }
      if (inFlightRef.current) inFlightRef.current.abort();
      const controller = new AbortController();
      inFlightRef.current = controller;
      setPinLoading(true);
      try {
        const { data: sessionRes } = await supabase.auth.getSession();
        const token = sessionRes.session?.access_token;
        if (!token) {
          setHits([]);
          return;
        }
        const response = await fetch('/api/geocode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ q: normalized }),
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.results)) {
          setHits([]);
          return;
        }
        setHits(
          data.results.map((r: GeocodeHit) => ({
            lat: Number(r.lat),
            lon: Number(r.lon),
            display_name: String(r.display_name || ''),
          })),
        );
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return;
        setHits([]);
      } finally {
        setPinLoading(false);
        if (inFlightRef.current === controller) inFlightRef.current = null;
      }
    },
    [supabase],
  );

  useEffect(() => {
    if (!pinRowId) return;
    const t = window.setTimeout(() => {
      void searchPin(pinQuery);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [pinQuery, pinRowId, searchPin]);

  const pickHit = (rowId: string, hit: GeocodeHit) => {
    const label = hit.display_name.trim();
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              name: r.name.trim() || label.split(',')[0]?.trim() || label,
              latitude: hit.lat,
              longitude: hit.lon,
              radiusKm: r.radiusKm || String(DEFAULT_ZONE_RADIUS_KM),
            }
          : r,
      ),
    );
    setPinRowId(null);
    setPinQuery('');
    setHits([]);
  };

  const handleSave = async () => {
    if (!userId || saving) return;
    setSaving(true);
    setError(null);
    try {
      const zones: DeliveryZone[] = [];
      for (const row of rows) {
        const name = row.name.trim();
        if (!name) continue;
        if (row.latitude == null || row.longitude == null) {
          setError(`Add a map pin for “${name}” so buyers match by location.`);
          setSaving(false);
          return;
        }
        const feeMajor = Number(String(row.fee).replace(/[^\d]/g, '')) || 0;
        const note = String(row.note || '').trim();
        const radiusRaw = Number(String(row.radiusKm).replace(/[^\d.]/g, ''));
        const radius_km = Number.isFinite(radiusRaw)
          ? Math.min(MAX_ZONE_RADIUS_KM, Math.max(MIN_ZONE_RADIUS_KM, radiusRaw))
          : DEFAULT_ZONE_RADIUS_KM;
        zones.push({
          id: row.id || createDeliveryZoneId(),
          name,
          fee_minor: Math.max(0, Math.floor(feeMajor * 100)),
          latitude: row.latitude,
          longitude: row.longitude,
          radius_km,
          ...(note ? { note } : {}),
        });
        if (zones.length >= 6) break;
      }

      if (!offersPickup && zones.length === 0) {
        setError('Enable pickup or add at least one delivery axis.');
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

      if (zones.length) {
        try {
          const { data: listings } = await supabase
            .from('service_listings')
            .select('id, availability_settings')
            .eq('seller_id', userId)
            .eq('is_active', true)
            .limit(40);
          for (const row of listings || []) {
            const prev =
              row.availability_settings && typeof row.availability_settings === 'object'
                ? (row.availability_settings as Record<string, unknown>)
                : {};
            const merged: Record<string, unknown> = {
              ...prev,
              delivery_zones: zones,
              outside_zone: outside,
            };
            if (freeAboveMajor > 0) {
              merged.delivery_free_above_minor = Math.floor(freeAboveMajor * 100);
            } else {
              delete merged.delivery_free_above_minor;
            }
            await supabase
              .from('service_listings')
              .update({ availability_settings: merged })
              .eq('id', row.id)
              .eq('seller_id', userId);
          }
        } catch {
          /* shop settings already saved */
        }
      }

      setStoreSettingsRaw(nextSettings);
      applyHydrated(nextSettings);
      setPinRowId(null);
      setMode('view');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not save delivery settings.');
    } finally {
      setSaving(false);
    }
  };

  const outsideLabel = outside === 'block' ? 'Block — listed zones only' : 'Allow quote in chat';

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        {mode === 'edit' ? (
          <button
            type="button"
            onClick={cancelEdit}
            className="inline-flex items-center gap-2 text-sm font-bold text-(--muted)"
          >
            <ArrowLeft size={18} /> Back
          </button>
        ) : (
          <Link href={wrap(backHref)} className="inline-flex items-center gap-2 text-sm font-bold text-(--muted)">
            <ArrowLeft size={18} /> Back
          </Link>
        )}
        {mode === 'edit' ? (
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || loading || !userId}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        ) : (
          <span className="w-16" />
        )}
      </div>

      <h1 className="text-2xl font-black text-(--foreground)">
        {mode === 'edit' ? 'Edit pickup & delivery' : 'Pickup & delivery'}
      </h1>
      <p className="mt-1 text-sm text-(--muted)">
        Map axes with a radius. Buyers inside an axis pay that fee automatically.
      </p>

      {loading ? <p className="mt-6 text-sm text-(--muted)">Loading…</p> : null}
      {error ? <p className="mt-4 text-sm font-semibold text-red-500">{error}</p> : null}

      {!loading && mode === 'view' ? (
        <div className="mt-6 space-y-4">
          <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
            <p className="text-[10px] font-black tracking-widest text-(--muted)">PICKUP</p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-(--foreground)">
                  {offersPickup ? 'Offered' : 'Not offered'}
                </p>
                <p className="mt-1 text-sm text-(--muted)">
                  {offersPickup
                    ? pickupNote.trim() || 'No pickup note'
                    : 'Buyers cannot choose pickup.'}
                </p>
              </div>
              {offersPickup ? <Check size={18} className="mt-0.5 text-emerald-600" /> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
            <div className="mb-2 flex items-center gap-2">
              <MapPin size={14} className="text-emerald-600" />
              <p className="text-[10px] font-black tracking-widest text-(--muted)">
                DELIVERY AXES ({currency})
              </p>
            </div>
            {rows.length === 0 ? (
              <p className="text-sm text-(--muted)">
                No delivery axes yet. Add map pins with a radius so buyer GPS can match.
              </p>
            ) : (
              <div className="space-y-3">
                {rows.map((row) => (
                  <div key={row.id} className="space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-(--foreground)">{row.name || 'Unnamed axis'}</p>
                      <p className="text-sm font-semibold text-(--foreground)">
                        {row.fee ? `${currency} ${row.fee}` : 'Free'}
                      </p>
                    </div>
                    <p className="text-sm text-(--muted)">
                      {row.latitude != null && row.longitude != null
                        ? `${row.radiusKm || DEFAULT_ZONE_RADIUS_KM} km radius`
                        : 'Needs map pin'}
                      {row.note.trim() ? ` · ${row.note.trim()}` : ''}
                    </p>
                  </div>
                ))}
                {freeAbove ? (
                  <p className="text-sm text-(--muted)">
                    Free delivery above {currency} {freeAbove}
                  </p>
                ) : null}
                <p className="text-sm text-(--muted)">Outside axes: {outsideLabel}</p>
              </div>
            )}
          </section>

          <button
            type="button"
            onClick={startEdit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm font-bold text-(--foreground)"
          >
            <Pencil size={16} /> Edit pickup & delivery
          </button>
        </div>
      ) : null}

      {!loading && mode === 'edit' ? (
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
                DELIVERY AXES ({currency})
              </p>
            </div>
            <p className="mb-3 text-sm text-(--muted)">
              Pin an area and set a radius (default {DEFAULT_ZONE_RADIUS_KM} km). GPS / current location inside the
              circle matches automatically.
            </p>

            <div className="space-y-3">
              {rows.map((row, idx) => {
                const hasPin = row.latitude != null && row.longitude != null;
                const pinOpen = pinRowId === row.id;
                return (
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
                        placeholder={idx === 0 ? 'e.g. Sangotedo' : 'Axis name'}
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
                        onClick={() => {
                          setRows((prev) => prev.filter((r) => r.id !== row.id));
                          if (pinRowId === row.id) {
                            setPinRowId(null);
                            setHits([]);
                          }
                        }}
                        className="rounded-lg border border-(--border) px-2 text-(--muted)"
                        aria-label="Remove axis"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-(--muted)">Radius (km)</label>
                      <input
                        value={row.radiusKm}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, radiusKm: e.target.value.replace(/[^\d.]/g, '') } : r,
                            ),
                          )
                        }
                        inputMode="decimal"
                        className="w-20 rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm font-semibold"
                      />
                      <span className="text-xs text-(--muted)">
                        {MIN_ZONE_RADIUS_KM}–{MAX_ZONE_RADIUS_KM}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (pinOpen) {
                          setPinRowId(null);
                          setHits([]);
                          setPinQuery('');
                        } else {
                          setPinRowId(row.id);
                          setPinQuery(row.name);
                          setHits([]);
                        }
                      }}
                      className={`inline-flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${
                        hasPin
                          ? 'border-emerald-600 text-emerald-600'
                          : 'border-(--border) text-(--foreground)'
                      }`}
                    >
                      <MapPin size={14} />
                      {hasPin ? 'Pin set — click to change' : 'Add map pin (required)'}
                    </button>

                    {pinOpen ? (
                      <div className="space-y-2">
                        <input
                          value={pinQuery}
                          onChange={(e) => setPinQuery(e.target.value)}
                          className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm"
                          placeholder="Search area (e.g. Sangotedo, Lagos)"
                        />
                        {pinLoading ? <p className="text-xs text-(--muted)">Searching…</p> : null}
                        {hits.length > 0 ? (
                          <ul className="max-h-40 space-y-1 overflow-auto rounded-lg border border-(--border)">
                            {hits.map((hit) => (
                              <li key={`${hit.lat},${hit.lon},${hit.display_name}`}>
                                <button
                                  type="button"
                                  onClick={() => pickHit(row.id, hit)}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-(--surface)"
                                >
                                  {hit.display_name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ) : null}

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
                );
              })}
            </div>

            {rows.length < 6 ? (
              <button
                type="button"
                onClick={() => setRows((prev) => [...prev, emptyRow()])}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600"
              >
                <Plus size={16} /> Add axis
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
                  <p className="text-[10px] font-black tracking-widest text-(--muted)">OUTSIDE AXES</p>
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
