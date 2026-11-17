/**
 * Widget behaviour of `tiptap-editor.ts`: profile parsing, toolbar wiring, Notion / example menus, prompts,
 * theme handling, host hooks (upload / suggestion) and lifecycle helpers, on real Tiptap editors (happy-dom).
 */

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SuggestionEditor } from './suggestion';
import type { UploadAnchor, UploadInserter } from './upload';

const uploadSpy = vi.hoisted(() => vi.fn());
const suggestionSpy = vi.hoisted(() => vi.fn());
const disposeSpy = vi.hoisted(() => vi.fn());

vi.mock('./upload', async (importOriginal) => {
  const original = await importOriginal<typeof import('./upload')>();
  return {
    ...original,
    attachUploadHook: (...args: unknown[]) => {
      uploadSpy(...args);
      return { last: () => Promise.resolve() };
    },
  };
});

vi.mock('./suggestion', async (importOriginal) => {
  const original = await importOriginal<typeof import('./suggestion')>();
  return {
    ...original,
    attachSuggestionHook: (...args: unknown[]) => {
      suggestionSpy(...args);
      return { dispose: disposeSpy };
    },
  };
});

const {
  applyChromeTheme,
  destroyTiptapRoot,
  initTiptapRoot,
  readPromptLabels,
  runIframePrompt,
  runInit,
  runInitAndObserve,
  syncTiptapTextareasIn,
} = await import('./tiptap-editor');

type RootOptions = Record<string, string>;

/** Builds the markup rendered by the form theme (chrome + mount + hidden textarea). */
function makeRoot(data: RootOptions = {}, value = '<p>Hello world</p>', withChrome = true): HTMLElement {
  const root = document.createElement('div');
  root.setAttribute('data-tiptap-root', '1');
  for (const [key, val] of Object.entries(data)) {
    root.dataset[key] = val;
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  root.appendChild(textarea);
  const mount = document.createElement('div');
  mount.setAttribute('data-tiptap-mount', '');
  if (withChrome) {
    const chrome = document.createElement('div');
    chrome.className = 'tiptap-editor-chrome';
    chrome.appendChild(mount);
    root.appendChild(chrome);
  } else {
    root.appendChild(mount);
  }
  document.body.appendChild(root);
  return root;
}

function editorOf(root: HTMLElement): Editor {
  const dom = root.querySelector('.ProseMirror') as (HTMLElement & { editor?: Editor }) | null;
  if (!dom?.editor) {
    throw new Error('editor not mounted');
  }
  return dom.editor;
}

/** The bubble / floating menu elements (Tiptap detaches them from the root until shown). */
function menuElements(editor: Editor): HTMLElement[] {
  return ['bubbleMenu', 'floatingMenu'].map(
    (name) => (editor.extensionManager.extensions.find((ext) => ext.name === name)?.options as { element: HTMLElement }).element,
  );
}

function clickAll(buttons: Iterable<HTMLElement>): void {
  for (const button of buttons) {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }
}

function toolbarButtons(root: HTMLElement): HTMLButtonElement[] {
  return Array.from(root.querySelectorAll<HTMLButtonElement>('.tiptap-editor-toolbar__btn'));
}

beforeEach(() => {
  uploadSpy.mockReset();
  suggestionSpy.mockReset();
  disposeSpy.mockReset();
  // happy-dom has no native dialogs: install mocks.
  window.prompt = vi.fn(() => null);
  window.alert = vi.fn();
});

afterEach(() => {
  for (const root of Array.from(document.querySelectorAll<HTMLElement>('[data-tiptap-root]'))) {
    destroyTiptapRoot(root);
  }
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('initTiptapRoot', () => {
  it('labels the toolbar buttons and draws icons in icon mode (1.7)', () => {
    const root = makeRoot({
      tiptapToolbarValue: '1',
      tiptapToolbarDisplayValue: 'icon',
      tiptapToolbarLabelsValue: JSON.stringify({ toolbar: 'Formato', bold: 'Negrita' }),
    });
    initTiptapRoot(root);

    const bar = root.querySelector('.tiptap-editor-toolbar') as HTMLElement;
    expect(bar.getAttribute('aria-label')).toBe('Formato');
    expect(bar.classList.contains('tiptap-editor-toolbar--icon')).toBe(true);
    const bold = toolbarButtons(root).find((b) => b.dataset.tiptapCommand === 'bold') as HTMLButtonElement;
    expect([bold.title, bold.getAttribute('aria-label'), bold.getAttribute('aria-pressed')]).toEqual(['Negrita', 'Negrita', 'false']);
    expect(bold.querySelector('svg')).not.toBeNull();
    const undo = toolbarButtons(root).find((b) => b.dataset.tiptapCommand === 'undo') as HTMLButtonElement;
    expect(undo.getAttribute('aria-label')).toBe('Undo');
    expect(undo.hasAttribute('aria-pressed')).toBe(false);

    editorOf(root).chain().selectAll().toggleBold().run();
    expect(bold.getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps the 1.x text glyphs by default (1.7)', () => {
    const root = makeRoot({ tiptapToolbarValue: '1' });
    initTiptapRoot(root);

    const bar = root.querySelector('.tiptap-editor-toolbar') as HTMLElement;
    expect(bar.hasAttribute('aria-label')).toBe(false);
    const bold = toolbarButtons(root).find((b) => b.dataset.tiptapCommand === 'bold') as HTMLButtonElement;
    expect([bold.textContent, bold.getAttribute('aria-label')]).toEqual(['B', 'Bold']);
  });

  it('skips roots without textarea or mount and is idempotent', () => {
    const empty = document.createElement('div');
    initTiptapRoot(empty);
    expect(empty.dataset.tiptapInitialized).toBeUndefined();

    const root = makeRoot();
    initTiptapRoot(root);
    const editor = editorOf(root);
    initTiptapRoot(root);
    expect(editorOf(root)).toBe(editor);
    expect(root.dataset.tiptapInitialized).toBe('1');
  });

  it('falls back to the default variant, empty content and default sizes', () => {
    const root = makeRoot({ tiptapVariantValue: 'unknown', tiptapExampleValue: 'nope' }, '');
    initTiptapRoot(root);
    expect(root.classList.contains('tiptap-variant-default')).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-tiptap-mount]')?.style.minHeight).toBe('240px');
    expect(root.querySelector('textarea')?.value).toBe('<p></p>');
  });

  it('syncs the textarea on every update and on form submit', () => {
    const form = document.createElement('form');
    const root = makeRoot({ tiptapMinHeightValue: '100px', tiptapPlaceholderValue: 'Write…', tiptapDebugValue: 'true' });
    form.appendChild(root);
    document.body.appendChild(form);
    initTiptapRoot(root);
    const editor = editorOf(root);
    const textarea = root.querySelector('textarea') as HTMLTextAreaElement;

    editor.commands.setContent('<p>Changed</p>', { emitUpdate: true });
    expect(textarea.value).toBe('<p>Changed</p>');

    textarea.value = 'stale';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(textarea.value).toBe('<p>Changed</p>');

    // Submit events from non-form targets are ignored.
    textarea.value = 'stale';
    root.dispatchEvent(new Event('submit', { bubbles: true }));
    expect(textarea.value).toBe('stale');
    syncTiptapTextareasIn(form);
    expect(textarea.value).toBe('<p>Changed</p>');

    // A root whose textarea was removed is skipped.
    textarea.remove();
    expect(() => syncTiptapTextareasIn(form)).not.toThrow();
  });

  it('wires every toolbar button for each variant preset', () => {
    for (const variant of ['default', 'simple', 'notion', 'agent', 'headless']) {
      const root = makeRoot({ tiptapVariantValue: variant, tiptapToolbarValue: '1' }, '<h1>Title</h1><p>Some text</p>', variant !== 'headless');
      initTiptapRoot(root);
      const editor = editorOf(root);
      editor.commands.selectAll();
      const buttons = toolbarButtons(root);
      expect(buttons.length).toBeGreaterThan(5);
      clickAll(buttons);
      clickAll(buttons);
      expect(root.querySelector('[role="toolbar"]')).not.toBeNull();
    }
  });

  it('renders the agent badge and the assistant button', () => {
    const root = makeRoot({ tiptapVariantValue: 'agent', tiptapToolbarValue: '1' });
    initTiptapRoot(root);
    expect(root.querySelector('.tiptap-editor-toolbar__badge')?.textContent).toBe('Agent');
    const fab = root.querySelector<HTMLButtonElement>('.tiptap-editor-agent-fab');
    expect(fab).not.toBeNull();
    fab?.click();
    expect(window.alert).toHaveBeenCalledOnce();

    const bare = makeRoot({ tiptapVariantValue: 'agent' }, '<p>x</p>', false);
    initTiptapRoot(bare);
    expect(bare.classList.contains('tiptap-editor-surface--fab')).toBe(true);
  });

  it('prepends the toolbar when the mount is not inside the chrome', () => {
    const root = makeRoot({ tiptapToolbarValue: '1' }, '<p>x</p>', false);
    const chrome = document.createElement('div');
    chrome.className = 'tiptap-editor-chrome';
    chrome.appendChild(document.createElement('span'));
    root.appendChild(chrome);
    initTiptapRoot(root);
    expect(chrome.firstElementChild?.classList.contains('tiptap-editor-toolbar')).toBe(true);
  });

  it('wires every toolbar button for each example recipe', () => {
    const examples = [
      'formatting',
      'images',
      'long_text',
      'markdown_shortcuts',
      'minimal',
      'tables',
      'tasks',
      'text_direction_rtl',
      'menus',
      'syntax_highlighting',
    ];
    for (const example of examples) {
      const root = makeRoot({ tiptapExampleValue: ` ${example.toUpperCase()} `, tiptapToolbarValue: '1' });
      initTiptapRoot(root);
      expect(root.classList.contains(`tiptap-example-${example}`)).toBe(true);
      editorOf(root).commands.selectAll();
      clickAll(toolbarButtons(root));
    }
  });

  it('renders the character count and RTL attributes', () => {
    const counted = makeRoot({ tiptapExampleValue: 'long_text' }, '<p>one two</p>');
    initTiptapRoot(counted);
    expect(counted.querySelector('.tiptap-editor-charcount')?.textContent).toContain('7');

    const bare = makeRoot({ tiptapExampleValue: 'long_text' }, '<p>x</p>', false);
    initTiptapRoot(bare);
    expect(bare.querySelector('.tiptap-editor-charcount')).not.toBeNull();

    const rtl = makeRoot({ tiptapExampleValue: 'text_direction_rtl' });
    initTiptapRoot(rtl);
    expect(rtl.querySelector('.ProseMirror')?.getAttribute('dir')).toBe('rtl');
  });

  it('wires the example bubble / floating menus', () => {
    for (const withChrome of [true, false]) {
      const root = makeRoot({ tiptapExampleValue: 'menus' }, '<p>Hello world</p>', withChrome);
      initTiptapRoot(root);
      const editor = editorOf(root);
      editor.commands.focus();
      editor.commands.setTextSelection({ from: 1, to: 6 });
      const [bubble, floating] = menuElements(editor);
      expect(bubble?.classList.contains('tiptap-example-bubble')).toBe(true);
      expect(floating?.classList.contains('tiptap-example-floating')).toBe(true);
      const actions = bubble?.querySelectorAll<HTMLButtonElement>('[data-tiptap-menu-action]') ?? [];
      expect(actions).toHaveLength(3);
      clickAll(actions);
      expect(editor.getHTML()).toContain('<strong><em><s>Hello</s></em></strong>');
      editor.commands.setContent('<p>Fresh</p>');
      editor.commands.setTextSelection(1);
      editor.commands.setContent('<pre><code>code</code></pre>');
      editor.commands.setTextSelection({ from: 1, to: 3 });
    }
  });

  it('names the Notion menu buttons with the translated labels (1.7)', () => {
    const root = makeRoot({ tiptapVariantValue: 'notion', tiptapToolbarLabelsValue: JSON.stringify({ bold: 'Negrita "N"', insert: 'Insertar' }) });
    initTiptapRoot(root);
    const [bubble, floating] = menuElements(editorOf(root));
    const bold = bubble.querySelector('[data-tiptap-notion-action="bold"]') as HTMLButtonElement;
    expect([bold.title, bold.getAttribute('aria-label')]).toEqual(['Negrita "N"', 'Negrita "N"']);
    expect(bubble.querySelector('[data-tiptap-notion-action="link"]')?.getAttribute('aria-label')).toBe('Link (Ctrl+K)');
    expect(floating.querySelector('.tiptap-notion-floating__hint')?.textContent).toBe('Insertar');
    expect(floating.querySelector('[data-tiptap-notion-action="embed"]')?.getAttribute('title')).toBe('Embed');
  });

  it('wires the Notion bubble / floating menus', () => {
    for (const withChrome of [true, false]) {
      const root = makeRoot({ tiptapVariantValue: 'notion' }, '<p>Hello world</p>', withChrome);
      initTiptapRoot(root);
      const editor = editorOf(root);
      editor.commands.focus();
      editor.commands.setTextSelection({ from: 1, to: 6 });
      const menus = menuElements(editor);
      expect(menus.map((el) => el.className)).toEqual(['tiptap-notion-bubble', 'tiptap-notion-floating']);
      const actions = menus.flatMap((el) => Array.from(el.querySelectorAll<HTMLButtonElement>('[data-tiptap-notion-action]')));
      expect(actions).toHaveLength(10);
      vi.mocked(window.prompt).mockClear();
      clickAll(actions);
      expect(window.prompt).toHaveBeenCalledTimes(4);

      editor.commands.setContent('<p></p><p>x</p>');
      editor.commands.setTextSelection(1);
      editor.commands.setContent('<pre><code>code</code></pre>');
      editor.commands.setTextSelection({ from: 1, to: 3 });
    }
  });
});

describe('prompts', () => {
  it('reads translated prompt labels with English fallbacks', () => {
    const root = document.createElement('div');
    expect(readPromptLabels(root)).toEqual({ linkUrl: 'URL', imageUrl: 'Image URL', embedUrl: 'Embed URL (iframe)' });
    root.dataset.tiptapPromptLinkUrlValue = 'Enlace';
    root.dataset.tiptapPromptImageUrlValue = ' ';
    root.dataset.tiptapPromptEmbedUrlValue = 'Embed';
    expect(readPromptLabels(root)).toEqual({ linkUrl: 'Enlace', imageUrl: 'Image URL', embedUrl: 'Embed' });
  });

  it('sets, updates and removes links (toolbar and Ctrl+K)', () => {
    const root = makeRoot({ tiptapToolbarValue: '1', tiptapPromptLinkUrlValue: 'Link?' });
    initTiptapRoot(root);
    const editor = editorOf(root);
    editor.commands.setTextSelection({ from: 1, to: 6 });
    const prompt = vi.mocked(window.prompt);
    const link = toolbarButtons(root).find((b) => b.title === 'Link') as HTMLButtonElement;

    prompt.mockReturnValueOnce('https://example.com');
    link.click();
    expect(prompt).toHaveBeenLastCalledWith('Link?', 'https://');
    expect(editor.getHTML()).toContain('href="https://example.com"');

    prompt.mockReturnValueOnce('');
    const dom = editor.view.dom;
    dom.dispatchEvent(new KeyboardEvent('keydown', { key: 'K', ctrlKey: true, bubbles: true, cancelable: true }));
    expect(prompt).toHaveBeenLastCalledWith('Link?', 'https://example.com');
    expect(editor.getHTML()).not.toContain('href=');

    dom.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true, cancelable: true }));
    dom.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', bubbles: true, cancelable: true }));
    dom.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', ctrlKey: true, bubbles: true, cancelable: true }));
  });

  it('inserts and updates images, ignoring empty answers', () => {
    const root = makeRoot({ tiptapToolbarValue: '1', tiptapExampleValue: 'images' });
    initTiptapRoot(root);
    const editor = editorOf(root);
    const prompt = vi.mocked(window.prompt);
    const insert = toolbarButtons(root).find((b) => b.title === 'Insert image') as HTMLButtonElement;

    prompt.mockReturnValueOnce('  ');
    insert.click();
    expect(editor.getHTML()).not.toContain('<img');

    prompt.mockReturnValueOnce(' https://example.com/a.png ');
    insert.click();
    expect(editor.getHTML()).toContain('src="https://example.com/a.png"');

    const img = editor.view.dom.querySelector('img') as HTMLImageElement;
    prompt.mockReturnValueOnce('https://example.com/b.png');
    img.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    expect(editor.getHTML()).toContain('src="https://example.com/b.png"');

    const bareImg = editor.view.dom.querySelector('img') as HTMLImageElement;
    bareImg.removeAttribute('src');
    prompt.mockReturnValueOnce(null);
    bareImg.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    expect(prompt).toHaveBeenLastCalledWith('Image URL', 'https://');

    // Double-clicks on text or on non-HTML nodes are left to ProseMirror.
    prompt.mockClear();
    editor.view.dom.querySelector('p')?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    editor.view.dom.querySelector('p')?.appendChild(svg);
    svg.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    expect(prompt).not.toHaveBeenCalled();
  });

  it('inserts and updates https embeds only', () => {
    const root = makeRoot({ tiptapVariantValue: 'notion' });
    initTiptapRoot(root);
    const editor = editorOf(root);
    const prompt = vi.mocked(window.prompt);

    prompt.mockReturnValueOnce(null);
    runIframePrompt(editor);
    prompt.mockReturnValueOnce(' ');
    runIframePrompt(editor);
    prompt.mockReturnValueOnce('javascript:alert(1)');
    runIframePrompt(editor);
    expect(editor.getHTML()).not.toContain('<iframe');

    prompt.mockReturnValueOnce('https://www.youtube.com/embed/x');
    runIframePrompt(editor);
    expect(editor.getHTML()).toContain('src="https://www.youtube.com/embed/x"');

    const iframe = editor.view.dom.querySelector('iframe') as HTMLIFrameElement;
    prompt.mockReturnValueOnce('https://player.vimeo.com/video/1');
    iframe.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    expect(editor.getHTML()).toContain('src="https://player.vimeo.com/video/1"');

    const bare = editor.view.dom.querySelector('iframe') as HTMLIFrameElement;
    bare.removeAttribute('src');
    prompt.mockReturnValueOnce(null);
    bare.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    expect(prompt).toHaveBeenLastCalledWith('Embed URL (iframe)', 'https://');
  });

  it('falls back to English labels for editors not mounted by the bundle', () => {
    const editor = new Editor({ extensions: [StarterKit] });
    runIframePrompt(editor);
    expect(window.prompt).toHaveBeenCalledWith('Embed URL (iframe)', 'https://');
    editor.destroy();
  });

  it('rejects embeds when the editor has no embed extension', () => {
    const root = makeRoot({ tiptapVariantValue: 'simple' });
    initTiptapRoot(root);
    vi.mocked(window.prompt).mockReturnValueOnce('http://insecure.example');
    runIframePrompt(editorOf(root));
    expect(editorOf(root).getHTML()).not.toContain('<iframe');
  });
});

describe('applyChromeTheme', () => {
  it('applies light, dark and auto modes and follows OS changes once', () => {
    const root = document.createElement('div');
    applyChromeTheme(root);
    expect(root.classList.contains('tiptap-theme-light')).toBe(true);

    root.dataset.tiptapThemeValue = 'DARK';
    applyChromeTheme(root);
    expect(root.classList.contains('tiptap-theme-dark')).toBe(true);
    expect(root.classList.contains('tiptap-theme-light')).toBe(false);

    const listeners: Array<() => void> = [];
    let dark = true;
    vi.spyOn(window, 'matchMedia').mockImplementation(
      () =>
        ({
          get matches() {
            return dark;
          },
          addEventListener: (_type: string, cb: () => void) => listeners.push(cb),
        }) as unknown as MediaQueryList,
    );
    root.dataset.tiptapThemeValue = 'auto';
    applyChromeTheme(root);
    expect(root.classList.contains('tiptap-theme-auto')).toBe(true);
    expect(root.classList.contains('tiptap-theme-dark')).toBe(true);
    expect(listeners).toHaveLength(1);

    dark = false;
    listeners[0]?.();
    expect(root.classList.contains('tiptap-theme-light')).toBe(true);
    expect(listeners).toHaveLength(1);
  });
});

describe('host hooks', () => {
  it('passes the upload inserter, fetch and drop anchor to the upload hook', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
    const withImage = makeRoot({ tiptapUploadUrlValue: '/upload', tiptapVariantValue: 'notion' }, '<p>Hello world</p>');
    initTiptapRoot(withImage);
    expect(uploadSpy).toHaveBeenCalledOnce();
    const [root, surface, config, inserter, fetchImpl, anchorFor] = uploadSpy.mock.calls[0] as [
      HTMLElement,
      HTMLElement,
      { url: string },
      UploadInserter,
      (input: string, init?: RequestInit) => Promise<Response>,
      (event: Event) => UploadAnchor,
    ];
    expect(root).toBe(withImage);
    const editor = editorOf(withImage);
    expect(surface).toBe(editor.view.dom);
    expect(config.url).toBe('/upload');

    await fetchImpl('/x', { method: 'POST' });
    expect(fetchMock).toHaveBeenCalledWith('/x', { method: 'POST' });

    inserter.image('https://example.com/a.png', 'a', null);
    expect(editor.getHTML()).toContain('alt="a"');
    inserter.image('https://example.com/b.png', 'b', 1);
    expect(editor.getHTML()).toContain('alt="b"');
    inserter.link('https://example.com/c.pdf', 'c.pdf', null);
    inserter.link('https://example.com/d.pdf', 'd.pdf', 1);
    expect(editor.getHTML()).toContain('href="https://example.com/c.pdf"');
    expect(editor.getHTML()).toContain('href="https://example.com/d.pdf"');

    // Paste: anchored at the caret, then mapped through later edits until released.
    editor.commands.setTextSelection(3);
    const paste = anchorFor(new Event('paste'));
    expect(paste.position()).toBe(3);
    editor.commands.insertContentAt(1, 'ab');
    expect(paste.position()).toBe(5);
    paste.release();
    editor.commands.insertContentAt(1, 'cd');
    expect(paste.position()).toBe(5);

    // Drop: resolved from the pointer coordinates (falls back to the caret when outside the document).
    const posAtCoords = vi.spyOn(editor.view, 'posAtCoords');
    posAtCoords.mockReturnValueOnce({ pos: 2, inside: -1 });
    const drop = new Event('drop') as DragEvent;
    Object.assign(drop, { clientX: 10, clientY: 20 });
    expect(anchorFor(drop).position()).toBe(2);
    expect(posAtCoords).toHaveBeenCalledWith({ left: 10, top: 20 });
    posAtCoords.mockReturnValueOnce(null);
    editor.commands.setTextSelection(4);
    expect(anchorFor(drop).position()).toBe(4);
    expect(anchorFor(new Event('drop')).position()).toBe(4);
  });

  it('inserts uploaded images as links when the profile has no image extension', () => {
    const root = makeRoot({ tiptapUploadUrlValue: '/upload', tiptapVariantValue: 'simple' });
    initTiptapRoot(root);
    const inserter = uploadSpy.mock.calls[0]?.[3] as UploadInserter;
    inserter.image('https://example.com/a.png', 'a.png', null);
    expect(editorOf(root).getHTML()).toContain('href="https://example.com/a.png"');
    expect(editorOf(root).getHTML()).not.toContain('<img');
  });

  it('adapts the editor for the suggestion hook and disposes it on teardown', () => {
    const root = makeRoot({ tiptapSuggestionsValue: JSON.stringify([{ trigger: '@', url: '/people' }]) }, '<p>Hi @an</p>');
    initTiptapRoot(root);
    expect(uploadSpy).not.toHaveBeenCalled();
    expect(suggestionSpy).toHaveBeenCalledOnce();
    const adapter = suggestionSpy.mock.calls[0]?.[1] as SuggestionEditor;
    const editor = editorOf(root);
    expect(adapter.surface).toBe(editor.view.dom);

    editor.commands.setTextSelection(8);
    expect(adapter.textBefore()).toBe('Hi @an');
    adapter.replaceBefore(3, '@ana ');
    expect(editor.getHTML()).toContain('Hi @ana');

    const callback = vi.fn();
    adapter.onChange(callback);
    editor.commands.insertContent('!');
    expect(callback).toHaveBeenCalled();

    destroyTiptapRoot(root);
    expect(disposeSpy).toHaveBeenCalledOnce();
    expect(root.dataset.tiptapInitialized).toBeUndefined();
  });
});

describe('discovery and custom element', () => {
  it('initializes every root on runInit and observes inserted roots', async () => {
    const first = makeRoot();
    runInit();
    expect(first.dataset.tiptapInitialized).toBe('1');

    runInitAndObserve();
    const later = makeRoot();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(later.dataset.tiptapInitialized).toBe('1');
  });

  it('mounts on connect and tears down on disconnect', async () => {
    const element = document.createElement('nowo-tiptap-editor');
    const textarea = document.createElement('textarea');
    textarea.value = '<p>Element</p>';
    const mount = document.createElement('div');
    mount.setAttribute('data-tiptap-mount', '');
    element.append(textarea, mount);
    document.body.appendChild(element);
    expect(element.getAttribute('data-tiptap-root')).toBe('1');
    await Promise.resolve();
    expect(element.dataset.tiptapInitialized).toBe('1');

    element.remove();
    expect(element.dataset.tiptapInitialized).toBeUndefined();

    // Already flagged roots keep their attribute; a node removed before the microtask is not initialized.
    const quick = document.createElement('nowo-tiptap-editor');
    quick.setAttribute('data-tiptap-root', '1');
    quick.append(document.createElement('textarea'), mount.cloneNode());
    document.body.appendChild(quick);
    quick.remove();
    await Promise.resolve();
    expect(quick.dataset.tiptapInitialized).toBeUndefined();
  });

  it('defers the first scan to DOMContentLoaded while the document is loading', async () => {
    vi.resetModules();
    const readyState = vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
    const listen = vi.spyOn(document, 'addEventListener');
    const fresh = await import('./tiptap-editor');
    readyState.mockRestore();
    const deferred = listen.mock.calls.find(([type]) => type === 'DOMContentLoaded');
    expect(deferred?.[1]).toBe(fresh.runInitAndObserve);

    const root = makeRoot();
    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(root.dataset.tiptapInitialized).toBe('1');
  });

  it('exposes the public API on window', () => {
    const api = (window as unknown as { NowoTiptapEditor: Record<string, unknown> }).NowoTiptapEditor;
    expect(Object.keys(api).sort()).toEqual(
      ['applyChromeTheme', 'destroyTiptapRoot', 'initTiptapRoot', 'runInit', 'runInitAndObserve', 'syncTiptapTextareasIn'].sort(),
    );
  });
});

/** 1.8: Tiptap 3 keeps the 1.x editor behaviour (extension set, links, tables, tasks, code blocks, menus, paste). */
describe('tiptap 3 parity', () => {
  const PROFILES: RootOptions[] = [
    ...['default', 'simple', 'notion', 'agent', 'headless'].map((variant) => ({ tiptapVariantValue: variant })),
    ...['formatting', 'images', 'long_text', 'markdown_shortcuts', 'minimal', 'tables', 'tasks', 'text_direction_rtl', 'menus', 'syntax_highlighting'].map(
      (example) => ({ tiptapExampleValue: example }),
    ),
  ];

  it('registers every extension once, without the StarterKit 3 additions', () => {
    const warn = vi.spyOn(console, 'warn');
    for (const profile of PROFILES) {
      const root = makeRoot({ ...profile, tiptapToolbarValue: '1' });
      initTiptapRoot(root);
      const names = editorOf(root).extensionManager.extensions.map((ext) => ext.name);
      expect(new Set(names).size, JSON.stringify(profile)).toBe(names.length);
      expect(names).toContain('link');
      expect(names).toContain('underline');
      expect(names).not.toContain('trailingNode');
      expect(names).not.toContain('listKeymap');
    }
    expect(warn.mock.calls.flat().join(' ')).not.toContain('Duplicate extension');
  });

  it('keeps the link rel and refuses javascript: URLs from the prompt', () => {
    const root = makeRoot({ tiptapToolbarValue: '1' }, '<p>Hello world</p>');
    initTiptapRoot(root);
    const editor = editorOf(root);
    const prompt = vi.mocked(window.prompt);

    editor.commands.setTextSelection({ from: 1, to: 6 });
    prompt.mockReturnValueOnce('javascript:alert(1)');
    runLinkThroughToolbar(root);
    expect(editor.getHTML()).not.toContain('javascript');
    expect(editor.getHTML()).not.toContain('<a');

    prompt.mockReturnValueOnce('https://example.com');
    runLinkThroughToolbar(root);
    const a = editor.view.dom.ownerDocument.createElement('div');
    a.innerHTML = editor.getHTML();
    const anchor = a.querySelector('a') as HTMLAnchorElement;
    expect(anchor.getAttribute('href')).toBe('https://example.com');
    expect(anchor.getAttribute('rel')).toBe('noopener noreferrer nofollow');
    expect(anchor.getAttribute('target')).toBe('_blank');
    expect(anchor.className).toBe('tiptap-editor-link');
    expect(anchor.textContent).toBe('Hello');

    // extendMarkRange: a caret inside the link removes the whole link.
    editor.commands.setTextSelection(3);
    prompt.mockReturnValueOnce('');
    runLinkThroughToolbar(root);
    expect(editor.getHTML()).toBe('<p>Hello world</p>');
  });

  it('sanitises pasted HTML (event handlers, javascript: links and iframes)', () => {
    const root = makeRoot({ tiptapVariantValue: 'notion' }, '<p></p>');
    initTiptapRoot(root);
    const editor = editorOf(root);
    editor.view.pasteHTML(
      '<p onclick="alert(1)">a <a href="javascript:alert(2)" onmouseover="alert(3)" rel="opener" target="_blank">x</a>' +
        ' <img src="https://example.com/a.png" onerror="alert(4)"></p>' +
        '<iframe src="javascript:alert(5)"></iframe><iframe src="https://www.youtube.com/embed/x" onload="alert(6)"></iframe>' +
        '<script>alert(7)</script>',
    );
    const html = editor.getHTML();
    expect(html).not.toMatch(/\son[a-z]+=/i);
    expect(html).not.toContain('javascript');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('opener"');
    expect(html).toContain('src="https://example.com/a.png"');
    expect(html).toContain('src="https://www.youtube.com/embed/x"');
  });

  it('inserts tables without a trailing paragraph', () => {
    const root = makeRoot({ tiptapToolbarValue: '1', tiptapExampleValue: 'tables' }, '<p>x</p>');
    initTiptapRoot(root);
    const editor = editorOf(root);
    editor.commands.setTextSelection(2);
    (toolbarButtons(root).find((b) => b.title === 'Insert table') as HTMLButtonElement).click();
    const html = editor.getHTML();
    expect(html.match(/<th/g)).toHaveLength(3);
    expect(html.match(/<tr/g)).toHaveLength(3);
    expect(html.endsWith('</table>')).toBe(true);
  });

  it('renders task lists and lowlight code blocks like 1.x', () => {
    const tasks = makeRoot({ tiptapToolbarValue: '1', tiptapExampleValue: 'tasks' }, '<p>todo</p>');
    initTiptapRoot(tasks);
    (toolbarButtons(tasks).find((b) => b.title === 'Task list') as HTMLButtonElement).click();
    expect(editorOf(tasks).getHTML()).toMatch(/^<ul data-type="taskList"><li data-checked="false" data-type="taskItem">/);
    expect(tasks.querySelector('.ProseMirror li input[type="checkbox"]')).not.toBeNull();

    const code = makeRoot({ tiptapExampleValue: 'syntax_highlighting' }, '<pre><code class="language-javascript">const a = 1;</code></pre>');
    initTiptapRoot(code);
    expect(editorOf(code).getHTML()).toBe('<pre><code class="language-javascript">const a = 1;</code></pre>');
    expect(code.querySelector('.ProseMirror pre .hljs-keyword')?.textContent).toBe('const');
  });

  it('keeps the menus detached until Tiptap shows them next to the editor', () => {
    const root = makeRoot({ tiptapVariantValue: 'notion' }, '<p>Hello world</p>');
    initTiptapRoot(root);
    const editor = editorOf(root);
    const [bubble] = menuElements(editor);
    expect(root.querySelector('.tiptap-notion-bubble')).toBeNull();
    expect(root.querySelector('.tiptap-notion-floating')).toBeNull();

    editor.view.dispatch(editor.state.tr.setMeta('bubbleMenu', 'show'));
    expect(bubble.parentElement).toBe(root.querySelector('[data-tiptap-mount]'));
    editor.view.dispatch(editor.state.tr.setMeta('bubbleMenu', 'hide'));
    expect(bubble.isConnected).toBe(false);

    // An empty first paragraph matches the floating menu, but nothing shows before the editor gets focus.
    const profiles: RootOptions[] = [{ tiptapVariantValue: 'notion' }, { tiptapExampleValue: 'menus' }];
    for (const profile of profiles) {
      const empty = makeRoot(profile, '<p></p>');
      initTiptapRoot(empty);
      expect(empty.querySelector('[data-tiptap-mount] > div:not(.ProseMirror)'), JSON.stringify(profile)).toBeNull();
    }
  });

  it('shows the menus only while the editor or the menu has focus', () => {
    type MenuOptions = { element: HTMLElement; shouldShow: ((props: Record<string, unknown>) => boolean) | null };
    const profiles: RootOptions[] = [{ tiptapVariantValue: 'notion' }, { tiptapExampleValue: 'menus' }];
    for (const profile of profiles) {
      const root = makeRoot(profile, '<p></p><p>Hello</p>');
      initTiptapRoot(root);
      const editor = editorOf(root);
      for (const name of ['bubbleMenu', 'floatingMenu']) {
        const options = editor.extensionManager.extensions.find((ext) => ext.name === name)?.options as MenuOptions;
        if (options.shouldShow === null) {
          continue; // the example floating menu keeps Tiptap's default (focus required too)
        }
        const shouldShow = options.shouldShow;
        const call = (focused: boolean): boolean =>
          shouldShow({ editor, view: { hasFocus: () => focused }, state: editor.state, element: options.element, from: 0, to: 0 });
        if (name === 'bubbleMenu') {
          editor.commands.setTextSelection({ from: 3, to: 6 });
        } else {
          editor.commands.setTextSelection(1);
        }
        expect(call(true), `${name} ${JSON.stringify(profile)}`).toBe(true);
        expect(call(false)).toBe(false);

        // Focus inside the menu (a click on one of its buttons) keeps it open.
        document.body.appendChild(options.element);
        const inside = options.element.appendChild(document.createElement('button'));
        inside.focus();
        expect(call(false)).toBe(true);
        inside.remove();
        options.element.remove();

        // Code blocks (bubble) and non-empty lines (floating) never show the menu.
        if (name === 'bubbleMenu') {
          editor.commands.setContent('<pre><code>code</code></pre>');
          editor.commands.setTextSelection({ from: 1, to: 3 });
        } else {
          editor.commands.setTextSelection(4);
        }
        expect(call(true)).toBe(false);
        editor.commands.setContent('<p></p><p>Hello</p>');
      }
    }
  });

  it('pastes numbered plain text as text, inside and outside code blocks', () => {
    const root = makeRoot({}, '<pre><code>x</code></pre><p>y</p>');
    initTiptapRoot(root);
    const editor = editorOf(root);
    const paste = (): void => {
      const data = new DataTransfer();
      data.setData('text/plain', '1. first\n2. second');
      editor.view.dom.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
    };
    editor.commands.setTextSelection(2);
    paste();
    expect(editor.getHTML()).toContain('<pre><code>x1. first\n2. second</code></pre>');
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    paste();
    expect(editor.getHTML()).not.toContain('<ol');
    expect(editor.getHTML()).toContain('1. first');
    // The ordered list itself still works.
    editor.commands.toggleOrderedList();
    expect(editor.getHTML()).toContain('<ol>');
  });

  it('hides a menu once focus leaves both the menu and the editor', () => {
    const root = makeRoot({ tiptapVariantValue: 'notion' }, '<p>Hello world</p>');
    const field = document.body.appendChild(document.createElement('input'));
    initTiptapRoot(root);
    const editor = editorOf(root);
    const [bubble, floating] = menuElements(editor);
    const leave = (menu: HTMLElement, to: EventTarget | null): void => {
      menu.dispatchEvent(new FocusEvent('focusout', { relatedTarget: to as Node | null, bubbles: true }));
    };

    editor.view.dispatch(editor.state.tr.setMeta('bubbleMenu', 'show'));
    leave(bubble, bubble.querySelector('button'));
    leave(bubble, editor.view.dom);
    expect(bubble.isConnected).toBe(true);
    leave(bubble, field);
    expect(bubble.isConnected).toBe(false);

    editor.view.dispatch(editor.state.tr.setMeta('floatingMenu', 'show'));
    leave(floating, null);
    expect(floating.isConnected).toBe(false);

    const example = makeRoot({ tiptapExampleValue: 'menus' }, '<p>Hello world</p>');
    initTiptapRoot(example);
    const exampleEditor = editorOf(example);
    const [exampleBubble] = menuElements(exampleEditor);
    exampleEditor.view.dispatch(exampleEditor.state.tr.setMeta('bubbleMenu', 'show'));
    leave(exampleBubble, field);
    expect(exampleBubble.isConnected).toBe(false);
  });
});

function runLinkThroughToolbar(root: HTMLElement): void {
  (toolbarButtons(root).find((b) => b.title === 'Link') as HTMLButtonElement).click();
}
