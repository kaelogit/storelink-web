import type { ShareSurface } from './openShareSheet';

export const SHARE_PLATFORM_IDS = ['whatsapp', 'copy', 'sms', 'instagram', 'more'] as const;
export type SharePlatformId = (typeof SHARE_PLATFORM_IDS)[number];

const DEFAULT_PLATFORMS: Record<ShareSurface, readonly SharePlatformId[]> = {
  reel: ['whatsapp', 'copy', 'sms', 'instagram', 'more'],
  spotlight: ['whatsapp', 'copy', 'sms', 'instagram', 'more'],
  product: ['whatsapp', 'copy', 'sms', 'more'],
  service: ['whatsapp', 'copy', 'sms', 'more'],
  profile: ['whatsapp', 'copy', 'sms', 'more'],
  story: ['whatsapp', 'copy', 'sms', 'more'],
  invite: ['whatsapp', 'copy', 'sms', 'more'],
  curation: ['whatsapp', 'copy', 'sms', 'more'],
  export: ['whatsapp', 'copy', 'sms', 'more'],
};

export function platformsForSurface(surface: ShareSurface): SharePlatformId[] {
  return [...DEFAULT_PLATFORMS[surface]];
}

export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildSmsShareUrl(message: string): string {
  return `sms:?body=${encodeURIComponent(message)}`;
}
