import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const NAV_TIMEOUT = 120000;

function log(result) {
  const { endpoint, state, status, evidence, notes = '' } = result;
  console.log(`[${status}] ${state} ${endpoint}`);
  console.log(`  evidence: ${evidence}`);
  if (notes) console.log(`  notes: ${notes}`);
}

async function exists(page, selector) {
  return (await page.locator(selector).count()) > 0;
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // Guest context checks
  const guest = await browser.newContext();
  const gpage = await guest.newPage();
  let discoveredServicePath = '/s/storelink/fb03aec6-e35f-43e5-b9fc-53f461d0eaec';
  try {
    await gpage.goto(`${BASE}/storelink`, { waitUntil: 'domcontentloaded' });
    await gpage.waitForTimeout(1500);
    const href =
      (await gpage.locator('a[href^="/s/storelink/"]:not([href*="/service/"])').first().getAttribute('href')) ||
      (await gpage.locator('a[href^="/s/storelink/service/"]').first().getAttribute('href'));
    if (href) discoveredServicePath = href;
    log({
      endpoint: '/storelink (discover service link)',
      state: 'guest',
      status: href ? 'PASS' : 'BLOCKED',
      evidence: `discoveredServicePath=${discoveredServicePath}`,
    });
  } catch (e) {
    log({
      endpoint: '/storelink (discover service link)',
      state: 'guest',
      status: 'BLOCKED',
      evidence: String(e),
    });
  }

  gpage.setDefaultNavigationTimeout(NAV_TIMEOUT);
  gpage.setDefaultTimeout(NAV_TIMEOUT);

  try {
    await gpage.goto(`${BASE}/p/michael-kors`, { waitUntil: 'domcontentloaded' });
    const current = gpage.url();
    const hasImmersive = await exists(gpage, '.min-h-screen.bg-\\(--background\\)');
    log({
      endpoint: '/p/michael-kors',
      state: 'guest',
      status: current.includes('/p/michael-kors') && hasImmersive ? 'PASS' : 'FAIL',
      evidence: `url=${current}, immersiveRoot=${hasImmersive}`,
      notes: 'Public product page should remain public for guest.',
    });

    const commentBtn = gpage.getByRole('button', { name: /comments/i }).first();
    const hasCommentBtn = (await commentBtn.count()) > 0;
    if (hasCommentBtn) {
      const beforeUrl = gpage.url();
      const dialogText = await Promise.all([
        gpage.waitForEvent('dialog', { timeout: 4000 }).then(async (d) => {
          const msg = d.message();
          await d.dismiss();
          return msg;
        }),
        commentBtn.click({ timeout: 4000 }),
      ])
        .then(([msg]) => msg)
        .catch(() => '');
      await gpage.waitForTimeout(600);
      const afterUrl = gpage.url();
      const redirectedByGuard = /\/auth\/login|\/auth\/signup|\/download/.test(afterUrl);
      log({
        endpoint: '/p/michael-kors',
        state: 'guest',
        status: dialogText.includes('requires a StoreLink account') || redirectedByGuard ? 'PASS' : 'FAIL',
        evidence: dialogText
          ? `dialog="${dialogText}"`
          : `No dialog captured; beforeUrl=${beforeUrl}, afterUrl=${afterUrl}`,
        notes: 'Protected action should prompt auth flow.',
      });
    } else {
      log({
        endpoint: '/p/michael-kors',
        state: 'guest',
        status: 'BLOCKED',
        evidence: 'Comments button not found with role selector.',
      });
    }
  } catch (e) {
    log({
      endpoint: '/p/michael-kors',
      state: 'guest',
      status: 'FAIL',
      evidence: String(e),
    });
  }

  try {
    await gpage.goto(`${BASE}${discoveredServicePath}`, { waitUntil: 'domcontentloaded' });
    await gpage.waitForTimeout(1200);
    const current = gpage.url();
    const body = ((await gpage.textContent('body')) || '').toLowerCase();
    const looks404 = body.includes('404') || body.includes('not found');
    const serviceRootVisible = await exists(gpage, '.min-h-screen.bg-\\(--background\\)');
    log({
      endpoint: discoveredServicePath,
      state: 'guest',
      status: !looks404 && serviceRootVisible ? 'PASS' : 'FAIL',
      evidence: `url=${current}, looks404=${looks404}, serviceRootVisible=${serviceRootVisible}`,
      notes: 'Legacy UUID path should resolve/redirect to canonical service path.',
    });
  } catch (e) {
    log({
      endpoint: discoveredServicePath,
      state: 'guest',
      status: 'FAIL',
      evidence: String(e),
    });
  }

  try {
    await gpage.goto(`${BASE}/explore`, { waitUntil: 'domcontentloaded' });
    await gpage.waitForTimeout(1800);
    const body = ((await gpage.textContent('body')) || '').toLowerCase();
    const hasEmptyReels = body.includes('no reels yet');
    const reelLikeCards = await gpage.locator('video, a[href*="/r/"], [class*="aspect-9/16"]').count();
    log({
      endpoint: '/explore',
      state: 'guest',
      status: !hasEmptyReels ? 'PASS' : 'FAIL',
      evidence: `emptyReels=${hasEmptyReels}, reelLikeCards=${reelLikeCards}, url=${gpage.url()}`,
      notes: 'Explore should not regress to empty state when data exists.',
    });
  } catch (e) {
    log({
      endpoint: '/explore',
      state: 'guest',
      status: 'FAIL',
      evidence: String(e),
    });
  }

  // Signed-in checks are blocked in automation without credentials/session handoff.
  // We still probe app URLs to detect auth gate behavior.
  const signedProbe = await browser.newContext();
  const spage = await signedProbe.newPage();
  spage.setDefaultNavigationTimeout(NAV_TIMEOUT);
  spage.setDefaultTimeout(NAV_TIMEOUT);

  try {
    await spage.goto(`${BASE}/app/p/michael-kors`, { waitUntil: 'domcontentloaded' });
    const url = spage.url();
    const looksAuthed = !/\/auth\/login|\/auth\/signup/.test(url);
    log({
      endpoint: '/app/p/michael-kors',
      state: 'signed-in',
      status: looksAuthed ? 'PASS' : 'BLOCKED',
      evidence: `url=${url}`,
      notes: looksAuthed
        ? 'Reached app product path.'
        : 'No authenticated session available to validate signed-in-only behavior.',
    });
  } catch (e) {
    log({
      endpoint: '/app/p/michael-kors',
      state: 'signed-in',
      status: 'FAIL',
      evidence: String(e),
    });
  }

  try {
    const appServicePath = discoveredServicePath.startsWith('/s/')
      ? `/app${discoveredServicePath}`
      : '/app/s/storelink';
    await spage.goto(`${BASE}${appServicePath}`, {
      waitUntil: 'domcontentloaded',
    });
    const url = spage.url();
    const authed = !/\/auth\/login|\/auth\/signup/.test(url);
    await spage.waitForTimeout(3500);
    const sectionText = (await spage.textContent('body')) || '';
    const hasMoreServices = sectionText.includes('More services from');
    const hasEmptyText = sectionText.includes('No other services yet.');
    const listingLocator = spage.locator('a[href*="/app/s/"], a[href*="/s/"]');
    const listingLinks = await listingLocator.count();
    const sampleLink = listingLinks > 0 ? (await listingLocator.first().getAttribute('href')) || '' : '';
    log({
      endpoint: appServicePath,
      state: 'signed-in',
      status: authed ? (hasMoreServices ? 'PASS' : 'FAIL') : 'BLOCKED',
      evidence: `url=${url}, hasMoreServicesTitle=${hasMoreServices}, hasEmptyState=${hasEmptyText}, serviceLinks=${listingLinks}, sampleServiceHref=${sampleLink}`,
      notes: authed ? '' : 'No authenticated session available for full signed-in assertions.',
    });
  } catch (e) {
    log({
      endpoint: appServicePath,
      state: 'signed-in',
      status: 'FAIL',
      evidence: String(e),
    });
  }

  try {
    await spage.goto(`${BASE}/app/explore`, { waitUntil: 'domcontentloaded' });
    await spage.waitForTimeout(2000);
    const url = spage.url();
    const authed = !/\/auth\/login|\/auth\/signup/.test(url);
    const body = ((await spage.textContent('body')) || '').toLowerCase();
    const hasEmptyReels = body.includes('no reels yet');
    const reelLikeCards = await spage.locator('video, a[href*="/app/reels/"], [class*="aspect-9/16"]').count();
    log({
      endpoint: '/app/explore',
      state: 'signed-in',
      status: authed ? (!hasEmptyReels ? 'PASS' : 'FAIL') : 'BLOCKED',
      evidence: `url=${url}, emptyReels=${hasEmptyReels}, reelLikeCards=${reelLikeCards}`,
      notes: authed ? '' : 'No authenticated session available for full signed-in assertions.',
    });
  } catch (e) {
    log({
      endpoint: '/app/explore',
      state: 'signed-in',
      status: 'FAIL',
      evidence: String(e),
    });
  }

  await guest.close();
  await signedProbe.close();
  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

