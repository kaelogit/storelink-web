/** Open a house-ad deeplink (in-app path or external URL). */

const APP_PREFIXES = [
  '/seller',
  '/discover',
  '/explore',
  '/spotlight',
  '/reels',
  '/wallet',
  '/settings',
  '/onboarding',
  '/help-center',
];

function toWebPath(raw: string): string {
  if (raw.startsWith('/app/')) return raw;
  if (raw.startsWith('/product/')) return `/app/p/${raw.slice('/product/'.length)}`;
  if (raw.startsWith('/service/')) return `/app/s/${raw.slice('/service/'.length)}`;
  if (raw.startsWith('/p/') || raw.startsWith('/s/')) return `/app${raw}`;
  if (APP_PREFIXES.some((prefix) => raw === prefix || raw.startsWith(`${prefix}/`))) {
    return `/app${raw}`;
  }
  return raw;
}

export function openHouseAdDeeplink(deeplink: string | null | undefined): void {
  const raw = String(deeplink || '').trim();
  if (!raw || typeof window === 'undefined') return;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    window.open(raw, '_blank', 'noopener,noreferrer');
    return;
  }

  const path = toWebPath(raw.startsWith('/') ? raw : `/${raw}`);
  window.location.assign(path);
}
