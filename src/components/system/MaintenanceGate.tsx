import Link from 'next/link';
import { createServerClient } from '@/lib/supabase';

/**
 * Full-page web gate when admin System Settings → maintenance_mode is on.
 * Fail-open if app_settings is unreachable (same posture as the mobile app).
 */
export default async function MaintenanceGate({ children }: { children: React.ReactNode }) {
  let maintenance = false;
  let supportPhone: string | null = null;

  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from('app_settings')
      .select('maintenance_mode, support_phone')
      .maybeSingle();
    maintenance = Boolean(data?.maintenance_mode);
    supportPhone =
      typeof data?.support_phone === 'string' && data.support_phone.trim()
        ? data.support_phone.trim()
        : null;
  } catch {
    maintenance = false;
  }

  if (!maintenance) return <>{children}</>;

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#07120f] px-6 py-16 text-center text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.35), transparent 55%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(245,158,11,0.12), transparent 50%)',
        }}
      />
      <div className="relative z-10 max-w-lg">
        <p className="mb-4 inline-flex rounded-full bg-amber-400/95 px-3 py-1 text-[11px] font-bold tracking-wider text-zinc-900">
          PAUSE
        </p>
        <p className="font-[family-name:var(--font-app-profile-slug)] text-4xl text-emerald-400 sm:text-5xl">
          StoreLink
        </p>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">Under maintenance</h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-300">
          We are upgrading StoreLink so shopping and payouts stay fast and safe. Please check back in a
          few minutes.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400"
          >
            Refresh
          </Link>
          {supportPhone ? (
            <a
              href={`tel:${supportPhone.replace(/\s+/g, '')}`}
              className="inline-flex rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/5"
            >
              Call {supportPhone}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
