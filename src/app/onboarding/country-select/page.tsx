'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { SUPPORTED_COUNTRIES, type SupportedCountry } from '@/constants/SupportedCountries';

export default function CountrySelectPage() {
  const router = useRouter();
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExistingCountry = async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase.auth.getSession();

      const userId = data.session?.user?.id;
      if (!userId) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('location_country_code')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.location_country_code) {
        setSelectedCountryCode(profile.location_country_code);
      }
    };

    loadExistingCountry();
  }, []);

  const selectedCountry = SUPPORTED_COUNTRIES.find(
    (country) => country.code === selectedCountryCode,
  ) ?? null;

  const handleSelectCountry = (country: SupportedCountry) => {
    if (!country.available) return;
    setError(null);
    setSelectedCountryCode(country.code);
  };

  const handleContinue = async () => {
    if (!selectedCountry) {
      setError('Please choose a country to continue.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;

      if (!userId) {
        router.push('/auth/signup');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          location_country: selectedCountry.name,
          location_country_code: selectedCountry.code,
          currency_code: selectedCountry.currency,
          onboarding_step: 'role-setup',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      router.push('/onboarding/role-setup');
    } catch (err: any) {
      setError(err?.message || 'Unable to save your country. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-600">Choose location</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
          WHERE ARE{' '}
          <span className="italic text-emerald-600">YOU BASED?</span>
        </h1>
        <p className="text-base sm:text-lg text-(--muted)">This customizes your store and currency.</p>
      </div>

      <div className="space-y-4">
        {SUPPORTED_COUNTRIES.map((country) => {
          const isActive = selectedCountryCode === country.code;
          const isDisabled = !country.available;

          return (
            <Card
              key={country.code}
              onClick={() => handleSelectCountry(country)}
              className={`p-6 cursor-pointer transition-all border-2 ${
                isActive
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : 'border-transparent hover:border-(--border)'
              } ${isDisabled ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl ${
                    isActive ? 'bg-emerald-500 text-white' : 'bg-(--surface) text-emerald-600'
                  }`}
                >
                  {country.flag}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-lg font-black">{country.name}</p>
                  <p className="text-sm text-(--muted)">
                    {country.currency}
                    {isDisabled ? ' • Coming soon' : ''}
                  </p>
                </div>
                {isActive && !isDisabled ? (
                  <div className="w-6 h-6 rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                ) : null}
                {isDisabled ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold text-(--muted) bg-(--surface)">
                    Coming soon
                  </span>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <Button
        onClick={handleContinue}
        disabled={loading || !selectedCountry}
        className="w-full inline-flex items-center justify-center gap-2"
      >
        {loading ? 'Saving...' : 'Continue'}
        <ArrowRight size={18} />
      </Button>
    </div>
  );
}
