import type { ShareMenuAction, SharePayload } from '@/lib/shareTypes';
import { platformsForSurface } from '@/lib/sharePlatforms';
import type { ShareType } from '@/lib/shareDm';
import { useShareSheetStore } from '@/store/useShareSheetStore';

/** StoreLink surfaces — drives which external apps appear. */
export type ShareSurface =
  | 'reel'
  | 'spotlight'
  | 'product'
  | 'service'
  | 'profile'
  | 'story'
  | 'invite'
  | 'curation'
  | 'export';

export type OpenShareSheetInput = {
  surface: ShareSurface;
  shareType: ShareType;
  url?: string;
  title: string;
  message?: string;
  imageUrl?: string | null;
  viewerId?: string | null;
  ownerId?: string | null;
  sellerId?: string | null;
  sellerSlug?: string | null;
  menuActions?: ShareMenuAction[];
};

function buildMenuActions(input: OpenShareSheetInput): ShareMenuAction[] {
  const actions: ShareMenuAction[] = [...(input.menuActions || [])];
  const isOwner =
    !!input.viewerId && !!input.ownerId && String(input.viewerId) === String(input.ownerId);

  if (!isOwner && input.url) {
    const subject = encodeURIComponent('Report on StoreLink');
    const body = encodeURIComponent(`I want to report this:\n${input.url}`);
    actions.push({
      id: 'report',
      label: 'Report',
      onPress: () => {
        window.location.href = `mailto:support@storelink.ng?subject=${subject}&body=${body}`;
      },
    });
  }

  return actions;
}

export function buildSharePayload(input: OpenShareSheetInput): SharePayload {
  const menuActions = buildMenuActions(input);
  const defaultMessage = input.url ? `${input.title}\n\n${input.url}` : input.title;
  return {
    type: input.shareType,
    url: input.url ?? '',
    title: input.title,
    message: input.message ?? defaultMessage,
    imageUrl: input.imageUrl ?? undefined,
    surface: input.surface,
    platformIds: platformsForSurface(input.surface),
    menuActions: menuActions.length ? menuActions : undefined,
  };
}

export function openShareSheet(input: OpenShareSheetInput) {
  useShareSheetStore.getState().open(buildSharePayload(input));
}
