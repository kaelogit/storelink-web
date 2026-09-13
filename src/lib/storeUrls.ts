/**
 * Resolve live App Store / Play Store listing URLs for marketing and the app shell.
 * Admin `app_settings.store_url_*` wins, then `NEXT_PUBLIC_*` env.
 * Placeholder Apple IDs and empty / non-https values are treated as not listed yet
 * so badges never point at a 404.
 */

import { createBrowserClient, createServerClient } from '@/lib/supabase';

export type StoreListingUrls = {
  ios: string | null;
  android: string | null;
};

const ENV_IOS = process.env.NEXT_PUBLIC_APP_STORE_URL ?? '';
const ENV_ANDROID = process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? '';

const PLACEHOLDER_APPLE_ID = /\/id0{6,}(?:\b|$)/i;
const TTL_MS = 5 * 60_000;

let cache: { urls: StoreListingUrls; at: number } | null = null;

export function normalizeLiveStoreUrl(raw: string | null | undefined): string | null {
  const url = String(raw || '').trim();
  if (!url) return null;
  if (!/^https:\/\//i.test(url)) return null;
  if (PLACEHOLDER_APPLE_ID.test(url) || /id000000000/i.test(url)) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname) return null;
  } catch {
    return null;
  }
  return url;
}

export function isLiveStoreUrl(raw: string | null | undefined): boolean {
  return normalizeLiveStoreUrl(raw) !== null;
}

export function mergeStoreListingUrls(admin?: {
  ios?: string | null;
  android?: string | null;
}): StoreListingUrls {
  return {
    ios: normalizeLiveStoreUrl(admin?.ios) || normalizeLiveStoreUrl(ENV_IOS),
    android: normalizeLiveStoreUrl(admin?.android) || normalizeLiveStoreUrl(ENV_ANDROID),
  };
}

/** Live store listing, or the download funnel when that store is not listed yet. */
export function storeCtaHref(liveUrl: string | null, fallback = '/download'): string {
  return liveUrl || fallback;
}

export function downloadFunnelHref(intentPath?: string | null): string {
  return intentPath ? `/download?intent=${encodeURIComponent(intentPath)}` : '/download';
}

/**
 * App-shell / hub “Get the app”:
 * keep `?intent=` on the download funnel; otherwise use the live store for this OS.
 * Desktop always lands on `/download`, whose badges resolve from the same source.
 */
export function preferredDownloadHref(
  stores: StoreListingUrls,
  intentPath?: string | null,
): string {
  if (intentPath) return downloadFunnelHref(intentPath);
  if (typeof navigator === 'undefined') return '/download';
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/i.test(ua) && stores.ios) return stores.ios;
  if (/android/i.test(ua) && stores.android) return stores.android;
  return '/download';
}

export async function fetchStoreListingUrls(): Promise<StoreListingUrls> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.urls;

  const fallback = mergeStoreListingUrls();
  try {
    const supabase = typeof window === 'undefined' ? createServerClient() : createBrowserClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('store_url_ios, store_url_android')
      .maybeSingle();
    if (error) throw error;
    const urls = mergeStoreListingUrls({
      ios: data?.store_url_ios,
      android: data?.store_url_android,
    });
    cache = { urls, at: now };
    return urls;
  } catch {
    cache = { urls: fallback, at: now };
    return fallback;
  }
}
