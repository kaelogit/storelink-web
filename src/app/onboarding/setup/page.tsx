'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { getGeographyForCountry } from '@/lib/geographyResolver';
import { uploadFileToR2 } from '@/lib/mediaUpload';
import { SUPPORTED_COUNTRIES } from '@/constants/SupportedCountries';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { Upload, Store, MapPin, Phone, Globe } from 'lucide-react';

interface StoreSetupData {
  storeName: string;
  storeDescription: string;
  storeCategory: string;
  contactPhone: string;
  contactEmail: string;
  website: string;
  address: string;
  city: string;
  state: string;
  logo: File | null;
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
    address: '',
    city: '',
    state: '',
    logo: null,
    isService: false,
    isProduct: false,
    serviceCategory: '',
    serviceDeliveryType: 'in_person',
    serviceLocationType: 'at_my_place',
    serviceAreas: '',
  });

  const [profile, setProfile] = useState<any>(null);

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

  const geography = getGeographyForCountry(profile?.location_country_code);
  const stateOptions = geography ? Object.keys(geography.data) : [];
  const cityOptions = geography && formData.state ? geography.data[formData.state] ?? [] : [];

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
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
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

      {/* Location */}
      <Card className="p-6 space-y-6">
        <h3 className="font-black text-lg flex items-center gap-2">
          <MapPin size={20} />
          Store Location
        </h3>

        <Textarea
          label="Street Address"
          value={formData.address}
          onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
          placeholder="Enter your store address"
          rows={2}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-black">State</label>
            <select
              value={formData.state}
              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value, city: '' }))}
              className="w-full px-3 py-2 border border-(--border) rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">Select a state</option>
              {stateOptions.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black">City</label>
            <select
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              className="w-full px-3 py-2 border border-(--border) rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={!formData.state}
              required
            >
              <option value="">Select a city</option>
              {cityOptions.map((town) => (
                <option key={town} value={town}>{town}</option>
              ))}
            </select>
          </div>
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