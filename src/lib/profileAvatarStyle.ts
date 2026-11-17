/** Matches mobile ProfileHeader: borderRadius = size * 0.3 (squircle). */
export const PROFILE_AVATAR_RADIUS_RATIO = 0.3;

export function profileSquircleRadius(size: number): number {
  return Math.round(size * PROFILE_AVATAR_RADIUS_RATIO);
}
