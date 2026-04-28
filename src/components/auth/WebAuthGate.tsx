'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Loader2, Sparkles } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { isGuestReadableAppRoute } from '@/lib/guestAppRoutes';

type GateState = 'checking' | 'authed' | 'guest';

export default function WebAuthGate({
  children,
  initialState = 'checking',
}: {
  children: React.ReactNode;
  initialState?: GateState;
}) {
  const pathname = usePathname();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [state, setState] = useState<GateState>(initialState);

  useEffect(() => {
    let mounted = true;
    // If server already established auth state, avoid a jarring loading flash.
    if (initialState === 'checking') {
      supabase.auth.getSession().then(({ data }) => {
        if (!mounted) return;
        setState(data.session ? 'authed' : 'guest');
      });
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState(session ? 'authed' : 'guest');
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, initialState]);

  if (state === 'checking') {
    return (
      <div className="relative isolate min-h-[72vh] overflow-hidden px-5 py-10">
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-emerald-500/10 via-transparent to-violet-500/10" />
        <div className="mx-auto flex w-full max-w-xl items-center justify-center">
          <div className="w-full rounded-[28px] border border-(--border) bg-(--card)/95 p-7 shadow-xl backdrop-blur">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
              <Sparkles size={14} className="text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">StoreLink Web</span>
            </div>
            <h1 className="text-2xl font-black leading-tight text-(--foreground)">Preparing your discovery experience</h1>
            <p className="mt-2 text-sm text-(--muted)">
              Checking your session and loading your personalized feed, orders, and bookings.
            </p>
            <div className="mt-6 rounded-2xl border border-(--border) bg-(--surface) p-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <Loader2 size={18} className="animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-black text-(--foreground)">Getting things ready for discovery...</p>
                  <p className="text-xs text-(--muted)">This usually takes a second.</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-(--muted)">
                <Compass size={13} />
                <span>Curating your StoreLink web session</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'guest') {
    if (isGuestReadableAppRoute(pathname)) {
      return <>{children}</>;
    }
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-3xl border border-(--border) bg-(--card) p-8 text-center">
          <h1 className="text-2xl font-black text-(--foreground)">Sign in required</h1>
          <p className="mt-3 text-sm text-(--muted)">
            This part of StoreLink is for signed-in shoppers (cart, orders, messages). Shared products and services open without an account.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/auth/login?next=${encodeURIComponent(pathname || '/app')}`}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500"
            >
              Login
            </Link>
            <Link
              href={`/auth/signup?next=${encodeURIComponent(pathname || '/app')}`}
              className="rounded-xl border border-(--border) px-4 py-2 text-sm font-bold text-(--foreground) hover:bg-(--surface)"
            >
              Create account
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-(--border) px-4 py-2 text-sm font-bold text-(--muted) hover:bg-(--surface)"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

