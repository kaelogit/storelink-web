import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveStorefrontSlugRedirectEdge } from "@/lib/storefrontSlugRedirectEdge";
import {
  RESERVED_STOREFRONT_PATH_SEGMENTS,
  storefrontEdgeRootDomain,
  storefrontEdgeShopSubdomain,
} from "@/lib/storefrontTenantHost";

/**
 * 1) Legacy `storelink.ng/sell/*` → rewrite to `STOREFRONT_ORIGIN` (upstream paths have no `/sell`).
 * 2) Optional 308 redirects when `STOREFRONT_LEGACY_SELL_PATH_REDIRECT=1`:
 *    - `/sell` and `/sell/` → `https://shop.{root}/`
 *    - `/sell/{slug}` (single segment, not reserved) → `https://{slug}.{root}/` (follows `storefront_slug_redirects` when renamed)
 *
 * Wildcard hosts (`*.storelink.ng`) should point at the storefront project; this app only handles `/sell`.
 */
function normalizeStorefrontOrigin(raw: string | undefined): string | null {
  const t = raw?.trim().replace(/\/+$/, "");
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function rewriteToStorefront(
  request: NextRequest,
  storefrontOrigin: string,
  upstreamPath: string,
  search: string,
): NextResponse {
  let target: URL;
  try {
    target = new URL(`${upstreamPath}${search}`, storefrontOrigin);
  } catch {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("host", target.host);
  const publicHost =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    request.nextUrl.host;
  requestHeaders.set("x-forwarded-host", publicHost);
  requestHeaders.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", "") || "https");

  const bypass = process.env.STOREFRONT_VERCEL_BYPASS_SECRET?.trim();
  if (bypass) {
    requestHeaders.set("x-vercel-protection-bypass", bypass);
  }

  try {
    return NextResponse.rewrite(target, {
      request: { headers: requestHeaders },
    });
  } catch {
    return NextResponse.next();
  }
}

export async function middleware(request: NextRequest) {
  const storefrontOrigin = normalizeStorefrontOrigin(process.env.STOREFRONT_ORIGIN);
  if (!storefrontOrigin) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  const root = storefrontEdgeRootDomain();
  const shopSub = storefrontEdgeShopSubdomain();
  const shopUrl = `https://${shopSub}.${root}/`;

  const legacyRedirect = process.env.STOREFRONT_LEGACY_SELL_PATH_REDIRECT === "1";

  if (legacyRedirect && (pathname === "/sell" || pathname === "/sell/")) {
    return NextResponse.redirect(shopUrl, 308);
  }

  if (legacyRedirect && pathname.startsWith("/sell/")) {
    const afterSell = pathname.slice("/sell".length);
    const trimmed = afterSell.startsWith("/") ? afterSell.slice(1) : afterSell;
    const firstSeg = trimmed.split("/")[0] ?? "";
    const onlyOneSegment = trimmed !== "" && !trimmed.includes("/");

    if (onlyOneSegment && firstSeg && !RESERVED_STOREFRONT_PATH_SEGMENTS.has(firstSeg)) {
      const canonical = (await resolveStorefrontSlugRedirectEdge(firstSeg)) ?? firstSeg;
      const dest = `https://${encodeURIComponent(canonical)}.${root}/`;
      return NextResponse.redirect(dest, 308);
    }
  }

  if (pathname === "/sell" || pathname.startsWith("/sell/")) {
    let upstreamPath = pathname;
    if (pathname === "/sell" || pathname === "/sell/") {
      upstreamPath = "/";
    } else if (pathname.startsWith("/sell/")) {
      upstreamPath = pathname.slice("/sell".length) || "/";
    }
    return rewriteToStorefront(request, storefrontOrigin, upstreamPath, search);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/sell", "/sell/:path*"],
};
