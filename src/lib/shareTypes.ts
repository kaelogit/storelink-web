import type { ShareType } from '@/lib/shareDm';
import type { SharePlatformId } from '@/lib/sharePlatforms';
import type { ShareSurface } from '@/lib/openShareSheet';

export type ShareMenuAction = {
  id: string;
  label: string;
  destructive?: boolean;
  onPress: () => void | Promise<void>;
};

export type SharePayload = {
  type: ShareType;
  url: string;
  title: string;
  message?: string;
  imageUrl?: string;
  surface?: ShareSurface;
  platformIds?: SharePlatformId[];
  menuActions?: ShareMenuAction[];
};
