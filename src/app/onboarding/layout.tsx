'use client';

import { ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const stepInfo = useMemo(() => {
    const steps = [
      { path: '/onboarding/country-select', label: 'Location', progress: 14 },
      { path: '/onboarding/role-setup', label: 'Role', progress: 28 },
      { path: '/onboarding/location-permission', label: 'Permissions', progress: 42 },
      { path: '/onboarding/setup', label: 'Setup', progress: 57 },
      { path: '/onboarding/collector-setup', label: 'Profile', progress: 71 },
      { path: '/onboarding/pick-categories', label: 'Interests', progress: 85 },
      { path: '/onboarding/follow-stores', label: 'Follow', progress: 100 },
    ];

    const current = steps.find((s) => pathname.startsWith(s.path)) || steps[0];
    const stepNumber = steps.indexOf(current) + 1;

    return { current, stepNumber, totalSteps: steps.length, ...current };
  }, [pathname]);

  return (
    <div className="min-h-screen bg-(--background) flex flex-col">
      {/* Progress Bar */}
      <div className="sticky top-0 z-50 border-b border-(--border) bg-(--background)/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-(--muted)">
              Step {stepInfo.stepNumber}/{stepInfo.totalSteps}
            </span>
            <span className="text-xs font-semibold text-(--muted)">{Math.round(stepInfo.progress)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-(--muted)/10 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-emerald-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${stepInfo.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
