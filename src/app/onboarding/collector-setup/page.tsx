'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { getGeographyForCountry } from '@/lib/geographyResolver';
import { SUPPORTED_COUNTRIES } from '@/constants/SupportedCountries';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { User, AtSign, Phone, MapPin } from 'lucide-react';

export default function CollectorSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [city, setCity] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
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
  const cityOptions = geography && selectedState ? geography.data[selectedState] ?? [] : [];

  const phonePrefix = profile?.location_country_code ? 
    (SUPPORTED_COUNTRIES.find(c => c.code === profile.location_country_code)?.phonePrefix ?? '+234') : 
    '+234';

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationCoords({ latitude, longitude });
        setDetectingLocation(false);
      },
      (err) => {
        alert(`Location access denied: ${err.message}`);
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    gender: '' as 'male' | 'female' | 'other' | '',
  });

  // Debounced username check
  useEffect(() => {
    if (!formData.username.trim()) {
      setUsernameAvailable(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const supabase = createBrowserClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('slug')
          .eq('slug', formData.username.toLowerCase().trim())
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }

        setUsernameAvailable(!data);
      } catch (err) {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return;
    }
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }
    if (usernameAvailable === false) {
      setError('Username is already taken');
      return;
    }
    if (usernameAvailable === null) {
      setError('Please wait while we check username availability');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (formData.phone.length < 7) {
      setError('Please enter a valid phone number');
      return;
    }
    if (!formData.gender) {
      setError('Please select your gender');
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

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          slug: formData.username.toLowerCase().trim(),
          phone_number: phonePrefix + formData.phone.trim(),
          gender: formData.gender,
          discovery_latitude: locationCoords?.latitude || null,
          discovery_longitude: locationCoords?.longitude || null,
          discovery_city: city || null,
          discovery_state: selectedState || null,
          onboarding_step: 'pick-categories',
        })
        .eq('id', session.session.user.id);

      if (updateError) throw updateError;

      router.push('/onboarding/pick-categories');
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <User size={16} className="text-emerald-600" />
          <span className="text-xs font-black uppercase tracking-wider text-emerald-600">PROFILE SETUP</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Tell us about <span className="italic text-emerald-600">yourself</span>
        </h1>
        <p className="text-base sm:text-lg text-(--muted)">Create your shopper profile to get started.</p>
      </div>

      {/* Profile Form */}
      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(value) => setFormData(prev => ({ ...prev, firstName: value }))}
            placeholder="Enter your first name"
            required
          />

          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(value) => setFormData(prev => ({ ...prev, lastName: value }))}
            placeholder="Enter your last name"
            required
          />
        </div>

        {/* Username */}
        <div className="space-y-2">
          <label className="text-sm font-black flex items-center gap-2">
            <AtSign size={16} />
            Username
          </label>
          <div className="relative">
            <Input
              value={formData.username}
              onChange={(value) => setFormData(prev => ({ ...prev, username: value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
              placeholder="choose_a_username"
              required
            />
            {formData.username && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checkingUsername ? (
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                ) : usernameAvailable === true ? (
                  <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                ) : usernameAvailable === false ? (
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full" />
                  </div>
                ) : null}
              </div>
            )}
          </div>
          {formData.username && !checkingUsername && (
            <p className={`text-xs ${usernameAvailable ? 'text-emerald-600' : 'text-red-600'}`}>
              {usernameAvailable ? '✓ Username available' : '✗ Username taken'}
            </p>
          )}
        </div>

        {/* Gender */}
        <div className="space-y-3">
          <label className="text-sm font-black">Gender</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFormData(prev => ({ ...prev, gender: option.value as any }))}
                className={`p-3 border-2 rounded-lg text-center transition-all ${
                  formData.gender === option.value
                    ? 'border-emerald-500 bg-emerald-500/5 text-emerald-700'
                    : 'border-(--border) hover:border-emerald-500'
                }`}
              >
                <span className="text-sm font-black">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="text-sm font-black flex items-center gap-2">
            <Phone size={16} />
            Phone Number
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 py-2 border border-r-0 border-(--border) rounded-l-lg bg-(--muted)/50 text-sm">
              {phonePrefix}
            </span>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
              placeholder="xxx xxx xxxx"
              className="flex-1 px-3 py-2 border border-(--border) rounded-r-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-3">
          <label className="text-sm font-black flex items-center gap-2">
            <MapPin size={16} />
            Location (Optional)
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-black">State</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setCity('');
                }}
                className="w-full px-3 py-2 border border-(--border) rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-(--border) rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={!selectedState}
              >
                <option value="">Select a city</option>
                {cityOptions.map((town) => (
                  <option key={town} value={town}>{town}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={detectLocation}
              disabled={detectingLocation}
              variant="outline"
              className="w-full"
            >
              {detectingLocation ? 'Detecting...' : 'Capture coordinates'}
            </Button>
            {locationCoords ? (
              <p className="text-sm text-(--muted)">Coordinates captured</p>
            ) : (
              <p className="text-sm text-(--muted)">Optional: capture coordinates for better discovery.</p>
            )}
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {/* Button */}
      <Button
        onClick={handleSubmit}
        disabled={loading || usernameAvailable === false || checkingUsername}
        className="w-full"
      >
        {loading ? 'Saving Profile...' : 'Continue'}
      </Button>
    </div>
  );
}