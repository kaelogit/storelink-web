'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function ClawbackSuccessClient() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-[86px] w-[86px] items-center justify-center rounded-full bg-emerald-500/15">
        <CheckCircle2 size={46} className="text-emerald-600" strokeWidth={2.5} />
      </div>
      <h1 className="text-2xl font-black text-(--foreground)">Repayment successful</h1>
      <p className="mt-2 text-sm font-semibold text-(--muted)">
        Your account access is restored. Keep building great service sales on StoreLink.
      </p>
      <Link
        href="/app"
        className="mt-8 inline-flex min-h-[52px] min-w-[230px] items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-black tracking-widest text-white"
      >
        CONTINUE SELLING
      </Link>
    </div>
  );
}
