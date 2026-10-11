'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import ProfileFieldEditor from '../../ProfileFieldEditor';
import { getPhonePrefixForCountry } from '@/constants/SupportedCountries';
import { phoneVerifyHref, toPhoneE164 } from '@/lib/phoneOtp';

function phoneSuffix(phone: string | null | undefined, prefix: string) {
  const raw = (phone || '').replace(/\s/g, '');
  return raw.startsWith(prefix) ? raw.slice(prefix.length).replace(/\D/g, '') : raw.replace(/\D/g, '');
}

export default function EditPhoneClient() {
  const router = useRouter();
  const [initial, setInitial] = useState<string | null>(null);
  const [prefix, setPrefix] = useState('+234');
  const [verified, setVerified] = useState(false);
  const [savedPhone, setSavedPhone] = useState('');

  useEffect(() => {
    const supabase = createBrowserClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setInitial('');
        return;
      }
      const { data } = await supabase.rpc('get_my_profile');
      const nextPrefix = getPhonePrefixForCountry(data?.location_country_code);
      setPrefix(nextPrefix);
      setVerified(data?.phone_verified === true);
      setSavedPhone(String(data?.phone_number || ''));
      setInitial(phoneSuffix(data?.phone_number, nextPrefix));
    })();
  }, []);

  if (initial === null) {
    return <ProfileFieldEditor title="Phone" initialValue="" onSave={async () => {}} />;
  }

  return (
    <ProfileFieldEditor
      title="Phone"
      description={`${prefix} — used for order updates. Checkout needs a verified number.`}
      initialValue={initial}
      onSave={async (value) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length < 10) throw new Error('Enter a valid mobile number.');
        const phoneE164 = toPhoneE164(prefix, digits);
        const unchanged = verified && savedPhone.replace(/\D/g, '') === phoneE164.replace(/\D/g, '');
        if (unchanged) return;
        router.replace(phoneVerifyHref({ phone: phoneE164, returnTo: '/app/settings/account' }));
      }}
    />
  );
}
