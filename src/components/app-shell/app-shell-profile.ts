'use client';

import { usePathname } from 'next/navigation';
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { canSellAndAppearInFeeds, showDiamondBadge } from '@/lib/sellerStatus';

type AppShellProfileValue = {
  isSeller: boolean;
  unreadNotifications: number;
  slug: string | null;
  isDiamond: boolean;
  /** Seller with store not fully active for feeds (matches profile “OFFLINE” pill). */
  showOfflineBadge: boolean;
};

const AppShellProfileContext = createContext<AppShellProfileValue | null>(null);

/**
 * Wraps authenticated app shell so TopBar + RightRail share one profile poll (no duplicate Supabase reads).
 */
export function AppShellProfileProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSeller, setIsSeller] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [slug, setSlug] = useState<string | null>(null);
  const [isDiamond, setIsDiamond] = useState(false);
  const [showOfflineBadge, setShowOfflineBadge] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = createBrowserClient();
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!mounted) return;
      if (!userId) {
        setIsSeller(false);
        setUnreadNotifications(0);
        setSlug(null);
        setIsDiamond(false);
        setShowOfflineBadge(false);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select(
          'is_seller, unread_notifications_count, slug, subscription_plan, subscription_status, subscription_expiry',
        )
        .eq('id', userId)
        .maybeSingle();
      if (!mounted) return;
      setIsSeller(Boolean(profile?.is_seller));
      setUnreadNotifications(Number(profile?.unread_notifications_count || 0));
      setSlug(profile?.slug != null && String(profile.slug).trim() ? String(profile.slug).trim() : null);
      setIsDiamond(showDiamondBadge(profile));
      setShowOfflineBadge(Boolean(profile?.is_seller) && !canSellAndAppearInFeeds(profile));
    };
    void load();

    let delayed: ReturnType<typeof setTimeout> | undefined;
    if (pathname?.startsWith('/app/activity')) {
      delayed = setTimeout(() => {
        void load();
      }, 450);
    }

    return () => {
      mounted = false;
      if (delayed) clearTimeout(delayed);
    };
  }, [pathname]);

  const value = useMemo(
    () => ({ isSeller, unreadNotifications, slug, isDiamond, showOfflineBadge }),
    [isSeller, unreadNotifications, slug, isDiamond, showOfflineBadge],
  );

  return createElement(AppShellProfileContext.Provider, { value }, children);
}

export function useAppShellProfile(): AppShellProfileValue {
  const ctx = useContext(AppShellProfileContext);
  if (!ctx) {
    throw new Error('useAppShellProfile must be used within AppShellProfileProvider');
  }
  return ctx;
}
