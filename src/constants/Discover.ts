/**
 * Discover tab — ranking & layout policy (keep in sync with store-link-mobile).
 *
 * Diamond cap: max share of tiles on one screen that may receive a diamond-plan
 * layout boost. Paid members should win visibility, but capping avoids an ad-only grid.
 */
export const DISCOVER_DIAMOND_TILE_CAP = 0.35;

/**
 * Paid ad share of mosaic tiles. Client injects after every ~1/AD_TILE_CAP organic tiles.
 */
export const AD_TILE_CAP = 0.15;

export const DISCOVER_MOSAIC_PAGE_SIZE = 36;
