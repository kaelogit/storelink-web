import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Proxies `storelink.ng/sell/*` to the storefront deployment (Next app with `basePath: "/sell"`).
 * Set `STOREFRONT_ORIGIN` on the storelink-web Vercel project, e.g. `https://store-link-storefront-xxx.vercel.app`
 * (no trailing slash). Add domain `storelink.ng` to that storefront project’s allowed domains if required.
 */
export function middleware(request: NextRequest) {
  const storefrontOrigin = process.env.STOREFRONT_ORIGIN?.trim().replace(/\/+$/, "");
  if (!storefrontOrigin) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  if (pathname === "/sell" || pathname.startsWith("/sell/")) {
    const target = new URL(pathname + search, storefrontOrigin);
    return NextResponse.rewrite(target);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/sell", "/sell/:path*"],
};
