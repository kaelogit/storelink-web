const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CART_STORAGE_KEY = 'storelink-web-unified-cart-v1';

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

async function testDesktopCart(browser) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  await seedCart(page);
  await page.goto(`${BASE_URL}/app`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const floatingCartButton = page.locator('button[aria-label^="Cart,"]');
  await assert((await floatingCartButton.count()) === 0, 'Desktop should hide floating cart button');

  const railCartButton = page.locator('button[aria-label="Cart"]');
  await assert((await railCartButton.count()) > 0, 'Desktop should show right-rail cart action');
  await railCartButton.first().click();

  await page.getByText('YOUR CART').first().waitFor({ timeout: 5000 });
  await page.getByRole('button', { name: /SERVICES \(/ }).click();
  await page.getByText('ALPHA SERVICE').first().waitFor({ timeout: 5000 });

  await page.getByRole('button', { name: /Remove/i }).first().click();
  await page.getByText('No services saved yet.').first().waitFor({ timeout: 5000 });

  await page.getByRole('button', { name: /PRODUCTS \(/ }).click();
  await page.getByText('ALPHA PRODUCT').first().waitFor({ timeout: 5000 });
  await page.getByRole('button', { name: /CLEAR PRODUCTS/i }).click();
  await page.getByText('No products yet.').first().waitFor({ timeout: 5000 });

  await context.close();
  return 'PASS';
}

async function testMobileCart(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await seedCart(page);
  await page.goto(`${BASE_URL}/app`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const floatingCartButton = page.locator('button[aria-label^="Cart,"]');
  await floatingCartButton.first().waitFor({ timeout: 5000 });
  await floatingCartButton.first().click();

  await page.getByText('YOUR CART').first().waitFor({ timeout: 5000 });
  await page.getByRole('button', { name: /SERVICES \(/ }).click();
  await page.getByText('ALPHA SERVICE').first().waitFor({ timeout: 5000 });
  await page.getByRole('button', { name: /CLEAR SERVICES/i }).click();
  await page.getByText('No services saved yet.').first().waitFor({ timeout: 5000 });

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
