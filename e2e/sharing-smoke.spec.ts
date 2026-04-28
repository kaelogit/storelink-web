import { test, expect } from '@playwright/test';

/**
 * Smoke: shared surfaces must not bounce guests straight to /auth/login on GET.
 * (404/not-found is acceptable when slugs are fake.)
 */
test.describe('Guest sharing surfaces', () => {
  test('public product path is not auth-wall', async ({ page }) => {
    const res = await page.goto('/p/non-existent-product-slug-storelink-e2e', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).not.toBe(302);
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test('public reel path is not auth-wall', async ({ page }) => {
    await page.goto('/r/nonexistentreelcode12345', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test('public spotlight path is not auth-wall', async ({ page }) => {
    await page.goto('/sp/00000000-0000-4000-8000-000000000000', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test('legacy spotlight redirects toward /sp', async ({ page }) => {
    const res = await page.goto('/spotlight/00000000-0000-4000-8000-000000000000', { waitUntil: 'commit' });
    expect(res?.status()).toBeLessThan(500);
    await page.waitForURL(/\/sp\//, { timeout: 10_000 }).catch(() => {});
    expect(page.url()).toMatch(/\/sp\//);
  });
});
