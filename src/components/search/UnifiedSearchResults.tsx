'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Store } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import {
  SEMANTIC_SEARCH_EXAMPLE_QUERIES,
  searchDiscoverWithSemantic,
  semanticSearchEmptyHint,
  type DiscoverSearchResultRow,
} from '@/lib/semanticProductSearch';
import {
  UNIFIED_SEARCH_SCOPE_TABS,
  unifiedSearchResultHref,
  unifiedSearchScopeParam,
  type UnifiedSearchScopeTab,
} from '@/lib/unifiedSearch';
import {
  hydrateSearchSellerLogos,
  isAccountSearchRow,
  searchCardPriceLabel,
  sellerLogoFromRow,
} from '@/lib/searchResultLayout';

export default function UnifiedSearchResults({
  query,
  userId,
  locationCountry,
  onExampleClick,
}: {
  query: string;
  userId?: string | null;
  locationCountry?: string | null;
  onExampleClick?: (q: string) => void;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [scopeTab, setScopeTab] = useState<UnifiedSearchScopeTab>('All');
  const searchScopeRpc = unifiedSearchScopeParam(scopeTab);

  const {
    data: searchRows = [],
    isFetching,
    error,
  } = useQuery({
    queryKey: ['unified-search', userId, query, searchScopeRpc, locationCountry],
    enabled: query.trim().length >= 2,
    queryFn: () =>
      searchDiscoverWithSemantic({
        query,
        scope: searchScopeRpc,
        userId: userId ?? null,
        locationCountry: locationCountry ?? 'Nigeria',
        limit: 36,
      }),
  });

  const relatedProfileIds = useMemo(() => {
    const ids = new Set<string>();
    searchRows.forEach((row) => {
      if (isAccountSearchRow(row)) ids.add(String(row.item_id));
      else if (row.seller_id) ids.add(String(row.seller_id));
    });
    return [...ids];
  }, [searchRows]);

  const { data: logosData } = useQuery({
    queryKey: ['unified-search-logos', relatedProfileIds.join(',')],
    enabled: relatedProfileIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, logo_url, slug').in('id', relatedProfileIds);
      const map: Record<string, string | null | undefined> = {};
      const slugMap: Record<string, string> = {};
      for (const p of data || []) {
        map[String(p.id)] = p.logo_url;
        if (p.slug) slugMap[String(p.id)] = String(p.slug);
      }
      return { logos: map, slugs: slugMap };
    },
  });
  const logos = logosData ?? { logos: {}, slugs: {} };

  const displayRows = useMemo(() => {
    const withLogos = hydrateSearchSellerLogos(searchRows, logos.logos || {});
    const slugs = logos.slugs || {};
    return withLogos.map((row) => {
      if (row.item_type !== 'account') return row;
      const slug = slugs[String(row.item_id)];
      return slug ? { ...row, slug } : row;
    });
  }, [searchRows, logos]);

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {UNIFIED_SEARCH_SCOPE_TABS.map((tab) => {
          const active = scopeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setScopeTab(tab)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap ${
                active
                  ? 'bg-(--foreground) text-(--background)'
                  : 'border border-(--border) bg-(--surface) text-(--muted) hover:text-(--foreground)'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {isFetching ? (
        <p className="py-10 text-center text-sm text-(--muted)">Searching…</p>
      ) : error ? (
        <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {(error as Error).message || 'Search failed. Try again.'}
        </p>
      ) : displayRows.length === 0 ? (
        <div className="mx-auto max-w-md py-10 text-center">
          <Search size={28} className="mx-auto mb-3 text-(--muted)" />
          <p className="text-sm font-bold text-(--foreground)">
            {scopeTab === 'Products' ? 'No products found' : scopeTab === 'Services' ? 'No services found' : 'No results found'}
          </p>
          <p className="mt-2 text-sm text-(--muted)">{semanticSearchEmptyHint(query)}</p>
          <p className="mt-4 text-[11px] font-black uppercase tracking-wide text-(--muted)">Try searching for</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {SEMANTIC_SEARCH_EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => onExampleClick?.(example)}
                className="rounded-full border border-(--border) bg-(--surface) px-3 py-1.5 text-xs font-semibold text-(--foreground)"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {displayRows.map((row) => (
            <SearchResultCard
              key={`${row.item_type}-${row.item_id}`}
              row={row}
              onPress={() => router.push(unifiedSearchResultHref(row))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ row, onPress }: { row: DiscoverSearchResultRow; onPress: () => void }) {
  const image = normalizeWebMediaUrl(row.image_url || sellerLogoFromRow(row));
  const price = searchCardPriceLabel(row);
  const kind = row.item_type === 'account' ? 'Account' : row.item_type;

  return (
    <button
      type="button"
      onClick={onPress}
      className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface) text-left transition hover:bg-(--card)"
    >
      <div className="relative aspect-square bg-(--card)">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-(--muted)">
            <Store size={28} />
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
          {kind}
        </span>
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-bold text-(--foreground)">{row.title || 'Listing'}</p>
        {row.subtitle ? <p className="mt-0.5 line-clamp-1 text-xs text-(--muted)">{row.subtitle}</p> : null}
        {price ? <p className="mt-1 text-xs font-semibold text-emerald-600">{price}</p> : null}
      </div>
    </button>
  );
}
