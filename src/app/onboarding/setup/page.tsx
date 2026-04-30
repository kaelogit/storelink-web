'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { uploadFileToR2 } from '@/lib/mediaUpload';
import { SUPPORTED_COUNTRIES } from '@/constants/SupportedCountries';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { Upload, Store, MapPin, Phone, Globe, Search, Loader2, AlertCircle, Check } from 'lucide-react';

interface StoreSetupData {
  storeName: string;
  storeDescription: string;
  storeCategory: string;
  contactPhone: string;
  contactEmail: string;
  website: string;
  logo: File | null;
  selectedLocation: {
    lat: number;
    lon: number;
    label: string;
    city?: string;
    state?: string;
  } | null;
  isService: boolean;
  isProduct: boolean;
  serviceCategory: string;
  serviceDeliveryType: 'in_person' | 'online' | 'both';
  serviceLocationType: 'at_my_place' | 'i_travel' | 'both';
  serviceAreas: string;
}

const STORE_CATEGORIES = [
  'Fashion & Clothing',
  'Electronics',
  'Home & Garden',
  'Food & Beverage',
  'Health & Beauty',
  'Sports & Fitness',
  'Books & Media',
  'Automotive',
  'Services',
  'Other',
];

const SERVICE_CATEGORIES = [
  { label: 'Nail Tech', slug: 'nail_tech', productCategory: 'Health & Beauty' },
  { label: 'Barber', slug: 'barber', productCategory: 'Health & Beauty' },
  { label: 'Makeup Artist', slug: 'makeup_artist', productCategory: 'Health & Beauty' },
  { label: 'Makeup Artistry', slug: 'makeup_artistry', productCategory: 'Health & Beauty' },
  { label: 'Pedicure/Manicure', slug: 'pedicure_manicure', productCategory: 'Health & Beauty' },
  { label: 'Braids Styling', slug: 'braids_styling', productCategory: 'Health & Beauty' },
  { label: 'Lashes', slug: 'lashes', productCategory: 'Health & Beauty' },
  { label: 'Skincare', slug: 'skincare', productCategory: 'Health & Beauty' },
  { label: 'Photographer', slug: 'photographer', productCategory: 'Electronics' },
  { label: 'Surprise Planners', slug: 'surprise_planners', productCategory: 'Services' },
  { label: 'Event Decorator', slug: 'event_decorator', productCategory: 'Home & Garden' },
  { label: 'Tailoring', slug: 'tailoring', productCategory: 'Fashion & Clothing' },
  { label: 'Alterations', slug: 'alterations', productCategory: 'Fashion & Clothing' },
  { label: 'Custom Outfits', slug: 'custom_outfits', productCategory: 'Fashion & Clothing' },
];

export default function SetupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const [formData, setFormData] = useState<StoreSetupData>({
    storeName: '',
    storeDescription: '',
    storeCategory: '',
    contactPhone: '',
    contactEmail: '',
    website: '',
    logo: null,
    selectedLocation: null,
    isService: false,
    isProduct: false,
    serviceCategory: '',
    serviceDeliveryType: 'in_person',
    serviceLocationType: 'at_my_place',
    serviceAreas: '',
  });

  const [profile, setProfile] = useState<any>(null);

  // Location search state
  const [locationQuery, setLocationQuery] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationHits, setLocationHits] = useState<any[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const skipAutoSearchRef = useRef(false);

  // Location search logic
  const handleLocationSearch = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setLocationHits([]);
      setLocationError(null);
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q }),
      });

      const data = await response.json();

      if (!response.ok || !data.results || data.results.length === 0) {
        setLocationError(data.error || 'No addresses found. Try searching with a street name or area.');
        setLocationHits([]);
      } else {
        setLocationHits(data.results);
      }
    } catch (err) {
      setLocationError('Search failed. Please check your connection.');
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (skipAutoSearchRef.current) {
        skipAutoSearchRef.current = false;
        return;
      }

      if (locationQuery.trim().length >= 3) {
        handleLocationSearch(locationQuery);
      } else {
        setLocationHits([]);
        setLocationError(null);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [locationQuery, handleLocationSearch]);

  const handleSelectLocation = (hit: any) => {
    const city = hit.address.city || hit.address.town || hit.address.village || hit.address.hamlet;
    const state = hit.address.state;

    skipAutoSearchRef.current = true;
    setFormData(prev => ({
      ...prev,
      selectedLocation: {
        lat: parseFloat(hit.lat),
        lon: parseFloat(hit.lon),
        label: hit.display_name,
        city,
        state
      }
    }));
    setLocationQuery(hit.display_name);
    setLocationHits([]);
  };

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createBrowserClient();
      const { data: session } = await supabase.auth.getSession();
      if (session.session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.session.user.id)
          .single();
        setProfile(profileData);
      }
    };
    fetchProfile();
  }, []);

  const phonePrefix = profile?.location_country_code ? 
    (SUPPORTED_COUNTRIES.find(c => c.code === profile.location_country_code)?.phonePrefix ?? '+234') : 
    '+234';

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Logo file size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      setFormData(prev => ({ ...prev, logo: file }));
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug) return;
    setSlugStatus('checking');
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('stores')
        .select('slug')
        .eq('slug', slug)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows returned, slug is available
        setSlugStatus('available');
      } else if (data) {
        setSlugStatus('taken');
      } else {
        setSlugStatus('available');
      }
    } catch (err) {
      setSlugStatus('taken'); // Assume taken on error
    }
  };

  // Auto-generate slug when store name changes
  useEffect(() => {
    if (formData.storeName.length > 2) {
      const generatedSlug = generateSlug(formData.storeName);
      const delay = window.setTimeout(() => {
        checkSlugAvailability(generatedSlug);
      }, 500);
      return () => window.clearTimeout(delay);
    }
    setSlugStatus('idle');
  }, [formData.storeName]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.storeName.trim()) {
      setError('Store name is required');
      return;
    }
    if (!formData.storeDescription.trim()) {
      setError('Store description is required');
      return;
    }
    if (slugStatus !== 'available') {
      setError('Please choose a store name that generates an available URL slug');
      return;
    }
    if (!formData.contactPhone.trim()) {
      setError('Contact phone is required');
      return;
    }
    if (formData.contactPhone.length < 7) {
      setError('Please enter a valid phone number');
      return;
    }
    if (!formData.contactEmail.trim()) {
      setError('Contact email is required');
      return;
    }
    if (!formData.selectedLocation) {
      setError('Store location is required');
      return;
    }
    if (!formData.isService && !formData.isProduct) {
      setError('Please select at least one: Services or Products');
      return;
    }
    if (formData.isService && !formData.serviceCategory) {
      setError('Please select a service category');
      return;
    }
    if (formData.isService && !formData.serviceDeliveryType) {
      setError('Please select how you deliver services');
      return;
    }
    if (formData.isService && (formData.serviceDeliveryType === 'in_person' || formData.serviceDeliveryType === 'both') && !formData.serviceLocationType) {
      setError('Please select your service location type');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        router.push('/auth/signup');
        return;
      }

      let logoUrl = null;
      if (formData.logo) {
        const fileExt = formData.logo.name.split('.').pop() ?? 'png';
        const fileName = `${session.session.user.id}_${Date.now()}.${fileExt}`;
        logoUrl = await uploadFileToR2(formData.logo, `store-logos/${fileName}`);
      }

      const storeSlug = generateSlug(formData.storeName);

      // Determine final category (use service category mapping if service)
      let finalCategory = formData.storeCategory;
      if (formData.isService && formData.serviceCategory) {
        const serviceCat = SERVICE_CATEGORIES.find(cat => cat.slug === formData.serviceCategory);
        if (serviceCat) {
          finalCategory = serviceCat.productCategory;
        }
      }

      // Parse service areas
      const serviceAreas = formData.serviceAreas
        .split(',')
        .map(area => area.trim())
        .filter(Boolean);

      const { error: storeError } = await supabase
        .from('stores')
        .insert({
          owner_id: session.session.user.id,
          name: formData.storeName.trim(),
          slug: storeSlug,
          description: formData.storeDescription.trim(),
          category: finalCategory,
          contact_phone: phonePrefix + formData.contactPhone.trim(),
          contact_email: formData.contactEmail.trim(),
          website: formData.website.trim() || null,
          address: formData.selectedLocation.label,
          city: formData.selectedLocation.city || null,
          state: formData.selectedLocation.state || null,
          logo_url: logoUrl,
          is_service: formData.isService,
          is_product: formData.isProduct,
          service_category: formData.isService ? formData.serviceCategory : null,
          service_delivery_type: formData.isService ? formData.serviceDeliveryType : null,
          service_location_type: formData.isService && (formData.serviceDeliveryType === 'in_person' || formData.serviceDeliveryType === 'both') ? formData.serviceLocationType : null,
          service_areas: formData.isService && serviceAreas.length ? serviceAreas : null,
          is_active: true,
        });

      if (storeError) throw storeError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          onboarding_step: 'pick-categories',
          service_latitude: formData.selectedLocation.lat,
          service_longitude: formData.selectedLocation.lon,
          location: formData.selectedLocation.label,
          location_city: formData.selectedLocation.city,
          location_state: formData.selectedLocation.state,
        })
        .eq('id', session.session.user.id);

      if (profileError) throw profileError;

      router.push('/onboarding/pick-categories');
    } catch (err: any) {
      setError(err?.message || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <Store size={16} className="text-emerald-600" />
          <span className="text-xs font-black uppercase tracking-wider text-emerald-600">STORE SETUP</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Let's set up your <span className="italic text-emerald-600">store</span>
        </h1>
        <p className="text-base sm:text-lg text-(--muted)">Tell us about your business so customers can find you.</p>
      </div>

      {/* Logo Upload */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="font-black text-lg flex items-center gap-2">
            <Upload size={20} />
            Store Logo
          </h3>
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 border-2 border-dashed border-(--border) rounded-lg flex items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Upload size={24} className="text-(--muted)" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-(--muted)">
                Upload a logo for your store. Recommended: Square image, at least 200x200px, max 5MB.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Store Details */}
      <Card className="p-6 space-y-6">
        <h3 className="font-black text-lg">Store Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input
              label="Store Name"
              value={formData.storeName}
              onChange={(value) => setFormData(prev => ({ ...prev, storeName: value }))}
              placeholder="Enter your store name"
              required
            />
            {formData.storeName.length > 2 && (
              <div className="text-xs">
                <span className="text-(--muted)">URL: storelink.com/</span>
                <span className={`font-mono ${
                  slugStatus === 'available' ? 'text-emerald-600' :
                  slugStatus === 'taken' ? 'text-red-600' :
                  slugStatus === 'checking' ? 'text-yellow-600' : 'text-(--muted)'
                }`}>
                  {generateSlug(formData.storeName)}
                </span>
                {slugStatus === 'checking' && <span className="text-yellow-600 ml-1">checking...</span>}
                {slugStatus === 'available' && <span className="text-emerald-600 ml-1">✓ available</span>}
                {slugStatus === 'taken' && <span className="text-red-600 ml-1">✗ taken</span>}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black">Store Category</label>
            <select
              value={formData.storeCategory}
              onChange={(e) => setFormData(prev => ({ ...prev, storeCategory: e.target.value }))}
              className="w-full px-3 py-2 border border-(--border) rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">Select a category</option>
              {STORE_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <Textarea
          label="Store Description"
          value={formData.storeDescription}
          onChange={(value) => setFormData(prev => ({ ...prev, storeDescription: value }))}
          placeholder="Describe your store and what you offer..."
          rows={3}
          required
        />

        {/* Business Type */}
        <div className="space-y-3">
          <label className="text-sm font-black">What do you offer?</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isService}
                onChange={(e) => setFormData(prev => ({ ...prev, isService: e.target.checked }))}
                className="w-4 h-4 text-emerald-600 border-(--border) rounded focus:ring-emerald-500"
              />
              <span className="text-sm">Services</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isProduct}
                onChange={(e) => setFormData(prev => ({ ...prev, isProduct: e.target.checked }))}
                className="w-4 h-4 text-emerald-600 border-(--border) rounded focus:ring-emerald-500"
              />
              <span className="text-sm">Products</span>
            </label>
          </div>
        </div>

        {/* Service Details */}
        {formData.isService && (
          <div className="space-y-4 border-t border-(--border) pt-4">
            <h4 className="font-black text-md">Service Details</h4>
            
            <div className="space-y-2">
              <label className="text-sm font-black">Service Category</label>
              <select
                value={formData.serviceCategory}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceCategory: e.target.value }))}
                className="w-full px-3 py-2 border border-(--border) rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select a service category</option>
                {SERVICE_CATEGORIES.map((category) => (
                  <option key={category.slug} value={category.slug}>{category.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black">How do you deliver services?</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="serviceDeliveryType"
                    value="in_person"
                    checked={formData.serviceDeliveryType === 'in_person'}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceDeliveryType: e.target.value as 'in_person' | 'online' | 'both' }))}
                    className="w-4 h-4 text-emerald-600 border-(--border) focus:ring-emerald-500"
                  />
                  <span className="text-sm">In person</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="serviceDeliveryType"
                    value="online"
                    checked={formData.serviceDeliveryType === 'online'}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceDeliveryType: e.target.value as 'in_person' | 'online' | 'both' }))}
                    className="w-4 h-4 text-emerald-600 border-(--border) focus:ring-emerald-500"
                  />
                  <span className="text-sm">Online</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="serviceDeliveryType"
                    value="both"
                    checked={formData.serviceDeliveryType === 'both'}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceDeliveryType: e.target.value as 'in_person' | 'online' | 'both' }))}
                    className="w-4 h-4 text-emerald-600 border-(--border) focus:ring-emerald-500"
                  />
                  <span className="text-sm">Both</span>
                </label>
              </div>
            </div>

            {(formData.serviceDeliveryType === 'in_person' || formData.serviceDeliveryType === 'both') && (
              <div className="space-y-2">
                <label className="text-sm font-black">Service Location</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="serviceLocationType"
                      value="at_my_place"
                      checked={formData.serviceLocationType === 'at_my_place'}
                      onChange={(e) => setFormData(prev => ({ ...prev, serviceLocationType: e.target.value as 'at_my_place' | 'i_travel' | 'both' }))}
                      className="w-4 h-4 text-emerald-600 border-(--border) focus:ring-emerald-500"
                    />
                    <span className="text-sm">At my place</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="serviceLocationType"
                      value="i_travel"
                      checked={formData.serviceLocationType === 'i_travel'}
                      onChange={(e) => setFormData(prev => ({ ...prev, serviceLocationType: e.target.value as 'at_my_place' | 'i_travel' | 'both' }))}
                      className="w-4 h-4 text-emerald-600 border-(--border) focus:ring-emerald-500"
                    />
                    <span className="text-sm">I travel to clients</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="serviceLocationType"
                      value="both"
                      checked={formData.serviceLocationType === 'both'}
                      onChange={(e) => setFormData(prev => ({ ...prev, serviceLocationType: e.target.value as 'at_my_place' | 'i_travel' | 'both' }))}
                      className="w-4 h-4 text-emerald-600 border-(--border) focus:ring-emerald-500"
                    />
                    <span className="text-sm">Both</span>
                  </label>
                </div>
              </div>
            )}

            <Input
              label="Service Areas (Optional)"
              value={formData.serviceAreas}
              onChange={(value) => setFormData(prev => ({ ...prev, serviceAreas: value }))}
              placeholder="e.g. Lagos, Abuja, Port Harcourt (comma separated)"
            />
          </div>
        )}
      </Card>

      {/* Contact Information */}
      <Card className="p-6 space-y-6">
        <h3 className="font-black text-lg flex items-center gap-2">
          <Phone size={20} />
          Contact Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-black">Phone Number</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 py-2 border border-r-0 border-(--border) rounded-l-lg bg-(--muted)/50 text-sm">
                {phonePrefix}
              </span>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value.replace(/\D/g, '') }))}
                placeholder="xxx xxx xxxx"
                className="flex-1 px-3 py-2 border border-(--border) rounded-r-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <Input
            label="Email Address"
            type="email"
            value={formData.contactEmail}
            onChange={(value) => setFormData(prev => ({ ...prev, contactEmail: value }))}
            placeholder="contact@yourstore.com"
            required
          />
        </div>

        <Input
          label="Website (Optional)"
          value={formData.website}
          onChange={(value) => setFormData(prev => ({ ...prev, website: value }))}
          placeholder="https://yourstore.com"
        />
      </Card>

      {/* Store Location */}
      <Card className="p-6 space-y-6">
        <h3 className="font-black text-lg flex items-center gap-2">
          <MapPin size={20} />
          Store Location
        </h3>

        <div className="space-y-4">
          <div className="relative">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-(--muted)" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Search for your store address..."
                className="w-full pl-10 pr-4 py-3 border border-(--border) rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {locationLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 size={18} className="animate-spin text-(--muted)" />
                </div>
              )}
            </div>

            {locationHits.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-(--border) rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {locationHits.map((hit, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectLocation(hit)}
                    className="w-full px-4 py-3 text-left hover:bg-(--surface) border-b border-(--border) last:border-b-0 flex items-start gap-3"
                  >
                    <MapPin size={16} className="text-(--muted) mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{hit.display_name}</div>
                      <div className="text-xs text-(--muted) truncate">
                        {hit.address.city || hit.address.town || hit.address.village || hit.address.hamlet}, {hit.address.state}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {locationError && (
              <div className="mt-2 text-sm text-red-500 flex items-center gap-2">
                <AlertCircle size={14} />
                {locationError}
              </div>
            )}
          </div>

          {formData.selectedLocation && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-700">
                <Check size={16} />
                <span className="font-medium">Selected Location</span>
              </div>
              <div className="mt-1 text-sm text-emerald-600">
                {formData.selectedLocation.label}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Error */}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {/* Button */}
      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Creating Store...' : 'Create My Store'}
      </Button>
    </div>
  );
}