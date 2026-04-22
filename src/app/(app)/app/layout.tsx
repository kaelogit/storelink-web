import WebAuthGate from '@/components/auth/WebAuthGate';
import AppTopBar from '@/components/app-shell/AppTopBar';
import LeftRail from '@/components/app-shell/LeftRail';
import RightRail from '@/components/app-shell/RightRail';
import MobileBottomTabs from '@/components/app-shell/MobileBottomTabs';
import { AppShellProfileProvider } from '@/components/app-shell/app-shell-profile';
import type { ReactNode } from 'react';

export default function AppLayerLayout({ children }: { children: ReactNode }) {
  return (
    <WebAuthGate>
      <AppShellProfileProvider>
        <div className="min-h-screen bg-(--background)">
          <AppTopBar />
          <LeftRail />
          <RightRail />
          <section className="w-full min-h-[calc(100vh-80px)] px-4 md:px-6 pt-4 pb-24 lg:pl-24 lg:pr-24">
            <div className="mx-auto w-full max-w-3xl">{children}</div>
          </section>
          <MobileBottomTabs />
        </div>
      </AppShellProfileProvider>
    </WebAuthGate>
  );
}

