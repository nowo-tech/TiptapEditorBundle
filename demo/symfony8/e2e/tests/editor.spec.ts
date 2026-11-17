import { test, expect, type Page } from '@playwright/test';

/**
 * REQ-DEMO-013 — editor behaviour in a real browser (Tiptap 3, 1.8): bubble / floating menus (Floating UI), links and
 * their rel, tables, task lists, lowlight code blocks and paste sanitising.
 */

/** HTML the widget wrote into the hidden Symfony textarea of the first editor on the page. */
async function savedHtml(page: Page): Promise<string> {
  return page.locator('[data-tiptap-root] textarea').first().inputValue();
}

async function selectFirstLine(page: Page): Promise<void> {
  await page.locator('[data-tiptap-initialized="1"]').first().waitFor();
  const editor = page.locator('.ProseMirror').first();
  await editor.focus();
  await page.keyboard.press('Control+Home');
  await page.keyboard.press('Shift+End');
  // Wait until ProseMirror has read the DOM selection (selectionchange is asynchronous).
  await expect
    .poll(() =>
      editor.evaluate((el) => (el as HTMLElement & { editor?: { state: { selection: { empty: boolean } } } }).editor?.state.selection.empty),
    )
    .toBe(false);
}

test.describe('editor behaviour', () => {
  test('menus example shows the bubble menu on a selection and the floating menu on an empty line', async ({ page }) => {
    await page.goto('/en/demo/examples/menus');
    const bubble = page.locator('.tiptap-example-bubble');
    const floating = page.locator('.tiptap-example-floating');
    await expect(bubble).toHaveCount(0);
    await expect(floating).toHaveCount(0);

    await selectFirstLine(page);
    await expect(bubble).toBeVisible();
    // Floating UI places the menu next to the editor surface, inside the widget.
    await expect(page.locator('[data-tiptap-mount] > .tiptap-example-bubble')).toHaveCount(1);
    const box = await bubble.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(0);

    await bubble.locator('[data-tiptap-menu-action="bold"]').click();
    expect(await savedHtml(page)).toMatch(/<p><strong>[^<]+<\/strong><\/p>/);

    await page.locator('.ProseMirror').first().click();
    await page.keyboard.press('Control+End');
    await page.keyboard.press('Enter');
    await expect(floating).toBeVisible();
  });

  test('links keep the rel hardening and refuse javascript: URLs', async ({ page }) => {
    await page.goto('/en/demo/examples/default-text-editor');
    const answers = ['javascript:alert(1)', 'https://example.com/e2e'];
    page.on('dialog', (dialog) => dialog.accept(answers.shift() ?? ''));

    await selectFirstLine(page);
    await page.keyboard.press('Control+k');
    await expect.poll(() => answers.length).toBe(1);
    expect(await savedHtml(page)).not.toContain('javascript');

    await selectFirstLine(page);
    await page.keyboard.press('Control+k');
    await expect.poll(() => savedHtml(page)).toContain('href="https://example.com/e2e"');
    const html = await savedHtml(page);
    expect(html).toContain('rel="noopener noreferrer nofollow"');
    expect(html).toContain('target="_blank"');
  });

  test('pasted HTML loses event handlers and javascript: URLs', async ({ page }) => {
    await page.goto('/en/demo/examples/default-text-editor');
    const editor = page.locator('.ProseMirror').first();
    await editor.click();
    await page.keyboard.press('Control+End');
    await editor.evaluate((el) => {
      const data = new DataTransfer();
      data.setData(
        'text/html',
        '<p onclick="window.__xss=1">pasted <a href="javascript:window.__xss=2" onmouseover="window.__xss=3">bad</a>' +
          ' <img src="x" onerror="window.__xss=4"></p><script>window.__xss=5</script>',
      );
      data.setData('text/plain', 'pasted bad');
      el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
    });
    await expect(editor).toContainText('pasted');
    const html = await savedHtml(page);
    expect(html).not.toMatch(/\son[a-z]+=/i);
    expect(html).not.toContain('javascript');
    expect(html).not.toContain('<script');
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });

  test('tables, task lists and syntax highlighting render', async ({ page }) => {
    await page.goto('/en/demo/examples/tables');
    await page.locator('.ProseMirror').first().click();
    await page.keyboard.press('Control+End');
    await page.locator('[data-tiptap-command="table_insert"]').first().click();
    await expect(page.locator('.ProseMirror table').last().locator('th')).toHaveCount(3);
    expect(await savedHtml(page)).toMatch(/<\/table>$/);

    await page.goto('/en/demo/examples/tasks');
    await page.locator('.ProseMirror').first().click();
    await page.locator('[data-tiptap-command="task_list"]').first().click();
    expect(await savedHtml(page)).toContain('<ul data-type="taskList">');
    // 1.8: translated checkbox name (SN-I1), and no injected <style> when the bundle stylesheet is linked (SN-I3).
    await expect(page.locator('.ProseMirror ul[data-type="taskList"] input[type="checkbox"]').first()).toHaveAttribute('aria-label', /^Task: /);
    await expect(page.locator('style[data-tiptap-style]')).toHaveCount(0);
    await expect(page.locator('.ProseMirror').first()).toHaveCSS('white-space', 'break-spaces');
    await expect(page.locator('.ProseMirror ul[data-type="taskList"] input[type="checkbox"]').first()).toBeVisible();

    await page.goto('/en/demo/examples/syntax-highlighting');
    await expect(page.locator('.ProseMirror pre [class^="hljs-"]').first()).toBeVisible();
  });
});
