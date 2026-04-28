'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

type SettingsFrameProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function SettingsFrame({ title, subtitle, children }: SettingsFrameProps) {
  const searchParams = useSearchParams();
  const fromDrawer = searchParams.get('fromDrawer') === '1';
  const backHref = fromDrawer ? '/app/profile?openHub=1' : '/app/profile';
  const withDrawer = (href: string) => (fromDrawer ? `${href}${href.includes('?') ? '&' : '?'}fromDrawer=1` : href);

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between border-b border-(--border) bg-(--background)/95 px-1 py-3 backdrop-blur-sm lg:hidden">
        <Link
          href={backHref}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--surface) text-(--foreground)"
          aria-label={fromDrawer ? 'Back to profile menu' : 'Back to profile'}
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </Link>
        <h1 className="min-w-0 flex-1 text-center text-[12px] font-black uppercase tracking-[0.18em] text-(--foreground)">{title}</h1>
        <div className="h-11 w-11 shrink-0" />
      </header>

      <section className="rounded-3xl border border-(--border) bg-(--card) p-5 md:p-7">
        <h1 className="hidden text-2xl font-black text-(--foreground) lg:block">{title}</h1>
        {subtitle ? <p className="mb-5 mt-2 text-sm text-(--muted)">{subtitle}</p> : <div className="mb-5 hidden lg:block" />}
        {children}
      </section>

      <div className="mt-4">
        <Link href={withDrawer('/app/settings')} className="text-sm font-semibold text-emerald-600 hover:underline">
          Back to settings
        </Link>
      </div>
    </div>
  );
}
