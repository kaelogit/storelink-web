# Deep links & “open in app” — StoreLink

## 1. User **has** the app installed → tap shared link

**Intended behavior:** Tapping a shared link (e.g. from WhatsApp) to `https://storelink.ng/p/slug`, `/r/short_code`, or `/@username` should open the **app** directly to that product, reel, or profile — not the website.

### What’s in place

- **App (iOS):** `associatedDomains`: `applinks:storelink.ng` in `app.json`.
- **App (Android):** `intentFilters` for `https://storelink.ng` with `pathPrefix: "/"` in `app.json`.
- **Web:** Serves the link files so the OS can associate the domain with the app:
  - **iOS:** `public/.well-known/apple-app-site-association` (AASA).
  - **Android:** `public/.well-known/assetlinks.json`.

### What you must do

1. **Replace placeholders in the well-known files**
   - **AASA:** In `public/.well-known/apple-app-site-association`, replace `TEAM_ID` with your Apple Team ID (e.g. `ABCDE12345` → `appID`: `ABCDE12345.com.storelink.mobile`).
   - **Asset links:** In `public/.well-known/assetlinks.json`, replace `REPLACE_WITH_SHA256_FINGERPRINT_OF_YOUR_APP_SIGNING_KEY` with the SHA256 fingerprint of your **Android app signing key** (release). You can get it with:
     ```bash
     keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
     ```
     Use the “SHA256:” line (with colons, or strip colons depending on what you use).

2. **Deploy the web app** so `https://storelink.ng/.well-known/apple-app-site-association` and `https://storelink.ng/.well-known/assetlinks.json` are reachable (no redirects, HTTPS).

3. **Handle the URL inside the app** when the OS opens it. Right now the app does **not** yet read the incoming URL and navigate to the matching screen. You need one of:
   - **Expo Router:** A `+native-intent.tsx` that implements `redirectSystemPath` and maps:
     - `/p/:slug` → resolve product by slug (e.g. Supabase) then go to `/product/[id]`
     - `/r/:shortCodeOrId` → go to reel (e.g. `reels/feed` with that reel as initial)
     - `/@:slug` or `/:slug` (profile) → resolve profile by slug then go to `/u/[id]`
   - Or a root-level effect that uses `Linking.getInitialURL()` (and optionally `Linking.addEventListener('url', ...)`) and does the same resolution + navigation.

Until this app-side handling is implemented, the OS may open the app when the user taps the link, but the app will not automatically show the product/reel/profile — it will show the default screen (e.g. home or login).

---

## 2. User **does not** have the app → tap shared link → install → land on same link

**Intended behavior:** User taps link → website → “Get the app” → App Store / Play Store → install & sign up → **then** they can open the **same** shared link and land on that product/reel/profile.

### What’s in place

- **Web:** Shared links go to the **website** (e.g. `https://storelink.ng/p/slug`). The site shows the product/reel/profile and an “Open in app” / “Get the app” flow.
- **Web:** “Get the app” uses `/download?intent=/p/slug` (or `/r/...`, `/@...`). The download page stores `intent` in `sessionStorage` and shows store buttons. So the **browser** “remembers” the intent only for that session.
- **App:** No use of that stored intent yet (the app never reads the website’s sessionStorage).

### How “land on the link after install” works today

- **Recommended flow:** After installing, the user taps the **same** shared link again (e.g. from WhatsApp). The OS then opens the **app** with that URL (once Universal Links / App Links are set up and URL handling is implemented as above). So they “land on the link” by opening the same link post-install.
- The download page already says: *“After you install the app, open it to continue to the page you were viewing.”* You can make this more explicit: *“After installing, tap this link again to open it in the app.”* (and optionally re-use the same shared URL in the copy).

### Optional: true deferred deep link (no second tap)

To open the app **once** after first launch and go straight to the product/reel/profile **without** the user tapping the link again, you need a **deferred deep link** provider that passes the intent through the install (e.g. Branch, Firebase Dynamic Links, or a custom backend that stores intent by device/install and is read by the app on first launch). That is not implemented here; the current design relies on “tap the same link again after install.”

---

## Summary

| Scenario | Status |
|----------|--------|
| App installed → tap link → open in app | **Needs:** (1) Replace AASA/assetlinks placeholders and deploy, (2) Implement URL handling in the app (e.g. `+native-intent` or `Linking.getInitialURL` + navigate). |
| No app → tap link → website → download | **Works:** Link opens website, download page with intent is there. |
| After install → land on same link | **Works** once (1) and (2) are done: user taps the **same** link again → app opens with URL → app navigates to product/reel/profile. |

Replace `TEAM_ID` and the Android fingerprint, deploy the well-known files, then implement in-app URL handling to get the full “open in app” and “land on link after install” behavior.
