import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * REQ-DEMO-013 — the "Editor variants" demo page: every profile (full, simple,
 * notion, agent, headless) rendered in situ with its title and hint.
 */
const outDir = process.env.SCREENSHOT_DIR
  ? resolve(process.env.SCREENSHOT_DIR)
  : resolve(__dirname, '../../../../docs/images/demo');

test.beforeAll(() => {
  mkdirSync(outDir, { recursive: true });
});

test.describe('feature screenshots', () => {
  test('editor variants', async ({ page }) => {
    await page.goto('/en/demo/configs');
    await expect(page.locator('.ProseMirror')).toHaveCount(5);
    // Hide dev-only chrome (Symfony WebProfiler toolbar) from the capture.
    await page.addStyleTag({ content: '.sf-toolbar, .sf-minitoolbar, .sf-toolbar-block { display: none !important; }' });
    const panel = page.locator('body > .container.py-4, body > div.container').filter({ has: page.locator('h1') }).first();
    await expect(panel).toBeVisible();
    await page.waitForTimeout(500);
    await panel.screenshot({ path: resolve(outDir, 'demo-editor-variants.png') });
  });
});
