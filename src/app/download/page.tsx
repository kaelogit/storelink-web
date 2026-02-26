import { Suspense } from 'react';
import DownloadContent from './DownloadContent';

function DownloadFallback() {
  return (
    <main className="min-h-screen font-sans flex flex-col items-center justify-center bg-slate-50">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-emerald-200" />
        <div className="h-4 w-48 rounded bg-slate-200" />
        <div className="h-4 w-64 rounded bg-slate-200" />
      </div>
    </main>
  );
}

export default function DownloadPage() {
  return (
    <Suspense fallback={<DownloadFallback />}>
      <DownloadContent />
    </Suspense>
  );
}
