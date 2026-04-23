import Link from 'next/link';

export default function AppProfilePage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="rounded-3xl border border-(--border) bg-(--card) p-8">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Parity Slice</p>
        <h1 className="mt-2 text-3xl font-black text-(--foreground)">Profile (app layer)</h1>
        <p className="mt-2 text-sm text-(--muted)">
          This route will mirror mobile profile capabilities, including self profile management and public profile actions.
        </p>
        <div className="mt-5">
          <Link href="/app" className="text-sm font-semibold text-emerald-600">Back to app home</Link>
        </div>
      </div>
    </div>
  );
}

