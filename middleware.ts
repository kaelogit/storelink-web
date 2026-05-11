import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Rewrites `storelink.ng/sell/*` to the storefront deployment (Next app with `basePath: "/sell"`).
 *
 * Vercel env on **this** project only: `STOREFRONT_ORIGIN`
 * Example: `https://store-link-storefront-xxxxx.vercel.app` (scheme optional; trailing slashes stripped)
 */
function normalizeStorefrontOrigin(raw: string | undefined): string | null {
  const t = raw?.trim().replace(/\/+$/, "");
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function middleware(request: NextRequest) {
  const storefrontOrigin = normalizeStorefrontOrigin(process.env.STOREFRONT_ORIGIN);
  if (!storefrontOrigin) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  if (pathname !== "/sell" && !pathname.startsWith("/sell/")) {
    return NextResponse.next();
  }

  try {
    const target = new URL(`${pathname}${search}`, storefrontOrigin);
    return NextResponse.rewrite(target);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/sell", "/sell/:path*"],
};
