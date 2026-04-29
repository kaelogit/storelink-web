'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import { MapPin, Navigation, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

function LocationPermissionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [loadingSkip, setLoadingSkip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  // Get next route from URL params, default to pick-categories
  const nextRoute = searchParams.get('next') || '/onboarding/pick-categories';

  // Function to move to the next step in the funnel (Matches Mobile logic)
  const continueFlow = () => {
    const params = new URLSearchParams();
    params.set('next', nextRoute);
    params.set('required', 'true');
    router.replace(`/buyer/home-address?${params.toString()}`);
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        { headers: { 'User-Agent': 'StoreLink/1.0' } }
      );
      if (!response.ok) throw new Error('Geocoding failed');
      const data = await response.json();
      const address = data.address || {};
      return {
        city: address.city || address.town || address.village || address.hamlet || null,
        state: address.state || null,
      };
    } catch (err) {
      console.warn('Reverse geocoding failed:', err);
      return { city: null, state: null };
    }
  };

  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        setLocationStatus(result.state as 'unknown' | 'granted' | 'denied');
      });
    }
  }, []);

  const handleAllowLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationStatus('granted');

        try {
          const { city, state } = await reverseGeocode(latitude, longitude);
          const supabase = createBrowserClient();
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                discovery_latitude: latitude,
                discovery_longitude: longitude,
                discovery_city: city,
                discovery_state: state,
                updated_at: new Date().toISOString(),
              })
              .eq('id', session.user.id);

            if (updateError) throw updateError;
          }
          
          continueFlow();
        } catch (err: any) {
          setError(err?.message || 'Failed to save location');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLocationStatus('denied');
        setError(`Location access denied. Please enable it in your browser settings to see nearby stores.`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleSkip = () => {
    setLoadingSkip(true);
    continueFlow();
  };

  return (
    <div className="flex flex-col min-h-[80vh] space-y-8">
      {/* Header (Matching Mobile centered style) */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-19 h-19 rounded-3xl bg-(--surface) flex items-center justify-center">
          <MapPin size={32} className="text-emerald-500" strokeWidth={2.5} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">Enable location?</h1>
          <p className="text-base text-(--muted) leading-relaxed max-w-sm">
            We use your location to show nearby services, more relevant discovery, and accurate distance labels.
          </p>
        </div>
      </div>

      {/* Benefits Section (Matching BenefitRow from Mobile) */}
      <div className="space-y-4 py-2">
        <BenefitRow label="See services and products near you first" />
        <BenefitRow label="Get better city/state recommendations" />
        <BenefitRow label="Improve local relevance in feed and search" />
      </div>

      <div className="mt-auto space-y-3">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-bold justify-center">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Primary Action */}
        <Button
          onClick={handleAllowLocation}
          disabled={loading || loadingSkip}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-sm font-black tracking-widest uppercase"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Navigation size={18} strokeWidth={2.5} />
              ALLOW LOCATION
              <ArrowRight size={18} strokeWidth={2.5} />
            </>
          )}
        </Button>

        {/* Secondary Action */}
        <button
          onClick={handleSkip}
          disabled={loading || loadingSkip}
          className="w-full h-12 rounded-2xl border border-(--border) text-sm font-bold text-(--foreground) hover:bg-(--surface) transition-colors"
        >
          {loadingSkip ? 'Loading...' : 'Not now'}
        </button>
      </div>
    </div>
  );
}

// Reusable Benefit Component to match Mobile's BenefitRow
function BenefitRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <ShieldCheck size={18} className="text-emerald-500" strokeWidth={2.5} />
      <span className="text-sm font-semibold text-(--foreground)">{label}</span>
    </div>
  );
}

export default function LocationPermissionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    }>
      <LocationPermissionContent />
    </Suspense>
  );
}