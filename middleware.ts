import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Classic storefront (`/sell`) was spun out to Sellfolio.
 * Invite links (`/?ref=CODE`) must land on signup — not the marketing homepage.
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/sell" || pathname.startsWith("/sell/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url, 308);
  }

  // Public invite share URL: https://storelink.ng/?ref=CODE
  if (pathname === "/" || pathname === "") {
    const ref = (searchParams.get("ref") || "").trim();
    if (ref) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/signup";
      url.search = "";
      url.searchParams.set("ref", ref);
      return NextResponse.redirect(url, 307);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/sell", "/sell/:path*"],
};
