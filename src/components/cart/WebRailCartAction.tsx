'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useWebCartStore } from '@/store/useWebCartStore';

export default function WebRailCartAction() {
  const total = useWebCartStore((s) =>
    s.products.reduce((acc, p) => acc + Math.max(1, Number(p.quantity || 1)), 0) + s.services.length,
  );

  return (
    <Link
      href="/app/cart"
      aria-label="Cart"
      className="inline-flex items-center justify-center group-hover:justify-start gap-3 rounded-2xl px-3 py-2.5 text-slate-700 dark:text-slate-200 hover:text-emerald-600 hover:bg-(--surface)"
    >
      <div className="relative w-10 h-10 rounded-xl border border-(--border) bg-(--surface) flex items-center justify-center shrink-0">
        <ShoppingBag size={24} />
        {total > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-emerald-500 px-1 py-0.5 text-[10px] font-black text-white">
            {total > 99 ? '99+' : total}
          </span>
        ) : null}
      </div>
      <span className="hidden group-hover:inline text-base font-bold whitespace-nowrap text-(--foreground)">Cart</span>
    </Link>
  );
}

