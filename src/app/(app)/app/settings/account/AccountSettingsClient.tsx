'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import SettingsFrame, { useSettingsDrawer } from '../SettingsFrame';
import { SettingsNavRow } from '../SettingsNavRow';
import {
  businessVerificationHref,
  businessVerificationStatusLabel,
  isNigeriaSeller,
} from '@/lib/profileBadges';
import { maskEmail, maskPhone } from '@/lib/accountHubMasks';
import { formatDobDisplay } from '@/lib/dateOfBirth';

type ProfileRow = {
  id: string;
  is_seller?: boolean | null;
  full_name?: string | null;
  display_name?: string | null;
  slug?: string | null;
  bio?: string | null;
  email?: string | null;
  phone_number?: string | null;
  phone_verified?: boolean | null;
  is_verified?: boolean | null;
  date_of_birth?: string | null;
  location_city?: string | null;
  location_state?: string | null;
  location_country_code?: string | null;
  business_verification_status?: string | null;
};

export default function AccountSettingsClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const { wrap } = useSettingsDrawer();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.rpc('get_my_profile');
    setProfile((data as ProfileRow) || null);
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await load();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  if (loading) {
    return (
      <SettingsFrame title="Account" subtitle="Credentials, profile fields, and seller tools." parentHref="/app/settings">
        <p className="text-sm text-(--muted)">Loading account settings…</p>
      </SettingsFrame>
    );
  }

  if (!profile?.id) {
    return (
      <SettingsFrame title="Account" parentHref="/app/settings">
        <p className="text-sm text-(--muted)">Sign in to manage account settings.</p>
      </SettingsFrame>
    );
  }

  const name = profile.full_name || profile.display_name || 'Add';
  const phoneValue = profile.phone_number
    ? profile.phone_verified
      ? maskPhone(profile.phone_number)
      : 'Verify'
    : 'Add';
  const emailValue = profile.email
    ? profile.is_verified
      ? maskEmail(profile.email)
      : 'Verify'
    : 'Add';
  const dob = formatDobDisplay(profile.date_of_birth) || 'Add';

  return (
    <SettingsFrame title="Account" subtitle="Account information, password, and selling upgrades." parentHref="/app/settings">
      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Profile</p>
      <div className="mb-5 divide-y divide-(--border) overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
        <SettingsNavRow href="/app/settings/account/edit-name" label="Name" value={name} />
        <SettingsNavRow href="/app/settings/account/edit-username" label="Username" value={profile.slug ? `@${profile.slug}` : 'Add'} />
        <SettingsNavRow href="/app/settings/account/edit-bio" label="Bio" value={profile.bio?.trim() ? 'Edit' : 'Add'} />
        <SettingsNavRow href="/app/settings/account/edit-birthday" label="Birthday" value={dob} />
      </div>

      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Account information</p>
      <div className="mb-5 divide-y divide-(--border) overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
        <SettingsNavRow href="/app/settings/account/edit-phone" label="Phone" value={phoneValue} />
        <SettingsNavRow href="/app/settings/account/edit-email" label="Email" value={emailValue} />
        <SettingsNavRow href="/auth/forgot-password" label="Password" />
        <SettingsNavRow href="/app/settings/delete-account" label="Deactivate or delete account" danger />
      </div>

      {profile.is_seller ? (
        <>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-(--muted)">Seller tools</p>
          <div className="flex flex-wrap gap-2">
            <Link href={wrap('/app/seller/verification-consent')} className="rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-semibold text-(--foreground)">
              Identity verification
            </Link>
            {isNigeriaSeller(profile) ? (
              <Link href={wrap(businessVerificationHref(profile))} className="rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-semibold text-(--foreground)">
                Business verification · {businessVerificationStatusLabel(profile.business_verification_status)}
              </Link>
            ) : null}
            <Link href={wrap('/app/settings/bank')} className="rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-semibold text-(--foreground)">
              Payout & bank
            </Link>
            <Link href={wrap('/app/subscription')} className="rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-semibold text-(--foreground)">
              Membership
            </Link>
          </div>
        </>
      ) : (
        <section className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-(--foreground)">Want to start selling?</p>
          <p className="mt-1 text-sm text-(--muted)">Open your shop from the seller setup flow. Standard seller usage is free.</p>
          <Link href={wrap('/app/seller/what-is-selling')} className="mt-3 inline-flex rounded-xl bg-(--foreground) px-3 py-2 text-sm font-black uppercase tracking-wide text-(--background)">
            Start seller setup
          </Link>
        </section>
      )}
    </SettingsFrame>
  );
}
