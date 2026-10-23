'use client';

import { useEffect, useState } from 'react';
import { Store, User } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { formatMessageRequestStats } from '@/lib/messageRequests';
import { normalizeWebMediaUrl } from '@/lib/media-url';

const AVATAR = 96;
const RADIUS = Math.round(AVATAR * 0.3);

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
  showViewProfile?: boolean;
};

export function MessageRequestHero({ partner, onViewProfile, showViewProfile = true }: Props) {
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

  const src = normalizeWebMediaUrl(logo || '');

  return (
    <div className="flex flex-col items-center px-6 pb-4 pt-6 text-center">
      <button
        type="button"
        onClick={onViewProfile}
        className="overflow-hidden bg-(--muted)/20"
        style={{ width: AVATAR, height: AVATAR, borderRadius: RADIUS }}
        aria-label={`View ${name}`}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-(--muted)">
            {isSeller ? <Store size={40} strokeWidth={1.75} /> : <User size={40} strokeWidth={1.75} />}
          </div>
        )}
      </button>
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
