import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Classic storefront (`/sell`) was spun out to Sellfolio.
 * Old bookmarks redirect into the social web app.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/sell" || pathname.startsWith("/sell/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = search;
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/sell", "/sell/:path*"],
};
