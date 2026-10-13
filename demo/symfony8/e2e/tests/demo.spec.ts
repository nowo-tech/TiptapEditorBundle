import { test, expect } from '@playwright/test';

/**
 * REQ-DEMO-013 — happy-path e2e against the Tiptap editor demo.
 */
test.describe('demo happy path', () => {
  test('home lists the demo pages', async ({ page }) => {
    const response = await page.goto('/en/');
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('editor variants page mounts one editor per profile', async ({ page }) => {
    const response = await page.goto('/en/demo/configs');
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('.ProseMirror')).toHaveCount(5);
    const first = page.locator('.ProseMirror').first();
    await first.click();
    await page.keyboard.type(' e2e');
    await expect(first).toContainText('e2e');
  });
});
