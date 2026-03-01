# StoreLink Web (storelink.ng)

Public marketing site and shared-link landing for **StoreLink**. Users do not sign up or shop here—they are directed to the app. The site provides:

- **Shared links:** Product (`/p/[slug]`), Reel (`/r/[id]`), Profile (`/@[slug]` or `/[slug]`)
- **Explore:** Browse products by category (aligned with app)
- **Download:** App store links (configurable via env when live)
- **API:** `/api/send-email` (Resend) for app verification, welcome, order emails

## Setup

1. Copy env and fill in values:
   ```bash
   cp .env.example .env.local
   ```
2. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Optional: `REVALIDATION_SECRET`, `RESEND_API_KEY`, `SEND_EMAIL_FROM`, app store URLs, `NEXT_PUBLIC_ADMIN_APP_URL`

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Deploy to Vercel (or any Next.js host). Set environment variables in the dashboard. Production URL should be **https://storelink.ng** so the app’s `storelink.ng` links resolve here.

For deploy steps and Core Web Vitals monitoring (GA4, PageSpeed), see [docs/DEPLOY_AND_MONITOR.md](docs/DEPLOY_AND_MONITOR.md).

## Key routes

| Route | Purpose |
|-------|--------|
| `/` | Home |
| `/explore` | Product feed; `?category=fashion` etc. |
| `/p/[slug]` | Product (app share link) |
| `/r/[id]` | Reel teaser (app share link) |
| `/@[slug]`, `/[slug]` | Profile (app shares `@slug`) |
| `/download` | Get the app (App Store / Play Store when URLs set) |
| `/admin` | Redirects to admin app when `NEXT_PUBLIC_ADMIN_APP_URL` is set |
