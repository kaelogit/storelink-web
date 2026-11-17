'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { formatMessageRequestStats } from '@/lib/messageRequests';
import { Avatar } from '@/components/ui/Avatar';

const AVATAR = 96;

type PartnerSeed = {
  id?: string | null;
  slug?: string | null;
  display_name?: string | null;
  logo_url?: string | null;
  is_seller?: boolean | null;
  follower_count?: number | null;
  following_count?: number | null;
};

type Props = {
  partner: PartnerSeed;
  onViewProfile: () => void;
  /** Mobile default: no View profile pill (avatar + name already open profile). */
  showViewProfile?: boolean;
};

export function MessageRequestHero({ partner, onViewProfile, showViewProfile = false }: Props) {
  const [stats, setStats] = useState<string | null>(
    formatMessageRequestStats(partner.following_count, partner.follower_count),
  );
  const [logo, setLogo] = useState(partner.logo_url || '');
  const [name, setName] = useState(partner.display_name || partner.slug || 'StoreLink');
  const [isSeller, setIsSeller] = useState(!!partner.is_seller);

  useEffect(() => {
    const id = partner.id ? String(partner.id) : '';
    if (!id) return;
    const supabase = createBrowserClient();
    void supabase
      .from('profiles')
      .select('follower_count, following_count, logo_url, display_name, slug, is_seller')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.display_name || data.slug) setName(String(data.display_name || data.slug));
        if (data.logo_url) setLogo(String(data.logo_url));
        setIsSeller(!!data.is_seller);
        setStats(formatMessageRequestStats(data.following_count, data.follower_count));
      });
  }, [partner.id]);

  return (
    <div className="flex flex-col items-center px-6 pb-4 pt-6 text-center">
      <Avatar
        uri={logo}
        size={AVATAR}
        isSeller={isSeller}
        alt={`View ${name}`}
        onClick={onViewProfile}
      />
      <button type="button" onClick={onViewProfile} className="mt-3 text-xl font-black tracking-tight text-(--foreground)">
        {name}
      </button>
      {stats ? <p className="mt-1 text-sm text-(--muted)">{stats}</p> : null}
      {showViewProfile ? (
        <button
          type="button"
          onClick={onViewProfile}
          className="mt-3 rounded-2xl border border-(--border) bg-(--surface) px-5 py-2 text-sm font-semibold text-(--foreground)"
        >
          View profile
        </button>
      ) : null}
    </div>
  );
}
