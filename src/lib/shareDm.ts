import type { SharePayload } from '@/lib/shareTypes';

export type ShareType =
  | 'product'
  | 'reel'
  | 'profile'
  | 'service'
  | 'spotlight'
  | 'story'
  | 'invite'
  | 'group_join'
  | 'curation'
  | 'export';

export type ShareLinkMessageMetadata = {
  share_link?: {
    type: ShareType;
    url: string;
    title?: string;
    image_url?: string;
  };
};

export function buildShareDmText(payload: Pick<SharePayload, 'url' | 'title' | 'message'>): string {
  const custom = payload.message?.trim();
  if (custom) return custom;

  const url = payload.url?.trim();
  const title = payload.title?.trim();
  if (!url) return title || '';
  if (!title || title === url) return url;
  return `${url}\n${title}`;
}

export function buildShareDmMetadata(payload: SharePayload): ShareLinkMessageMetadata | null {
  const url = payload.url?.trim();
  if (!url) return null;
  return {
    share_link: {
      type: payload.type,
      url,
      title: payload.title?.trim() || undefined,
      image_url: payload.imageUrl?.trim() || undefined,
    },
  };
}
