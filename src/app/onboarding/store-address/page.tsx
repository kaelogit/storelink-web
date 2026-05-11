'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { AlertCircle, Check, Loader2, MapPin, Search } from 'lucide-react';

const DEBOUNCE_MS = 350;

type SelectedLocation = {
  lat: number;
  lon: number;
  label: string;
  city?: string;
  state?: string;
};

export default function StoreAddressPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [useHomeAddress, setUseHomeAddress] = useState(false);
  const [homeLocation, setHomeLocation] = useState<SelectedLocation | null>(null);
  const skipAutoSearchRef = useRef(false);
  const searchCacheRef = useRef<Map<string, any[]>>(new Map());
  const inFlightRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;
    const loadHome = async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (!uid) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('discovery_latitude, discovery_longitude, location, discovery_city, discovery_state')
        .eq('id', uid)
        .maybeSingle();
      if (!active || !profile) return;
      const lat = Number((profile as any).discovery_latitude || 0);
      const lon = Number((profile as any).discovery_longitude || 0);
      if (lat && lon) {
        setHomeLocation({
          lat,
          lon,
          label: String((profile as any).location || '').trim() || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
          city: (profile as any).discovery_city || undefined,
          state: (profile as any).discovery_state || undefined,
        });
      }
    };
    void loadHome();
    return () => {
      active = false;
    };
  }, [supabase]);

  const handleSearch = useCallback(async () => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 3) return;

    const cacheKey = normalizedQuery.toLowerCase();
    const cached = searchCacheRef.current.get(cacheKey);
    if (cached) {
      setHits(cached);
      setError(null);
      return;
    }

    if (inFlightRef.current) inFlightRef.current.abort();
    const controller = new AbortController();
    inFlightRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: normalizedQuery }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok || !data.results || data.results.length === 0) {
        setError(data.error || 'No addresses found.');
        setHits([]);
      } else {
        setHits(data.results);
        searchCacheRef.current.set(cacheKey, data.results);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError('Search failed. Please check your connection.');
    } finally {
      setLoading(false);
      if (inFlightRef.current === controller) inFlightRef.current = null;
    }
  }, [query]);

  useEffect(() => {
    return () => {
      if (inFlightRef.current) inFlightRef.current.abort();
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (skipAutoSearchRef.current) {
        skipAutoSearchRef.current = false;
        return;
      }
      if (query.trim().length >= 3) {
        void handleSearch();
      } else {
        setHits([]);
        setError(null);
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, handleSearch]);

  const persistStoreAddress = useCallback(
    async (location: SelectedLocation) => {
      const { data: sessionRes } = await supabase.auth.getSession();
      const uid = sessionRes.session?.user?.id;
      if (!uid) throw new Error('Not authenticated');

      const { data: latestStore } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!latestStore?.id) throw new Error('Store not found. Complete setup first.');

      const [storeRes, profileRes] = await Promise.all([
        supabase
          .from('stores')
          .update({
            address: location.label,
            city: location.city || null,
            state: location.state || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', latestStore.id),
        supabase
          .from('profiles')
          .update({
            service_latitude: location.lat,
            service_longitude: location.lon,
            onboarding_step: 'pick-categories',
            updated_at: new Date().toISOString(),
          })
          .eq('id', uid),
      ]);

      if (storeRes.error) throw storeRes.error;
      if (profileRes.error) throw profileRes.error;
    },
    [supabase],
  );

  const handleConfirm = useCallback(async () => {
    const chosen = useHomeAddress ? homeLocation : selectedLocation;
    if (!chosen) {
      setError(useHomeAddress ? 'Home address is not set yet. Set home address first.' : 'Please search and select a store address.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await persistStoreAddress(chosen);
      router.replace('/onboarding/pick-categories');
    } catch (e: any) {
      setError(e?.message || 'Failed to save store address.');
    } finally {
      setSaving(false);
    }
  }, [homeLocation, persistStoreAddress, router, selectedLocation, useHomeAddress]);

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <MapPin size={14} className="text-emerald-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Store Address</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Set your store address</h1>
        <p className="text-(--muted)">You can keep this same as home address or set a separate store location.</p>
      </div>

      <Card className="p-4">
        <button
          type="button"
          onClick={() => setUseHomeAddress((v) => !v)}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <div>
            <p className="text-sm font-black text-(--foreground)">Use home address as store address</p>
            <p className="text-xs text-(--muted)">Great if your store is at home.</p>
          </div>
          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${useHomeAddress ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-(--border)'}`}>
            {useHomeAddress ? <Check size={14} /> : null}
          </span>
        </button>
      </Card>

      {!useHomeAddress ? (
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-(--muted)">Search store address</label>
          <form onSubmit={(e) => { e.preventDefault(); void handleSearch(); }} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 73b Tejuosho Street, Yaba"
                className="w-full h-14 pl-12 pr-4 bg-(--surface) border border-(--border) rounded-2xl font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-(--muted)" size={20} />
            </div>
            <Button type="submit" disabled={loading} className="h-14 px-6">
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Search'}
            </Button>
          </form>

          {hits.map((hit, index) => (
            <Card
              key={index}
              onClick={() => {
                const city = hit.address.city || hit.address.town || hit.address.village || hit.address.hamlet;
                const state = hit.address.state;
                const label = String(hit.display_name || '').trim();
                skipAutoSearchRef.current = true;
                setQuery(label);
                setSelectedLocation({ lat: Number(hit.lat), lon: Number(hit.lon), label, city, state });
                setHits([]);
              }}
              className="p-4 cursor-pointer hover:border-emerald-500 transition-all"
            >
              <p className="font-bold text-sm">{hit.display_name}</p>
              <p className="text-[10px] text-(--muted) mt-1">{Number(hit.lat).toFixed(4)}, {Number(hit.lon).toFixed(4)}</p>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-4 text-sm text-(--muted)">
          {homeLocation ? `Using home: ${homeLocation.label}` : 'Home address is not set yet. Please set home address first.'}
        </Card>
      )}

      {error ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-bold">
          <AlertCircle size={16} />
          {error}
        </div>
      ) : null}

      <Button onClick={() => void handleConfirm()} disabled={saving} className="w-full h-14 text-sm font-black tracking-widest uppercase">
        {saving ? 'Saving…' : 'Continue'}
      </Button>
    </div>
  );
}
