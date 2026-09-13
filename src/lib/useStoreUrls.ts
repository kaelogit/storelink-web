'use client';

import { useEffect, useState } from 'react';
import {
  downloadFunnelHref,
  fetchStoreListingUrls,
  mergeStoreListingUrls,
  preferredDownloadHref,
  type StoreListingUrls,
} from '@/lib/storeUrls';

export function useStoreListingUrls(initial?: StoreListingUrls): StoreListingUrls {
  const [urls, setUrls] = useState<StoreListingUrls>(
    () => initial ?? mergeStoreListingUrls(),
  );

  useEffect(() => {
    let mounted = true;
    fetchStoreListingUrls()
      .then((next) => {
        if (mounted) setUrls(next);
      })
      .catch(() => {
        /* keep env / initial */
      });
    return () => {
      mounted = false;
    };
  }, []);

  return urls;
}

/** Same as preferredDownloadHref, but stable on the first paint (avoids hydration mismatch). */
export function usePreferredDownloadHref(intentPath?: string | null): string {
  const stores = useStoreListingUrls();
  const [href, setHref] = useState(() => downloadFunnelHref(intentPath));

  useEffect(() => {
    setHref(preferredDownloadHref(stores, intentPath));
  }, [stores, intentPath]);

  return href;
}
