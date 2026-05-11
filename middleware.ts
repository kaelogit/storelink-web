import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Rewrites `storelink.ng/sell/*` to the storefront deployment (Next app with `basePath: "/sell"`).
 *
 * Vercel env on **this** project only: `STOREFRONT_ORIGIN`
 * Example: `https://store-link-storefront-xxxxx.vercel.app` (scheme optional; trailing slashes stripped)
 *
 * Proxied requests must not keep the browser `Host` (e.g. storelink.ng) when the upstream URL is
 * the storefront deployment — that mismatch often returns **403** on Vercel. We set `host` to the
 * rewrite target and keep the public hostname in `x-forwarded-host` for correct absolute URLs.
 *
 * If the storefront still returns 403 (deployment protection, firewall, bot rules), set
 * `STOREFRONT_VERCEL_BYPASS_SECRET` to that project’s Protection Bypass for Automation secret.
 * @see https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
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

  let target: URL;
  try {
    target = new URL(`${pathname}${search}`, storefrontOrigin);
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

export const config = {
  matcher: ["/sell", "/sell/:path*"],
};
