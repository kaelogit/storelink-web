import Link from 'next/link';

/** Placeholder: matches app route `/seller/revenue` until web financials parity is built. */
export default function SellerRevenuePage() {
  return (
    <div className="rounded-3xl border border-(--border) bg-(--card) p-8">
      <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Financials</p>
      <h1 className="mt-2 text-2xl font-black text-(--foreground)">Sales analytics</h1>
      <p className="mt-2 text-sm text-(--muted)">
        This screen mirrors the app lifetime revenue and settlements flow. Full web parity is next.
      </p>
      <Link href="/app/seller/dashboard" className="mt-6 inline-block text-sm font-bold text-emerald-600 hover:underline">
        ← Back to sales dashboard
      </Link>
    </div>
  );
}
