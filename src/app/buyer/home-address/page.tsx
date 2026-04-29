'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ArrowLeft, MapPin, Search, Check, AlertCircle, Loader2 } from 'lucide-react';

function HomeAddressContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserClient();
  
  const nextRoute = searchParams.get('next') || '/(tabs)';
  const isRequired = searchParams.get('required') === 'true';

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lon: number;
    label: string;
    city?: string;
    state?: string;
  } | null>(null);

  // Search logic (Using backend API that supports Google Maps + Nominatim)
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim().length < 3) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.results || data.results.length === 0) {
        setError(data.error || 'No addresses found. Try searching with a street name or area.');
        setHits([]);
      } else {
        setHits(data.results);
      }
    } catch (err) {
      setError('Search failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHit = (hit: any) => {
    const city = hit.address.city || hit.address.town || hit.address.village || hit.address.hamlet;
    const state = hit.address.state;
    
    setSelectedLocation({
      lat: parseFloat(hit.lat),
      lon: parseFloat(hit.lon),
      label: hit.display_name,
      city,
      state
    });
    setQuery(hit.display_name);
    setHits([]);
  };

  const confirmSelection = async () => {
    if (!selectedLocation) {
      setError('Please search and select an address first.');
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', session.user.id)
        .single();

      const { error: upErr } = await supabase
        .from('profiles')
        .update({
          discovery_latitude: selectedLocation.lat,
          discovery_longitude: selectedLocation.lon,
          discovery_city: selectedLocation.city,
          discovery_state: selectedLocation.state,
          location_city: selectedLocation.city,
          location_state: selectedLocation.state,
          // Only update the 'location' text string for Shoppers (Matches Mobile Logic)
          ...(!profile?.is_seller ? { 
            location: selectedLocation.label, 
            location_last_changed_at: new Date().toISOString() 
          } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (upErr) throw upErr;
      
      router.replace(nextRoute);
    } catch (err: any) {
      setError(err.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => !isRequired && router.back()}
          className={`p-2 rounded-full hover:bg-[var(--surface)] transition-colors ${isRequired ? 'opacity-20 cursor-not-allowed' : ''}`}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-sm font-black tracking-[0.2em] uppercase">Home Address</h1>
        <div className="w-10" />
      </div>

      {/* Info Box */}
      <div className="flex gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
        <MapPin className="text-emerald-600 shrink-0" size={24} strokeWidth={2.5} />
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Search for your complete home address (street address, building number, or area name). We use the exact coordinates to show accurate distances to nearby stores and services.
        </p>
      </div>

      {/* Search Input */}
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Search Address</label>
        <form onSubmit={handleSearch} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 73b Tejuosho Street, Yaba or Lekki Phase 1"
              className="w-full h-14 pl-12 pr-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={20} />
          </div>
          <Button type="submit" disabled={loading} className="h-14 px-6">
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
          </Button>
        </form>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm font-bold animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="space-y-3">
        {hits.map((hit, index) => (
          <Card 
            key={index} 
            onClick={() => handleSelectHit(hit)}
            className="p-4 cursor-pointer hover:border-emerald-500 transition-all flex items-center justify-between group"
          >
            <div className="space-y-1">
              <p className="font-bold text-sm leading-tight">{hit.display_name}</p>
              <p className="text-[10px] text-[var(--muted)] font-medium">
                {parseFloat(hit.lat).toFixed(4)}, {parseFloat(hit.lon).toFixed(4)}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors">
              <Check size={18} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Card>
        ))}
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-8 left-0 right-0 px-6 max-w-2xl mx-auto">
        <Button
          onClick={confirmSelection}
          disabled={saving || !selectedLocation}
          className="w-full h-16 text-lg font-black tracking-widest uppercase shadow-xl"
        >
          {saving ? 'Saving...' : 'Confirm Home Address'}
        </Button>
      </div>
    </div>
  );
}

export default function HomeAddressPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>}>
      <HomeAddressContent />
    </Suspense>
  );
}