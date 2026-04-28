const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const QA_OUT = path.join(__dirname, '..', 'qa-runtime-output');
const CART_STORAGE_KEY = 'storelink-web-unified-cart-v1';
const TEST_EMAIL = process.env.TEST_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeSeededCartState() {
  return {
    state: {
      products: [
        {
          product_id: 'prod-a',
          name: 'Alpha Product',
          price: 5000,
          currency_code: 'NGN',
          quantity: 1,
          seller_id: 'seller-1',
          seller_slug: 'demo-seller',
        },
      ],
      services: [
        {
          service_listing_id: 'svc-a',
          title: 'Alpha Service',
          hero_price: 8000,
          currency_code: 'NGN',
          seller_id: 'seller-1',
          seller_slug: 'demo-seller',
          seller_name: 'Demo Seller',
        },
      ],
    },
    version: 0,
  };
}

async function seedCart(page) {
  const seeded = JSON.stringify(makeSeededCartState());
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: CART_STORAGE_KEY, value: seeded }
  );
}

async function loginIfConfigured(page) {
  if (!TEST_EMAIL || !TEST_PASSWORD) return false;
  await page.goto(`${BASE_URL}/auth/login?next=${encodeURIComponent('/app')}`, { waitUntil: 'networkidle' });
  await page.getByPlaceholder('Email address').fill(TEST_EMAIL);
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForTimeout(1500);
  await page.goto(`${BASE_URL}/app`, { waitUntil: 'networkidle' });
  return true;
}

async function testAuthPages(browser) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const paths = ['/auth/login', '/auth/signup', '/auth/verify?email=test@example.com'];

  for (const path of paths) {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    assert(errors.length === 0, `Auth page crashed: ${path} => ${errors.join(' | ')}`);
    assert((await page.title()).length > 0, `Auth page did not render title: ${path}`);
  }

  await context.close();
  return 'PASS';
}

async function waitCartShell(page) {
  await page.waitForFunction(
    () => {
      const t = document.body?.innerText || '';
      return t.includes('Sign in required') || t.includes('YOUR CART');
    },
    null,
    { timeout: 45000 },
  );
}

async function testDesktopCart(browser) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  await seedCart(page);
  await loginIfConfigured(page);
  await page.goto(`${BASE_URL}/app/cart`, { waitUntil: 'domcontentloaded' });
  await waitCartShell(page);
  await page.waitForTimeout(400);

  const guestGate = page.getByText('Sign in required');
  if ((await guestGate.count()) > 0) {
    try {
      fs.mkdirSync(QA_OUT, { recursive: true });
      await page.screenshot({ path: path.join(QA_OUT, 'web-cart-desktop-guest.png'), fullPage: true });
    } catch (_) {}
    await context.close();
    return 'SKIPPED_AUTH_REQUIRED';
  }

  const floatingCartButton = page.locator('button[aria-label^="Cart,"]');
  await assert((await floatingCartButton.count()) === 0, 'Desktop should hide floating cart button');

  await page.getByText('YOUR CART').first().waitFor({ timeout: 20000 });
  await page.getByRole('button', { name: /SERVICES \(/ }).click();
  await page.getByText('ALPHA SERVICE').first().waitFor({ timeout: 5000 });

  await page.getByRole('button', { name: /Remove/i }).first().click();
  await page.getByText('No services saved yet.').first().waitFor({ timeout: 5000 });

  await page.getByRole('button', { name: /PRODUCTS \(/ }).click();
  await page.getByText('ALPHA PRODUCT').first().waitFor({ timeout: 5000 });
  await page.getByRole('button', { name: /CLEAR PRODUCTS/i }).click();
  await page.getByText('No products yet.').first().waitFor({ timeout: 5000 });

  try {
    fs.mkdirSync(QA_OUT, { recursive: true });
    await page.screenshot({ path: path.join(QA_OUT, 'web-cart-desktop-pass.png'), fullPage: true });
  } catch (_) {}

  await context.close();
  return 'PASS';
}

async function testMobileCart(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await seedCart(page);
  await loginIfConfigured(page);
  await page.goto(`${BASE_URL}/app/cart`, { waitUntil: 'domcontentloaded' });
  await waitCartShell(page);
  await page.waitForTimeout(400);

  const guestGate = page.getByText('Sign in required');
  if ((await guestGate.count()) > 0) {
    try {
      fs.mkdirSync(QA_OUT, { recursive: true });
      await page.screenshot({ path: path.join(QA_OUT, 'web-cart-mobile-guest.png'), fullPage: true });
    } catch (_) {}
    await context.close();
    return 'SKIPPED_AUTH_REQUIRED';
  }

  await page.getByText('YOUR CART').first().waitFor({ timeout: 20000 });
  await page.getByRole('button', { name: /SERVICES \(/ }).click();
  await page.getByText('ALPHA SERVICE').first().waitFor({ timeout: 5000 });
  await page.getByRole('button', { name: /CLEAR SERVICES/i }).click();
  await page.getByText('No services saved yet.').first().waitFor({ timeout: 5000 });

  try {
    fs.mkdirSync(QA_OUT, { recursive: true });
    await page.screenshot({ path: path.join(QA_OUT, 'web-cart-mobile-pass.png'), fullPage: true });
  } catch (_) {}

  await context.close();
  return 'PASS';
}

async function testGuardRoute(browser) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/s/demo-seller/service/svc-a`, { waitUntil: 'domcontentloaded' });
  const finalUrl = page.url();
  await context.close();
  return finalUrl;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const report = {};
  try {
    report.authPages = await testAuthPages(browser);
    report.desktopCart = await testDesktopCart(browser);
    report.mobileCart = await testMobileCart(browser);
    report.guardRouteUrl = await testGuardRoute(browser);
    report.notes = TEST_EMAIL
      ? 'Attempted authenticated cart runtime checks using TEST_EMAIL/TEST_PASSWORD.'
      : 'Cart runtime checks require authenticated /app access; set TEST_EMAIL and TEST_PASSWORD to run full flow.';
    report.screenshotsDir = QA_OUT;

    console.log('RUNTIME_CHECK_RESULT');
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('RUNTIME_CHECK_FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
