'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useWebCartStore } from '@/store/useWebCartStore';

/**
 * Mobile web: same entry as desktop — full cart page (`/app/cart`) with products + services,
 * address, coins, fulfillment, menu selection, checkout. No minimal modal.
 */
export default function WebFloatingCart() {
  const pathname = usePathname() || '';
  const total = useWebCartStore((s) => s.totalCount());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent SSR/client mismatch when persisted cart rehydrates on client.
  if (!mounted) return null;
  if (total <= 0) return null;
  if (pathname === '/app/cart' || pathname.startsWith('/app/cart/')) return null;

  return (
    <Link
      href="/app/cart"
      className="fixed bottom-24 right-5 z-95 flex h-14 w-14 items-center justify-center rounded-2xl bg-(--foreground) text-(--background) shadow-xl lg:hidden"
      aria-label={`Open cart, ${total} items`}
    >
      <ShoppingBag className="shrink-0" size={24} strokeWidth={2.7} />
      <span className="absolute -right-2 -top-2 min-w-[24px] rounded-full bg-emerald-500 px-1.5 py-0.5 text-center text-[11px] font-black text-white">
        {total > 99 ? '99+' : total}
      </span>
    </Link>
  );
}
