import ClientExploreWrapper from '@/app/explore/ClientExploreWrapper';

export default function AppSearchPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="sticky top-[80px] z-20 border-b border-(--border) bg-(--background)/90 backdrop-blur-xl px-2 sm:px-4 py-3">
        <h1 className="text-base sm:text-lg font-black tracking-tight text-(--foreground)">Search</h1>
        <p className="text-xs sm:text-sm text-(--muted)">Search sellers, products, and services</p>
      </div>
      <ClientExploreWrapper embedded surface="home" />
    </div>
  );
}

