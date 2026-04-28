'use client';

import { Clapperboard, Layers, Lock, Package, Sparkles, Video, Wrench } from 'lucide-react';

export type WebPublicProfileTab = 'drops' | 'services' | 'reels' | 'collection' | 'spotlight';
export type WebSelfProfileTab = 'drops' | 'services' | 'reels' | 'wardrobe' | 'spotlight';

type WebProfileTabBarProps = {
  variant: 'public' | 'self';
  activeTab: string;
  onTab: (tab: string) => void;
  isSeller: boolean;
  isStoreActive: boolean;
  isWardrobePrivate: boolean;
};

export default function WebProfileTabBar({
  variant,
  activeTab,
  onTab,
  isSeller,
  isStoreActive,
  isWardrobePrivate,
}: WebProfileTabBarProps) {
  const showSellerTabs = isSeller && isStoreActive;
  const collectionTabKey = variant === 'public' ? 'collection' : 'wardrobe';
  const isCollectionActive = activeTab === collectionTabKey;

  const tabBtn = (isActive: boolean) =>
    `flex-1 py-4 flex justify-center border-b-2 transition-colors duration-(--duration-150) ${
      isActive ? 'border-(--charcoal) text-(--foreground)' : 'border-transparent text-(--muted)'
    }`;

  return (
    <div className="sticky top-[70px] z-30 flex border-b border-(--border) bg-(--card) shadow-sm">
      {showSellerTabs ? (
        <>
          <button type="button" aria-label="Products" className={tabBtn(activeTab === 'drops')} onClick={() => onTab('drops')}>
            <Package size={20} strokeWidth={activeTab === 'drops' ? 2.5 : 2} />
          </button>
          <button
            type="button"
            aria-label="Services"
            className={tabBtn(activeTab === 'services')}
            onClick={() => onTab('services')}
          >
            <Wrench size={20} strokeWidth={activeTab === 'services' ? 2.5 : 2} />
          </button>
          <button type="button" aria-label="Reels" className={tabBtn(activeTab === 'reels')} onClick={() => onTab('reels')}>
            <Video size={20} strokeWidth={activeTab === 'reels' ? 2.5 : 2} />
          </button>
        </>
      ) : null}

      <button
        type="button"
        aria-label="Collection"
        className={tabBtn(isCollectionActive)}
        onClick={() => onTab(collectionTabKey)}
      >
        {isWardrobePrivate ? (
          <Lock size={20} className={isCollectionActive ? 'text-(--foreground)' : 'text-(--muted)'} />
        ) : (
          <Layers size={20} strokeWidth={isCollectionActive ? 2.5 : 2} />
        )}
      </button>

      <button
        type="button"
        aria-label="Spotlight"
        className={tabBtn(activeTab === 'spotlight')}
        onClick={() => onTab('spotlight')}
      >
        {variant === 'self' ? (
          <Clapperboard size={20} strokeWidth={activeTab === 'spotlight' ? 2.5 : 2} />
        ) : (
          <Sparkles size={20} strokeWidth={activeTab === 'spotlight' ? 2.5 : 2} />
        )}
      </button>
    </div>
  );
}
