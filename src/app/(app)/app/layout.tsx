import { redirect } from 'next/navigation';
import WebAuthGate from '@/components/auth/WebAuthGate';
import { AppToaster } from '@/components/providers/AppToaster';
import AppTopBar from '@/components/app-shell/AppTopBar';
import LeftRail from '@/components/app-shell/LeftRail';
import RightRail from '@/components/app-shell/RightRail';
import MobileBottomTabs from '@/components/app-shell/MobileBottomTabs';
import WebFloatingCart from '@/components/cart/WebFloatingCart';
import { AppShellProfileProvider } from '@/components/app-shell/app-shell-profile';
import { createServerClient } from '@/lib/supabase-server';
import type { ReactNode } from 'react';

export default async function AppLayerLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  const initialState = data?.user?.id ? 'authed' : 'guest';

  if (data?.user?.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_verified,onboarding_completed')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile && !profile.is_verified) {
      const email = data.user.email ?? '';
      if (email) {
        redirect(`/auth/verify?email=${encodeURIComponent(email)}&type=signup`);
      } else {
        redirect('/auth/login');
      }
    }

    if (profile && !profile.onboarding_completed) {
      redirect('/onboarding/country-select');
    }
  }

  return (
    <WebAuthGate initialState={initialState}>
      <AppShellProfileProvider>
        <div className="min-h-screen bg-(--background)">
          <AppTopBar />
          <LeftRail />
          <RightRail />
          <section className="w-full min-h-[calc(100vh-80px)] px-4 md:px-6 pt-4 pb-24 lg:pl-24 lg:pr-24">
            <div className="mx-auto w-full max-w-3xl">{children}</div>
          </section>
          <WebFloatingCart />
          <AppToaster />
          <MobileBottomTabs />
        </div>
      </AppShellProfileProvider>
    </WebAuthGate>
  );
}

