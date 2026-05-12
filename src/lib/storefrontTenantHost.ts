/**
 * Edge helpers for storefront routing on storelink-web (legacy `/sell` redirects).
 * Reserved path segments align with store-link-storefront `lib/storefrontHosts.ts`.
 */

const DEFAULT_ROOT = "storelink.ng";
const DEFAULT_SHOP_SUB = "shop";

/** First path segment under `/sell/*` that is never a public seller slug redirect target. */
export const RESERVED_STOREFRONT_PATH_SEGMENTS = new Set([
  "auth",
  "login",
  "signup",
  "dashboard",
  "admin",
  "onboarding",
  "account",
  "post-login",
  "verify",
  "marketplace",
  "product",
  "logout",
  "forgot-password",
  "waitlist",
  "terms",
  "privacy",
  "pricing",
  "about",
  "contact",
  "faq",
  "report",
  "safety",
  "store-coins",
  "wallet",
  "update-password",
  "sitemap",
  "robots.txt",
  "api",
  "",
]);

export function storefrontEdgeRootDomain(): string {
  return (process.env.STOREFRONT_ROOT_DOMAIN || DEFAULT_ROOT).trim().toLowerCase() || DEFAULT_ROOT;
}

export function storefrontEdgeShopSubdomain(): string {
  return (process.env.STOREFRONT_SHOP_SUBDOMAIN || DEFAULT_SHOP_SUB).trim().toLowerCase() || DEFAULT_SHOP_SUB;
}

export function hostWithoutPort(hostHeader: string | null): string {
  const raw = (hostHeader || "").split(",")[0]?.trim() || "";
  return raw.split(":")[0]?.trim().toLowerCase() || "";
}
