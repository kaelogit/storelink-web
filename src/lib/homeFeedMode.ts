export type HomeFeedMode = 'forYou' | 'following';

export function homeFeedEmptyTitle(mode: HomeFeedMode, categoryKind: string): string {
  if (mode === 'following') {
    return 'Nothing from people you follow';
  }
  if (categoryKind !== 'all') {
    return 'No listings here';
  }
  return 'No products & services here';
}

export function homeFeedEmptyMessage(mode: HomeFeedMode, categoryKind: string, isFlashMode: boolean): string {
  if (mode === 'following') {
    if (categoryKind !== 'all') {
      return 'No matching listings from followed stores yet. Try another category or check back later.';
    }
    return 'Follow stores to see their newest products and services here.';
  }
  if (categoryKind !== 'all') {
    return 'No listings in this category yet. Try another category or check back later.';
  }
  if (isFlashMode) {
    return 'No flash drops live right now. Browse all listings or check back later.';
  }
  return 'No products & services yet. Open Explore or Discover to keep browsing.';
}
