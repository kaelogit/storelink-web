export type FollowButtonLabel = 'Following' | 'Follow back' | 'Follow';

export function getFollowButtonLabel(opts: { isFollowing: boolean; followsMe: boolean }): FollowButtonLabel {
  if (opts.isFollowing) return 'Following';
  if (opts.followsMe) return 'Follow back';
  return 'Follow';
}

export const UNFOLLOW_RECIPROCAL_SUBTITLE =
  'This account follows you back. Unfollow them anyway? You can follow again anytime.';
