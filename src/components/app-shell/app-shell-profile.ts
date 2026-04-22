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

type AppShellProfileValue = {
  isSeller: boolean;
  unreadNotifications: number;
};

const AppShellProfileContext = createContext<AppShellProfileValue | null>(null);

/**
 * Wraps authenticated app shell so TopBar + RightRail share one profile poll (no duplicate Supabase reads).
 */
export function AppShellProfileProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSeller, setIsSeller] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    let mounted = true;
    const supabase = createBrowserClient();
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!mounted) return;
      if (!userId) {
        setIsSeller(false);
        setUnreadNotifications(0);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_seller, unread_notifications_count')
        .eq('id', userId)
        .maybeSingle();
      if (!mounted) return;
      setIsSeller(Boolean(profile?.is_seller));
      setUnreadNotifications(Number(profile?.unread_notifications_count || 0));
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
    () => ({ isSeller, unreadNotifications }),
    [isSeller, unreadNotifications],
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
