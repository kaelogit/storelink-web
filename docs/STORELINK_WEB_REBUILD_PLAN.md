# StoreLink Web — Full A–Z Rebuild Plan

**Goal:** Rebuild the marketing site so it feels **unique, high-end, and as polished as the StoreLink app**. Every file and section gets attention; performance and visual consistency with the app are non‑negotiable.

---

## 1. Why It Feels “Not High-End” (Diagnosis)

| Issue | Where it shows | Fix direction |
|-------|----------------|----------------|
| **Generic stack look** | Inter + Space Grotesk, default Tailwind spacing/radius | Distinct typography (match app weight/scale), custom radius & spacing tokens |
| **Inconsistent section DNA** | Some sections light mesh, some dark, no clear rhythm | One design system: section variants (hero / light / dark / band) with strict tokens |
| **Heavy hero, thin rest** | Hero has phone + parallax + feed; inner pages feel like “another SaaS” | Every page gets a clear visual hook and section backgrounds from the system |
| **No single “StoreLink” character** | Could be any startup | Lock to app palette (emerald #10B981, violet #8B5CF6, gold accents, charcoal), app-like typography scale |
| **Performance** | Framer Motion + Supabase on hero, big images | Route-level code split, lazy hero, optimize images, critical CSS |
| **Copy and hierarchy** | Mixed voice, similar weight everywhere | Clear H1/H2/body/caption scale; one voice (confident, Nigerian, safe) |

---

## 2. Design System (Align With App)

### 2.1 Tokens (implement in `globals.css` + `tailwind.config.ts`)

- **Colors** (from app `Colors.ts`):
  - **Brand:** `--emerald: #10B981`, `--violet: #8B5CF6`, `--gold: #F59E0B` (coins/rewards)
  - **Neutrals:** `--charcoal: #111827`, `--pitch-black: #000000`, surfaces and borders from slate scale
- **Typography** (from app `Typography.ts`):
  - **Scale:** caption (10–12px), body (13–15px), subtitle (18px), title (24px), heading (28px), display (36–48px)
  - **Weights:** regular 400, medium 500, semibold 600, bold 700, heavy 800, black 900
  - **Font stack:** Keep Inter for body; consider one display font that feels more “app” (e.g. same as app or a close web sibling) and use it for headlines only
- **Radius:** `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`, `--radius-3xl` (no random rounded-[18px])
- **Motion:** One easing curve (e.g. `out-expo`), consistent duration scale (150 / 250 / 400ms)

### 2.2 Section system

- **Hero:** Full-bleed dark (#050505 / pitch black), emerald/violet glow, grid/noise, one clear headline + CTA + device or feed preview.
- **Light:** `section-bg-light` — soft gradient (e.g. slate-50 → white → emerald-50/5), optional orb.
- **Dark band:** `section-bg-dark` — charcoal/pitch, emerald accent, optional spotlight.
- **Card band:** White or slate-50, cards with consistent radius and shadow from tokens.

Use only these section types so the whole site feels like one product.

---

## 3. File-by-File Rebuild Checklist

### Phase A — Foundation (global + layout)

| File | What to do |
|------|------------|
| `src/app/globals.css` | Replace with token-based system: CSS variables for color, type scale, radius, motion; section classes (hero/light/dark/card); utilities (no-scrollbar, custom-scrollbar, selection); remove duplicate or one-off backgrounds. |
| `tailwind.config.ts` | Extend theme from CSS variables; add only the animations you keep; ensure content paths include all of `src`. |
| `src/app/layout.tsx` | Apply font variables and token classes; keep GA and JSON-LD; optional: add a minimal “skip to content” and improve focus states for a11y. |

### Phase B — Home page (one section per component)

| File | What to do |
|------|------------|
| `src/app/page.tsx` | Compose sections in order; no inline styles; use section classes from globals; ensure semantic `<section>` + headings hierarchy. |
| `src/components/home/Navbar.tsx` | Token-based colors and typography; same breakpoints and dropdown behavior; ensure mobile menu uses same tokens; add aria where needed. |
| `src/components/home/Hero.tsx` | Simplify: one strong headline, one subline, two CTAs, one device/feed preview; lazy-load below-fold or heavy motion; fetch products in a client component that doesn’t block first paint; use section-bg-hero. |
| `src/components/home/SocialProofStrip.tsx` | Use tokens; optional marquee; keep compact. |
| `src/components/home/Comparison.tsx` | Clear table or cards; tokens only; good heading hierarchy. |
| `src/components/home/SellerFeatures.tsx` | Grid of feature cards; icon + title + short copy; section-bg-light or card. |
| `src/components/home/TheFeed.tsx` | Match app “feed” feel (cards, typography); tokens; optional lazy images. |
| `src/components/home/HowItWorks.tsx` | Steps with numbers; tokens; section-bg-light or card. |
| `src/components/home/StoreCoins.tsx` | Gold accent from tokens; one clear value prop. |
| `src/components/home/FAQ.tsx` | Accordion with token typography and radius. |
| `src/components/home/FinalCTA.tsx` | One bold CTA block; section-bg-dark + emerald. |
| `src/components/home/Footer.tsx` | Token colors and typography; links and tag cloud; same column layout, cleaner spacing. |

### Phase C — Inner pages (every page gets the system)

| Page | What to do |
|------|------------|
| `src/app/download/page.tsx` + `DownloadContent.tsx` | Use section system; store badges and copy in tokens; one primary CTA. |
| `src/app/explore/page.tsx` + wrappers | Grid/list from design system; filters with token form styles; `WebProductCard` with consistent radius and shadow. |
| `src/app/pricing/page.tsx` | Already structured; restyle with tokens only (cards, buttons, table); keep calculator logic. |
| `src/app/about-us/page.tsx` | One hero line + sections (story, values, team or stats); section system. |
| `src/app/contact/page.tsx` | Form with token inputs and buttons; optional map or support strip. |
| `src/app/safety/page.tsx` | Trust content; section-bg-light/dark and cards. |
| `src/app/help-center/page.tsx` | Search + categories; token typography and cards. |
| `src/app/blog/page.tsx` | List + optional featured; card style from system. |
| `src/app/careers/page.tsx` | Open roles; card list from system. |
| `src/app/press/page.tsx` | Press list or links; tokens. |
| `src/app/community/page.tsx` | Single concept or CTA; section system. |
| `src/app/privacy/page.tsx` | Legal layout; typography and spacing from tokens. |
| `src/app/terms/page.tsx` | Same as privacy. |
| `src/app/[username]/page.tsx` + `ClientProfileWrapper` | Profile layout aligned with app (avatar, name, bio, products); tokens. |
| `src/app/r/[id]/page.tsx` + `ClientReelWrapper` | Reel view (video or image + meta); tokens. |
| `src/app/p/[slug]/page.tsx` + `ClientProductWrapper` | Product detail (images, price, seller); tokens. |
| `src/app/tools/*` (studio, stories, community, ai) | One sublayout or shared “Tools” wrapper; each page: short hero + value prop + CTA; tokens. |
| `src/app/shop/*` (video, rewards, flash) | Same idea: hero + benefits + CTA; tokens. |
| `src/app/admin/page.tsx` | Redirect or minimal “Admin” CTA; token styling if any UI. |

### Phase D — Shared components and UI

| File | What to do |
|------|------------|
| `src/components/shared/ShareProfileModal.tsx` | Token modal (overlay, panel, buttons). |
| `src/components/ui/DownloadTrap.tsx` | Token buttons and copy. |
| **New** `src/components/ui/Button.tsx` | Primary, secondary, ghost variants from tokens. |
| **New** `src/components/ui/Card.tsx` | Container with radius and shadow from tokens. |
| **New** `src/components/ui/Section.tsx` | Wrapper that applies section-bg-hero / light / dark / card + padding. |

### Phase E — Performance and polish

| Area | What to do |
|------|------------|
| **Images** | Use Next.js `Image` everywhere; explicit width/height or fill; priority on hero only; rest lazy. |
| **Fonts** | Preload critical font; `display: swap`; subset if possible. |
| **JS** | Dynamic import for below-fold or heavy components (e.g. Hero phone preview, Framer sections). |
| **Supabase** | Don’t block first paint; fetch in client after mount or in a server component that doesn’t delay shell. |
| **Critical CSS** | Ensure above-the-fold section + nav use minimal CSS; no unused Tailwind in critical path. |
| **LCP** | Hero text and primary CTA visible without waiting for images or feed data. |

---

## 4. What “Unique” and “High-End” Mean Here

- **Unique:** Only StoreLink uses this exact combo: app-matching palette (emerald + violet + gold), Nigerian context (NGN, “Commerce without fear”), and the same typography/weight scale as the app.
- **High-end:** Consistent spacing and radius, no one-off gradients, clear hierarchy (one H1 per page, clear H2s), subtle motion (one easing, short durations), and fast load (LCP < 2.5s target).

---

## 5. Suggested Order of Work

1. **Phase A** — globals.css + tailwind.config + layout (tokens and section system live).
2. **Phase B** — Home: Navbar, Hero, then remaining home sections one by one.
3. **Phase D** — Add `Button`, `Card`, `Section` and use them on home and pricing.
4. **Phase C** — Inner pages in batches: download + explore; pricing (already done with tokens); about, contact, safety, help-center; then legal; then profile/reel/product; then tools and shop.
5. **Phase E** — Performance pass: images, fonts, code-split, measure LCP and fix.

---

## 6. Success Criteria

- [ ] Every page uses only tokens (color, type, radius, motion).
- [ ] Every section uses one of the four section types (hero / light / dark / card).
- [ ] Web feels like the same brand as the StoreLink app (palette + typography).
- [ ] No “generic SaaS” look: distinct voice and visual character.
- [ ] LCP and FCP improved vs current; no render-blocking Supabase or heavy motion on critical path.
- [ ] All existing routes still work; new shared components (`Button`, `Card`, `Section`) used across the site.

---

This plan is the blueprint to make StoreLink Web **as polished and recognizable as the StoreLink app**, with one design system, consistent sections, and better performance from A to Z.
