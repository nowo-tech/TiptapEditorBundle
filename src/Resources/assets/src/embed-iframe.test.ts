/**
 * Embed iframe node: src validation on parse/render and safe insertion from the prompt.
 */

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EmbedIframe, safeEmbedSrc } from './embed-iframe';
import { readPromptLabels, runIframePrompt } from './tiptap-editor';

function makeEditor(content: string, allowedHosts: string[] = []): Editor {
  return new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit, EmbedIframe.configure({ allowedHosts })],
    content,
  });
}

function iframesIn(html: string): HTMLIFrameElement[] {
  const host = document.createElement('div');
  host.innerHTML = html;
  return Array.from(host.querySelectorAll('iframe'));
}

describe('safeEmbedSrc', () => {
  it('accepts https URLs', () => {
    expect(safeEmbedSrc(' https://www.youtube.com/embed/x ')).toBe('https://www.youtube.com/embed/x');
  });

  it.each([
    ['javascript:alert(1)'],
    ['JaVaScRiPt:alert(1)'],
    ['data:text/html,<script>alert(1)</script>'],
    ['http://www.youtube.com/embed/x'],
    ['//evil.example/x'],
    ['/relative'],
    ['https://user:pass@www.youtube.com/embed/x'],
    ['https://user@www.youtube.com/embed/x'],
    ['not a url'],
    [''],
    ['   '],
    [null],
    [42],
  ])('rejects %s', (raw) => {
    expect(safeEmbedSrc(raw)).toBeNull();
  });

  it('enforces the host allowlist when given (case-insensitive)', () => {
    expect(safeEmbedSrc('https://Player.Vimeo.com/video/1', ['player.vimeo.com'])).toBe('https://player.vimeo.com/video/1');
    expect(safeEmbedSrc('https://evil.example/x', ['player.vimeo.com'])).toBeNull();
  });
});

describe('EmbedIframe node', () => {
  beforeEach(() => {
    // happy-dom 20 no longer implements window.prompt; install a stub so tests can spy on it.
    if (typeof window.prompt !== 'function') {
      vi.stubGlobal('prompt', () => null);
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  /** Runs the node's parse rule on a detached element (avoids happy-dom loading connected iframes). */
  function parseIframe(editor: Editor, src: string): Record<string, unknown> | false | null | undefined {
    const rule = editor.schema.nodes.embedIframe?.spec.parseDOM?.[0] as
      | { getAttrs?: (el: HTMLElement) => Record<string, unknown> | false | null }
      | undefined;
    const el = document.createElement('iframe');
    el.setAttribute('src', src);
    return rule?.getAttrs?.(el);
  }

  it('keeps https iframes when parsing HTML', () => {
    const editor = makeEditor('<p></p>');
    expect(parseIframe(editor, 'https://www.youtube.com/embed/x')).toMatchObject({ src: 'https://www.youtube.com/embed/x' });
    editor.destroy();
  });

  it('drops javascript: iframes when parsing HTML', () => {
    const editor = makeEditor('<p></p>');
    expect(parseIframe(editor, 'javascript:alert(1)')).toBe(false);
    expect(parseIframe(editor, ' JAVASCRIPT:alert(1)')).toBe(false);
    editor.destroy();
  });

  it('drops iframes outside the configured host allowlist', () => {
    const editor = makeEditor('<p></p>', ['www.youtube.com']);
    expect(parseIframe(editor, 'https://evil.example/x')).toBe(false);
    expect(parseIframe(editor, 'https://www.youtube.com/embed/x')).toMatchObject({ src: 'https://www.youtube.com/embed/x' });
    editor.destroy();
  });

  it('renders frameborder/allowfullscreen with a safe src', () => {
    const editor = makeEditor('<p></p>');
    editor.commands.setContent({
      type: 'doc',
      content: [{ type: 'embedIframe', attrs: { src: 'https://www.youtube.com/embed/x' } }],
    });
    const [frame] = iframesIn(editor.getHTML());
    expect(frame?.getAttribute('src')).toBe('https://www.youtube.com/embed/x');
    expect(frame?.getAttribute('frameborder')).toBe('0');
    editor.destroy();
  });

  it('never renders an unsafe src set through JSON content', () => {
    const editor = makeEditor('<p></p>');
    editor.commands.setContent({
      type: 'doc',
      content: [{ type: 'embedIframe', attrs: { src: 'javascript:alert(1)' } }],
    });
    const [frame] = iframesIn(editor.getHTML());
    expect(frame).toBeDefined();
    expect(frame?.hasAttribute('src')).toBe(false);
    editor.destroy();
  });

  it('prompt inserts a node via the editor API without HTML injection', () => {
    const editor = makeEditor('<p></p>');
    vi.spyOn(window, 'prompt').mockReturnValue('https://www.youtube.com/embed/x" onload="alert(1)');
    runIframePrompt(editor);
    const frames = iframesIn(editor.getHTML());
    expect(frames).toHaveLength(1);
    expect(frames[0]?.hasAttribute('onload')).toBe(false);
    expect(frames[0]?.getAttribute('src')?.startsWith('https://www.youtube.com/embed/')).toBe(true);
    editor.destroy();
  });

  it('prompt rejects javascript: URLs and empty/cancelled input', () => {
    const editor = makeEditor('<p></p>');
    const prompt = vi.spyOn(window, 'prompt');
    prompt.mockReturnValueOnce('javascript:alert(1)');
    runIframePrompt(editor);
    prompt.mockReturnValueOnce(null);
    runIframePrompt(editor);
    prompt.mockReturnValueOnce('  ');
    runIframePrompt(editor);
    expect(iframesIn(editor.getHTML())).toHaveLength(0);
    editor.destroy();
  });

  it('prompt updates the selected embed with a validated src', () => {
    const editor = makeEditor('<p></p>');
    editor.commands.setContent({
      type: 'doc',
      content: [{ type: 'embedIframe', attrs: { src: 'https://www.youtube.com/embed/old' } }],
    });
    editor.commands.setNodeSelection(0);
    const prompt = vi.spyOn(window, 'prompt');
    prompt.mockReturnValueOnce('javascript:alert(1)');
    runIframePrompt(editor, 'https://www.youtube.com/embed/old');
    expect(iframesIn(editor.getHTML())[0]?.getAttribute('src')).toBe('https://www.youtube.com/embed/old');
    prompt.mockReturnValueOnce('https://www.youtube.com/embed/new');
    runIframePrompt(editor, 'https://www.youtube.com/embed/old');
    expect(iframesIn(editor.getHTML())[0]?.getAttribute('src')).toBe('https://www.youtube.com/embed/new');
    editor.destroy();
  });

  it('prompt enforces the extension host allowlist', () => {
    const editor = makeEditor('<p></p>', ['player.vimeo.com']);
    vi.spyOn(window, 'prompt').mockReturnValue('https://www.youtube.com/embed/x');
    runIframePrompt(editor);
    expect(iframesIn(editor.getHTML())).toHaveLength(0);
    editor.destroy();
  });
});

describe('readPromptLabels', () => {
  it('reads translated labels from data attributes', () => {
    const root = document.createElement('div');
    root.dataset.tiptapPromptLinkUrlValue = 'Enlace';
    root.dataset.tiptapPromptImageUrlValue = 'URL de la imagen';
    root.dataset.tiptapPromptEmbedUrlValue = 'URL incrustada';
    expect(readPromptLabels(root)).toEqual({ linkUrl: 'Enlace', imageUrl: 'URL de la imagen', embedUrl: 'URL incrustada' });
  });

  it('falls back to English defaults', () => {
    const root = document.createElement('div');
    root.dataset.tiptapPromptImageUrlValue = ' ';
    expect(readPromptLabels(root)).toEqual({ linkUrl: 'URL', imageUrl: 'Image URL', embedUrl: 'Embed URL (iframe)' });
  });
});
