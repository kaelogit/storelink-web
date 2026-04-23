import Link from 'next/link';

export default function AppOrdersPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="rounded-3xl border border-(--border) bg-(--card) p-8">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Parity Slice</p>
        <h1 className="mt-2 text-3xl font-black text-(--foreground)">Orders (app layer)</h1>
        <p className="mt-2 text-sm text-(--muted)">
          Buyer product order list/detail parity starts here for authenticated web.
        </p>
        <div className="mt-5">
          <Link href="/app" className="text-sm font-semibold text-emerald-600">Back to app home</Link>
        </div>
      </div>
    </div>
  );
}

