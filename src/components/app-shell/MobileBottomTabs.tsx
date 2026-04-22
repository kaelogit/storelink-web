'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { mobileTabItems } from './shellConfig';

export default function MobileBottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-(--border) bg-(--background)/96 backdrop-blur-xl lg:hidden">
      <div className="mx-auto max-w-2xl px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] grid grid-cols-5 gap-1">
        {mobileTabItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 ${
                active ? 'text-emerald-600' : 'text-(--muted) hover:text-(--foreground)'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                active ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-transparent border-transparent'
              }`}>
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

