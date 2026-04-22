import ClientExploreWrapper from '@/app/explore/ClientExploreWrapper';

export default function AppHomePage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ClientExploreWrapper embedded surface="home" />
    </div>
  );
}

