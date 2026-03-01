# Deploy and Monitor — StoreLink Web

## Before you deploy

1. **Build:** From repo root or `storelink-web`: `npm run build` (must succeed).
2. **Success criteria:** See [SUCCESS_CRITERIA.md](SUCCESS_CRITERIA.md) for a quick token/section audit.
3. **Env:** Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set (and any server-side keys if used).

---

## Deploy

### Vercel (recommended)

1. Connect the repo (e.g. `storelink-app-and-web` or the `storelink-web` folder as root) to Vercel.
2. Set **Root Directory** to `storelink-web` if the repo is monorepo.
3. **Environment variables:** add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and any server-side Supabase keys if used).
4. Deploy. Use **Production** branch (e.g. `main`).

### Build and run locally (production mode)

```bash
cd storelink-web
npm run build
npm run start
```

---

## Core Web Vitals (CWV) in Google Analytics 4

1. **GA4 property** — Ensure the site has the GA4 ID in layout (e.g. `G-LC8PN9CT62` via `@next/third-parties/google`).
2. **Enable CWV in GA4:**
   - Admin → Data display → **Engagement** → **Events** (or use the **Web Vitals** report if available).
   - Or use **Google Search Console** → **Experience** → **Core Web Vitals** for real-user data once the site is indexed.
3. **Optional: send CWV from the app** using the [web-vitals](https://www.npmjs.com/package/web-vitals) library and `gtag('event', ...)` for `LCP`, `FID`, `CLS`, etc., so they appear as custom events in GA4.

### Quick check after deploy

- **PageSpeed Insights:** https://pagespeed.web.dev/ → enter `https://storelink.ng` (or your deployed URL).
- **Chrome DevTools:** Lighthouse tab → run Performance (and optionally Accessibility, Best practices).

---

## Fixing regressions

- **LCP worse:** Ensure hero image uses `priority`, TheFeed (and other heavy sections) are dynamically imported, and fonts use `display: swap` + preconnect.
- **CLS:** Give dynamic sections a minimal height in their `loading` placeholder; avoid inserting content above the fold after first paint.
- **FID / INP:** Reduce main-thread work (fewer synchronous scripts, smaller bundles via code-split).

Run Lighthouse on a few key routes (home, explore, `/p/[slug]`) after each major change.
