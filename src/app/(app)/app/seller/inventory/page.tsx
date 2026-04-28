import { Suspense } from 'react';
import InventoryClient from './InventoryClient';

export default function SellerInventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="px-1 py-4">
          <div className="h-8 w-1/2 animate-pulse rounded bg-(--border)" />
          <ul className="mt-4 space-y-3">
            {[0, 1, 2, 3].map((k) => (
              <li key={k} className="h-32 animate-pulse rounded-[24px] border border-(--border) bg-(--surface)" />
            ))}
          </ul>
        </div>
      }
    >
      <InventoryClient />
    </Suspense>
  );
}
