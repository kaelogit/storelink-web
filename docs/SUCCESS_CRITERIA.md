# Success Criteria — StoreLink Web Rebuild

Checklist from the rebuild plan (Section 6). Use this to verify before release and after major changes.

---

## Design system

- [ ] **Tokens everywhere** — Every page uses CSS variables for color, type, radius, motion (`var(--foreground)`, `var(--radius-xl)`, etc.). No raw hex/slate-* for surfaces or text except intentional accents (e.g. orange on tools/stories).
- [ ] **Section types only** — Every section uses one of: hero, light, dark, card (via `Section` or `section-hero` / `section-light` / `section-dark` / `section-card`).
- [ ] **Brand** — Web matches app palette (emerald, violet, gold, charcoal) and typography scale.

---

## UX and consistency

- [ ] **No generic SaaS look** — Distinct voice and visual character (Nigerian context, “Commerce without fear”).
- [ ] **Shared components** — `Button`, `Card`, `Section` used across the site; `DownloadTrap` and `ShareProfileModal` use tokens.

---

## Technical

- [ ] **Routes** — All existing routes work: `/`, `/explore`, `/p/[slug]`, `/r/[id]` (and `/r/[short_code]`), `/[username]`, `/download`, tools/*, shop/*, legal, etc.
- [ ] **Performance** — LCP and FCP improved vs pre-rebuild; no render-blocking Supabase or heavy motion on critical path. Target: LCP < 2.5s.
- [ ] **Images** — Next.js `Image` with `priority` on hero only; below-fold images lazy with sensible `sizes`.

---

## Quick audit commands

- **Tokens:** `rg "var\(--" src --type-add 'web:*.{tsx,jsx}' -t web | wc -l` (should be high).
- **Sections:** `rg "section-hero|section-light|section-dark|Section variant=" src -t web` (every main page should use at least one).
- **Build:** `cd storelink-web && npm run build` (must pass).

---

## After deploy

1. Run **PageSpeed Insights** on `https://storelink.ng` (and `/explore`, `/p/[slug]`).
2. Enable **Core Web Vitals** in GA4 or use Search Console → Experience → Core Web Vitals.
3. Fix any LCP/CLS regressions (see [DEPLOY_AND_MONITOR.md](DEPLOY_AND_MONITOR.md)).
