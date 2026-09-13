import { Suspense } from 'react';
import { fetchStoreListingUrls } from '@/lib/storeUrls';
import DownloadContent from './DownloadContent';

function DownloadFallback() {
  return (
    <main className="min-h-dvh font-sans flex flex-col items-center justify-center bg-(--surface)">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-emerald-200" />
        <div className="h-4 w-48 rounded bg-(--border)" />
        <div className="h-4 w-64 rounded bg-(--border)" />
      </div>
    </main>
  );
}

export default async function DownloadPage() {
  const storeUrls = await fetchStoreListingUrls();
  return (
    <Suspense fallback={<DownloadFallback />}>
      <DownloadContent initialStoreUrls={storeUrls} />
    </Suspense>
  );
}
