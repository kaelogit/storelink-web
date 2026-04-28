'use client';

import { useEffect, useMemo, useState } from 'react';
import { Menu } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import ProfileHubMenuContent, { type ProfileHubMenuProfile } from '@/components/profile-web/ProfileHubMenuContent';
import ProfileHubMenuFooter from '@/components/profile-web/ProfileHubMenuFooter';

export default function MoreMenu() {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [hubProfile, setHubProfile] = useState<ProfileHubMenuProfile | null>(null);
  const supabase = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user || !active) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, is_seller, seller_type')
        .eq('id', user.id)
        .maybeSingle();
      if (!active) return;
      if (profile?.id) {
        setHubProfile({
          id: String(profile.id),
          is_seller: profile.is_seller,
          seller_type: profile.seller_type,
        });
      } else {
        setHubProfile(null);
      }
    });
    return () => {
      active = false;
    };
  }, [supabase]);

  const onLogout = async () => {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      window.location.href = '/auth/login';
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex w-full items-center justify-center gap-3 rounded-2xl px-3 py-2 group-hover:justify-start text-slate-700 hover:text-emerald-600 hover:bg-(--surface) dark:text-slate-200"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--border) bg-(--surface)">
          <Menu size={24} />
        </div>
        <span className="hidden whitespace-nowrap text-base font-bold text-(--foreground) group-hover:inline">More</span>
      </button>
      {open ? (
        <div className="absolute bottom-0 left-full z-50 ml-2 max-h-[min(80vh,820px)] w-80 overflow-y-auto rounded-3xl border border-(--border) bg-(--card) p-3 shadow-2xl">
          <ProfileHubMenuContent
            supabase={supabase}
            profile={hubProfile}
            active={open}
            variant="plain"
            onNavigate={() => setOpen(false)}
            footerInsideScroll={<ProfileHubMenuFooter onLogout={onLogout} loggingOut={loggingOut} />}
          />
        </div>
      ) : null}
    </div>
  );
}
