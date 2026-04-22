import Link from 'next/link';

export default function AppBookingsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Parity Slice</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--foreground)]">Bookings (app layer)</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Service booking list/detail parity starts here for authenticated web.
        </p>
        <div className="mt-5">
          <Link href="/app" className="text-sm font-semibold text-emerald-600">Back to app home</Link>
        </div>
      </div>
    </div>
  );
}

