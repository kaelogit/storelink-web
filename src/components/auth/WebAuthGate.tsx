'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';

type GateState = 'checking' | 'authed' | 'guest';

export default function WebAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [state, setState] = useState<GateState>('checking');

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setState(data.session ? 'authed' : 'guest');
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState(session ? 'authed' : 'guest');
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  if (state === 'checking') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-[var(--muted)]">
        Checking your session...
      </div>
    );
  }

  if (state === 'guest') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <h1 className="text-2xl font-black text-[var(--foreground)]">Sign in required</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            The web app layer is for authenticated users. You can still view shared public pages.
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
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface)]"
            >
              Create account
            </Link>
            <button
              type="button"
              onClick={() => router.push('/explore')}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--muted)] hover:bg-[var(--surface)]"
            >
              Continue public browse
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

