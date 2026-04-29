'use client';

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { getGeographyForCountry } from '@/lib/geographyResolver';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, X, MapPin, Gem, Store, Navigation } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { hasActivePaidPlan } from '@/lib/sellerStatus';

type SearchMode = 'stores' | 'services';

interface Merchant {
  id: string;
  display_name: string;
  slug: string;
  logo_url?: string;
  location_city?: string;
  location_state?: string;
  subscription_plan?: string;
  category?: string;
}

interface ServiceSeller {
  id: string;
  display_name: string;
  slug: string;
  logo_url?: string;
  location_city?: string;
  location_state?: string;
  subscription_plan?: string;
}

interface ServiceListing {
  id: string;
  seller_id?: string;
  title: string;
  description?: string;
  hero_price_min?: number;
  currency_code?: string;
  service_category?: string;
  delivery_type?: string;
  location_type?: string;
  media?: any[];
  seller?: ServiceSeller | ServiceSeller[];
  distance_km?: number;
}

export default function AppSearchPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  // State management
  const [searchText, setSearchText] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [mode, setMode] = useState<SearchMode>('stores');
  const [rankingSeed, setRankingSeed] = useState(() => Math.random().toString());

  // Location modal state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationPickerStep, setLocationPickerStep] = useState<'main' | 'state' | 'city'>('main');
  const [locationPickerState, setLocationPickerState] = useState<string | null>(null);
  const [locationPickerCity, setLocationPickerCity] = useState<string | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [locating, setLocating] = useState(false);

  // User profile state
  const [profile, setProfile] = useState<any>(null);

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data);
      }
    };
    loadProfile();
  }, []);

  // Category options based on mode
  const categories = useMemo(() => {
    if (mode === 'services') {
      return [
        'All',
        'Nail Tech',
        'Barber',
        'Makeup Artist',
        'Makeup Artistry',
        'Pedicure/Manicure',
        'Braids Styling',
        'Lashes',
        'Skincare',
        'Photographer',
        'Surprise Planners',
        'Event Decorator',
        'Tailoring',
        'Alterations',
        'Custom Outfits',
      ];
    }
    return [
      'All',
      'Fashion',
      'Beauty',
      'Electronics',
      'Home',
      'Wellness',
      'Real Estate',
      'Automotive',
    ];
  }, [mode]);

  // Ensure selected category is valid when switching modes
  useEffect(() => {
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory('All');
    }
  }, [categories, selectedCategory]);

  // Category slug mapping
  const categoryLabelToSlug = useCallback((label: string) => {
    const mappings: Record<string, string> = {
      'Real Estate': 'real-estate',
      'Nail Tech': 'nail_tech',
      'Braids Styling': 'braids_styling',
      'Makeup Artist': 'makeup_artist',
      'Makeup Artistry': 'makeup_artistry',
      'Pedicure/Manicure': 'pedicure_manicure',
      'Surprise Planners': 'surprise_planners',
      'Event Decorator': 'event_decorator',
      'Custom Outfits': 'custom_outfits',
    };
    return mappings[label] || label.toLowerCase();
  }, []);

  // Discovery location helpers
  const geography = useMemo(() => getGeographyForCountry(profile?.location_country_code), [profile?.location_country_code]);
  const geoData = geography?.data ?? {};
  const statesList = useMemo(() => Object.keys(geoData).sort(), [geoData]);
  const citiesForState = useMemo(() => {
    if (!locationPickerState) return [];
    return (geoData[locationPickerState] ?? []).sort();
  }, [locationPickerState, geoData]);

  const filteredStates = useMemo(() => {
    const q = locationSearch.trim().toLowerCase();
    return q ? statesList.filter((s) => s.toLowerCase().includes(q)) : statesList;
  }, [locationSearch, statesList]);

  const filteredCities = useMemo(() => {
    const q = locationSearch.trim().toLowerCase();
    return q ? citiesForState.filter((c: string) => c.toLowerCase().includes(q)) : citiesForState;
  }, [locationSearch, citiesForState]);

  const discoveryLocationLabel = useMemo(() => {
    if (profile?.discovery_latitude != null && profile?.discovery_longitude != null) {
      return 'Using your location for distance';
    }
    if (profile?.discovery_city || profile?.discovery_state) {
      return `Near: ${[profile.discovery_city, profile.discovery_state].filter(Boolean).join(', ') || 'Set'}`;
    }
    return 'Set city & state for better matches';
  }, [profile]);

  // Location handlers
  const handleUseMyLocation = useCallback(async () => {
    if (!profile?.id) return;
    setLocating(true);

    try {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser');
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const { latitude, longitude } = position.coords;
      let discoveryCity: string | null = profile.discovery_city ?? null;
      let discoveryState: string | null = profile.discovery_state ?? null;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
          { headers: { 'User-Agent': 'StoreLink/1.0' } }
        );
        if (response.ok) {
          const data = await response.json();
          const address = data.address || {};
          if (address.city) discoveryCity = address.city;
          if (address.region) discoveryState = address.region;
        }
      } catch (err) {
        console.warn('Reverse geocoding failed:', err);
      }

      const { error } = await supabase.from('profiles').update({
        discovery_latitude: latitude,
        discovery_longitude: longitude,
        discovery_city: discoveryCity,
        discovery_state: discoveryState,
        updated_at: new Date().toISOString(),
      }).eq('id', profile.id);

      if (error) throw error;

      // Refresh profile
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single();
      setProfile(data);

      setShowLocationModal(false);
    } catch (err: any) {
      alert(`Location access failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setLocating(false);
    }
  }, [profile, supabase]);

  const handleChooseCityState = useCallback(async (state: string, city: string) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase.from('profiles').update({
        discovery_city: city,
        discovery_state: state,
        discovery_latitude: null,
        discovery_longitude: null,
        updated_at: new Date().toISOString(),
      }).eq('id', profile.id);

      if (error) throw error;

      // Refresh profile
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single();
      setProfile(data);

      setShowLocationModal(false);
      setLocationPickerStep('main');
      setLocationPickerState(null);
      setLocationPickerCity(null);
      setLocationSearch('');
    } catch (err: any) {
      alert(`Failed to save location: ${err?.message || 'Unknown error'}`);
    }
  }, [profile, supabase]);

  // Search queries
  const PAGE_LIMIT = 40;

  const {
    data: storePages,
    isLoading: isLoadingStores,
    isFetching: isFetchingStores,
    refetch: refetchStores,
    fetchNextPage: fetchNextStoresPage,
    hasNextPage: hasNextStoresPage,
    isFetchingNextPage: isFetchingNextStoresPage,
  } = useInfiniteQuery<Merchant[], Error>({
    queryKey: [
      'web-discovery-merchants',
      activeQuery,
      selectedCategory,
      profile?.location_state,
      profile?.location_country,
      rankingSeed,
    ],
    enabled: mode === 'stores',
    staleTime: 1000 * 60 * 5,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const lastLength = Array.isArray(lastPage) ? lastPage.length : 0;
      if (lastLength < PAGE_LIMIT) return undefined;
      return allPages.length * PAGE_LIMIT;
    },
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;

      try {
        const { data, error } = await supabase.rpc('get_weighted_merchants', {
          p_user_id: profile?.id || null,
          p_search: activeQuery.trim() || null,
          p_category: selectedCategory === 'All' ? null : categoryLabelToSlug(selectedCategory),
          p_location_state: profile?.location_state || null,
          p_location_country: profile?.location_country ?? 'Nigeria',
          p_limit: PAGE_LIMIT,
          p_offset: offset,
        });

        if (error) throw error;

        const raw = (data || []) as any[];
        const userState = profile?.location_state || null;

        // Deterministic jitter per merchant+seed
        const jitterFor = (id: string | null | undefined) => {
          if (!id) return 0;
          let hash = 0;
          const src = id + rankingSeed;
          for (let i = 0; i < src.length; i++) {
            hash = (hash * 31 + src.charCodeAt(i)) | 0;
          }
          return (Math.abs(hash) % 1000) / 1000;
        };

        const scored = raw
          .map((m) => {
            if (!hasActivePaidPlan({ ...m, is_seller: true })) return null;

            const plan = (m.subscription_plan || '').toLowerCase();
            let planWeight = 1;
            if (plan === 'diamond') planWeight = 3;
            else if (plan === 'standard') planWeight = 2;

            let stateWeight = 0;
            if (userState && m.location_state && String(m.location_state).toLowerCase() === String(userState).toLowerCase()) {
              stateWeight = 0.8;
            }

            const jitter = jitterFor(m.id) * 0.5;
            const score = planWeight + stateWeight + jitter;
            return { m, score };
          })
          .filter((x) => x && typeof x.score === 'number')
          .sort((a, b) => b!.score - a!.score)
          .map((x) => x!.m);

        return scored;
      } catch (err) {
        // Fallback query
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name, slug, logo_url, location_city, location_state, subscription_plan, subscription_status, subscription_expiry, category')
          .eq('is_seller', true)
          .eq('subscription_status', 'active')
          .limit(40);

        const raw = (data || []) as any[];
        const userState = profile?.location_state || null;

        const jitterFor = (id: string | null | undefined) => {
          if (!id) return 0;
          let hash = 0;
          const src = id + rankingSeed;
          for (let i = 0; i < src.length; i++) {
            hash = (hash * 31 + src.charCodeAt(i)) | 0;
          }
          return (Math.abs(hash) % 1000) / 1000;
        };

        return raw
          .map((m) => {
            if (!hasActivePaidPlan({ ...m, is_seller: true })) return null;

            const plan = (m.subscription_plan || '').toLowerCase();
            let planWeight = 1;
            if (plan === 'diamond') planWeight = 3;
            else if (plan === 'standard') planWeight = 2;

            let stateWeight = 0;
            if (userState && m.location_state && String(m.location_state).toLowerCase() === String(userState).toLowerCase()) {
              stateWeight = 0.8;
            }

            const jitter = jitterFor(m.id) * 0.5;
            const score = planWeight + stateWeight + jitter;
            return { m, score };
          })
          .filter((x) => x && typeof x.score === 'number')
          .sort((a, b) => b!.score - a!.score)
          .map((x) => x!.m);
      }
    },
  });

  const {
    data: servicePages,
    isFetching: isFetchingServices,
    fetchNextPage: fetchNextServicesPage,
    hasNextPage: hasNextServicesPage,
    isFetchingNextPage: isFetchingNextServicesPage,
    refetch: refetchServices,
  } = useInfiniteQuery<ServiceListing[], Error>({
    queryKey: [
      'web-discovery-services',
      activeQuery,
      selectedCategory,
      profile?.discovery_latitude,
      profile?.discovery_longitude,
      profile?.discovery_city,
      profile?.discovery_state,
      profile?.location_country,
      rankingSeed,
    ],
    enabled: mode === 'services',
    staleTime: 1000 * 60 * 5,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const lastLength = Array.isArray(lastPage) ? lastPage.length : 0;
      if (lastLength < PAGE_LIMIT) return undefined;
      return allPages.length * PAGE_LIMIT;
    },
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      const limit = PAGE_LIMIT;

      const hasDiscovery =
        profile?.discovery_latitude != null &&
        profile?.discovery_longitude != null;

      if (hasDiscovery && profile?.id) {
        const { data, error } = await supabase.rpc('get_services_nearby', {
          p_user_id: profile.id,
          p_search: activeQuery.trim() || null,
          p_category: selectedCategory === 'All' ? null : categoryLabelToSlug(selectedCategory),
          p_limit: limit,
          p_offset: offset,
        });
        if (error) throw error;
        return (data || []) as ServiceListing[];
      }

      // Fallback: simple listing
      const { data, error } = await supabase
        .from('service_listings')
        .select(`
          id,
          title,
          description,
          hero_price_min,
          currency_code,
          service_category,
          delivery_type,
          location_type,
          media,
          seller:profiles (
            id,
            display_name,
            slug,
            logo_url,
            location_city,
            location_state,
            subscription_plan
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      let rows = (data || []) as unknown as ServiceListing[];

      if (activeQuery.trim()) {
        const q = activeQuery.trim().toLowerCase();
        rows = rows.filter(
          (row) =>
            String(row.title || '').toLowerCase().includes(q) ||
            String(row.description || '').toLowerCase().includes(q)
        );
      }

      if (selectedCategory !== 'All') {
        const cat = categoryLabelToSlug(selectedCategory).toLowerCase();

        const beautyServiceCats = [
          'nail_tech', 'barber', 'makeup_artist', 'makeup_artistry',
          'pedicure_manicure', 'braids_styling', 'lashes', 'skincare'
        ];
        const fashionServiceCats = ['tailoring', 'alterations', 'custom_outfits'];

        rows = rows.filter((row) => {
          const serviceCat = String(row.service_category || '').toLowerCase();

          if (cat === 'beauty') return beautyServiceCats.includes(serviceCat);
          if (cat === 'fashion') return fashionServiceCats.includes(serviceCat);
          return serviceCat === cat;
        });
      }

      return rows;
    },
  });

  const merchants = useMemo(() => {
    const flattened = storePages?.pages ? storePages.pages.flat() : [];
    return flattened as Merchant[];
  }, [storePages]);

  const services = useMemo(() => {
    const flattened = servicePages?.pages ? servicePages.pages.flat() : [];
    const dedupedBySeller = new Map<string, any>();
    for (const row of flattened) {
      const seller = Array.isArray(row?.seller) ? row.seller[0] : row?.seller;
      const sellerId = String(row?.seller_id ?? seller?.id ?? row?.id ?? '');
      if (!sellerId) continue;
      if (!dedupedBySeller.has(sellerId)) {
        dedupedBySeller.set(sellerId, row);
      }
    }
    return Array.from(dedupedBySeller.values()) as ServiceListing[];
  }, [servicePages]);

  // Search handlers
  const handleSubmit = useCallback(() => {
    setActiveQuery(searchText);
    setRankingSeed(Math.random().toString());
  }, [searchText]);

  const handleClear = useCallback(() => {
    setSearchText('');
    setActiveQuery('');
  }, []);

  const handleRefresh = useCallback(() => {
    setRankingSeed(Math.random().toString());
    if (mode === 'stores') {
      refetchStores();
    } else {
      refetchServices();
    }
  }, [mode, refetchStores, refetchServices]);

  // Discovery prompt
  const shouldShowDiscoveryPrompt =
    mode === 'services' &&
    !profile?.discovery_city &&
    !profile?.discovery_state;

  return (
    <div className="flex flex-col min-h-screen bg-(--background)">
      {/* Header */}
      <div className="sticky top-[80px] z-20 border-b border-(--border) bg-(--background)/90 backdrop-blur-xl px-4 py-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-black tracking-tight text-(--foreground)">Discover</h1>
          <p className="text-sm text-(--muted)">Find stores and brands</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-(--border)">
        <div className="flex items-center gap-2 bg-(--surface) border border-(--border) rounded-2xl px-4 py-3">
          <Search size={20} className="text-(--muted)" />
          <input
            type="text"
            placeholder="Search stores..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="flex-1 bg-transparent text-(--foreground) placeholder-(--muted) outline-none"
          />
          {searchText && (
            <button onClick={handleClear} className="text-(--muted) hover:text-(--foreground)">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 px-4 py-3 border-b border-(--border)">
        {[
          { key: 'stores' as SearchMode, label: 'Stores' },
          { key: 'services' as SearchMode, label: 'Services' },
        ].map((opt) => {
          const active = mode === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => {
                if (mode === opt.key) return;
                setMode(opt.key);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                active
                  ? 'bg-(--foreground) text-(--background)'
                  : 'bg-transparent text-(--muted) hover:text-(--foreground)'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Discovery Prompt */}
      {shouldShowDiscoveryPrompt && (
        <div className="mx-4 my-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <p className="text-sm text-(--foreground) mb-3">
            Turn on location or set city & state to see services near you and distance labels.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLocationModal(true)}
              className="px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-semibold"
            >
              Choose city & state
            </button>
            <button
              onClick={handleUseMyLocation}
              className="px-3 py-1 border border-emerald-500 text-emerald-600 rounded-full text-xs font-semibold"
            >
              Use my location
            </button>
          </div>
        </div>
      )}

      {/* Location Chip */}
      {mode === 'services' && (
        <div className="px-4 py-2">
          <button
            onClick={() => setShowLocationModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-(--surface) border border-(--border) rounded-xl text-sm"
          >
            <MapPin size={14} className="text-(--muted)" />
            <span className="text-(--foreground) font-medium">{discoveryLocationLabel}</span>
            <Navigation size={12} className="text-(--muted)" />
          </button>
        </div>
      )}

      {/* Category Filters */}
      <div className="px-4 py-3 border-b border-(--border)">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setActiveQuery(searchText);
                  setRankingSeed(Math.random().toString());
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-(--foreground) text-(--background)'
                    : 'bg-(--surface) text-(--muted) hover:text-(--foreground) border border-(--border)'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Grid */}
      <div className="flex-1 px-4 py-4">
        {(mode === 'stores' ? isLoadingStores : isFetchingServices) ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="ml-3 text-(--muted)">
              {mode === 'stores' ? 'CURATING STORES...' : 'FINDING SERVICES...'}
            </p>
          </div>
        ) : (mode === 'stores' ? merchants : services).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-(--surface) border border-(--border) rounded-full flex items-center justify-center mb-4">
              <Store size={24} className="text-(--muted)" />
            </div>
            <h3 className="text-lg font-semibold text-(--foreground) mb-2">
              {mode === 'stores' ? 'NO STORES FOUND' : 'NO SERVICES FOUND'}
            </h3>
            <p className="text-(--muted) text-center">
              Adjust your filters or search terms to discover more.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {(mode === 'stores' ? merchants : services).map((item) => (
                <MerchantCard
                  key={`${mode}-${item.id}`}
                  item={item}
                  mode={mode}
                  currentUserId={profile?.id}
                  onPress={(id) => router.push(`/u/${id}`)}
                />
              ))}
            </div>

            {/* Load More */}
            {(mode === 'stores' ? hasNextStoresPage : hasNextServicesPage) && (
              <div className="flex justify-center py-8">
                <Button
                  onClick={() => {
                    if (mode === 'stores') {
                      fetchNextStoresPage();
                    } else {
                      fetchNextServicesPage();
                    }
                  }}
                  disabled={mode === 'stores' ? isFetchingNextStoresPage : isFetchingNextServicesPage}
                  className="px-6 py-3"
                >
                  {mode === 'stores' ? isFetchingNextStoresPage : isFetchingNextServicesPage ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading...
                    </div>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-(--background) rounded-t-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-1.5 bg-(--border) rounded-full mx-auto mb-6"></div>

              <h2 className="text-lg font-bold text-(--foreground) mb-2">Discovery location</h2>
              <p className="text-sm text-(--muted) mb-6">
                Set where you are to see "X km away" on services.
              </p>

              {locationPickerStep === 'main' && (
                <>
                  <button
                    onClick={handleUseMyLocation}
                    disabled={locating}
                    className="w-full flex items-center gap-3 p-4 bg-(--surface) border border-(--border) rounded-xl mb-3"
                  >
                    {locating ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                    ) : (
                      <Navigation size={20} className="text-(--foreground)" />
                    )}
                    <span className="text-(--foreground) font-medium">
                      {locating ? 'Getting location...' : 'Use my location'}
                    </span>
                  </button>

                  <button
                    onClick={() => setLocationPickerStep('state')}
                    className="w-full flex items-center gap-3 p-4 bg-(--surface) border border-(--border) rounded-xl mb-3"
                  >
                    <MapPin size={20} className="text-(--foreground)" />
                    <span className="text-(--foreground) font-medium">Choose city & state</span>
                  </button>
                </>
              )}

              {locationPickerStep === 'state' && (
                <>
                  <button
                    onClick={() => {
                      setLocationPickerStep('main');
                      setLocationPickerState(null);
                      setLocationSearch('');
                    }}
                    className="w-full flex items-center gap-3 p-4 bg-(--surface) border border-(--border) rounded-xl mb-3"
                  >
                    <span className="text-(--foreground) font-medium">← Back</span>
                  </button>

                  <input
                    type="text"
                    placeholder="Search state..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="w-full p-3 bg-(--surface) border border-(--border) rounded-xl mb-3"
                  />

                  <div className="max-h-60 overflow-y-auto">
                    {filteredStates.map((state) => (
                      <button
                        key={state}
                        onClick={() => {
                          setLocationPickerState(state);
                          setLocationPickerStep('city');
                          setLocationSearch('');
                        }}
                        className="w-full text-left p-3 border-b border-(--border) text-(--foreground)"
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {locationPickerStep === 'city' && locationPickerState && (
                <>
                  <button
                    onClick={() => {
                      setLocationPickerStep('state');
                      setLocationPickerCity(null);
                      setLocationSearch('');
                    }}
                    className="w-full flex items-center gap-3 p-4 bg-(--surface) border border-(--border) rounded-xl mb-3"
                  >
                    <span className="text-(--foreground) font-medium">← Back to states</span>
                  </button>

                  <p className="text-(--muted) mb-3">{locationPickerState}</p>

                  <input
                    type="text"
                    placeholder="Search city..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="w-full p-3 bg-(--surface) border border-(--border) rounded-xl mb-3"
                  />

                  <div className="max-h-60 overflow-y-auto">
                    {filteredCities.map((city: string) => (
                      <button
                        key={city}
                        onClick={() => handleChooseCityState(locationPickerState, city)}
                        className="w-full text-left p-3 border-b border-(--border) text-(--foreground)"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={() => {
                  setShowLocationModal(false);
                  setLocationPickerStep('main');
                  setLocationPickerState(null);
                  setLocationPickerCity(null);
                  setLocationSearch('');
                }}
                className="w-full p-3 text-(--muted) font-medium mt-4"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Merchant/Service Card Component
function MerchantCard({
  item,
  mode,
  currentUserId,
  onPress
}: {
  item: Merchant | ServiceListing;
  mode: SearchMode;
  currentUserId?: string;
  onPress: (id: string) => void;
}) {
  if (mode === 'stores') {
    const merchant = item as Merchant;
    const isDiamond = merchant.subscription_plan === 'diamond';
    const locationText = merchant.location_city || merchant.location_state || 'Global';

    return (
      <Card
        onClick={() => onPress(merchant.id)}
        className={`p-4 cursor-pointer transition-all hover:scale-[1.02] ${
          isDiamond ? 'border-violet-500/50' : ''
        }`}
      >
        <div className="flex justify-between items-start mb-3">
          {merchant.category && (
            <span className="px-2 py-1 bg-(--surface) text-(--muted) text-xs font-semibold rounded-md uppercase">
              {merchant.category}
            </span>
          )}
          {isDiamond && <Gem size={14} className="text-violet-500" fill="currentColor" />}
        </div>

        <div className="w-12 h-12 bg-(--surface) rounded-xl flex items-center justify-center mb-3 overflow-hidden">
          {merchant.logo_url ? (
            <img
              src={merchant.logo_url}
              alt={merchant.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Store size={20} className="text-(--muted)" />
          )}
        </div>

        <div className="text-center">
          <h3 className="font-semibold text-(--foreground) text-sm mb-1 uppercase">
            {merchant.display_name || merchant.slug || 'Store'}
          </h3>
          <div className="flex items-center justify-center gap-1 text-(--muted) text-xs">
            <MapPin size={10} />
            <span className="uppercase">{locationText}</span>
          </div>
        </div>
      </Card>
    );
  } else {
    const service = item as ServiceListing;
    const seller = Array.isArray(service.seller) ? service.seller[0] : service.seller;
    const sellerId = seller?.id || service.seller_id || service.id;
    const sellerName = seller?.display_name || 'Store';
    const sellerSlug = seller?.slug || 'store';
    const sellerLogo = seller?.logo_url;
    const sellerPlan = seller?.subscription_plan;
    const sellerCity = seller?.location_city;
    const sellerState = seller?.location_state;
    const serviceCategory = String(service.service_category || '').replace(/_/g, ' ');
    const deliveryType = service.delivery_type;
    const distanceKm = service.distance_km;
    const locationText = sellerCity || sellerState || 'Global';
    const metaText =
      deliveryType === 'online'
        ? 'Online'
        : distanceKm != null && Number.isFinite(distanceKm)
        ? `${distanceKm.toFixed(1)} km away`
        : locationText;

    const isDiamond = sellerPlan === 'diamond';

    return (
      <Card
        onClick={() => onPress(sellerId)}
        className={`p-4 cursor-pointer transition-all hover:scale-[1.02] ${
          isDiamond ? 'border-violet-500/50' : ''
        }`}
      >
        <div className="flex justify-between items-start mb-3">
          {serviceCategory && (
            <span className="px-2 py-1 bg-(--surface) text-(--muted) text-xs font-semibold rounded-md uppercase">
              {serviceCategory}
            </span>
          )}
          {isDiamond && <Gem size={14} className="text-violet-500" fill="currentColor" />}
        </div>

        <div className="w-12 h-12 bg-(--surface) rounded-xl flex items-center justify-center mb-3 overflow-hidden">
          {sellerLogo ? (
            <img
              src={sellerLogo}
              alt={sellerName}
              className="w-full h-full object-cover"
            />
          ) : (
            <Store size={20} className="text-(--muted)" />
          )}
        </div>

        <div className="text-center">
          <h3 className="font-semibold text-(--foreground) text-sm mb-1 uppercase">
            {sellerName}
          </h3>
          <p className="text-(--muted) text-xs mb-1">@{sellerSlug}</p>
          <div className="flex items-center justify-center gap-1 text-(--muted) text-xs">
            <MapPin size={10} />
            <span className="uppercase">{metaText}</span>
          </div>
        </div>
      </Card>
    );
  }
}

