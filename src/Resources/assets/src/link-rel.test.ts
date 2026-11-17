/**
 * RG2-L1: link `rel` hardening in the editor (no `opener`, `noopener noreferrer` on links with a target).
 */

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, describe, expect, it } from 'vitest';

import { SafeLink, safeLinkRel } from './link-rel';

const editors: Editor[] = [];

function html(content: string, options: Record<string, unknown> = {}): string {
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit.configure({ link: false }), SafeLink.configure({ openOnClick: false, ...options })],
    content,
  });
  editors.push(editor);

  return editor.getHTML();
}

function anchors(markup: string): HTMLAnchorElement[] {
  const host = document.createElement('div');
  host.innerHTML = markup;

  return Array.from(host.querySelectorAll('a'));
}

afterEach(() => {
  editors.splice(0).forEach((editor) => editor.destroy());
});

describe('safeLinkRel', () => {
  it('drops opener and forces noopener noreferrer with a target', () => {
    expect(safeLinkRel('opener', '_blank')).toBe('noopener noreferrer');
    expect(safeLinkRel(null, '_blank')).toBe('noopener noreferrer');
    expect(safeLinkRel(undefined, 'named-window')).toBe('noopener noreferrer');
  });

  it('keeps known link types, lower-cased and once', () => {
    expect(safeLinkRel('NoFollow opener ugc bogus nofollow', '_blank')).toBe('nofollow ugc noopener noreferrer');
    expect(safeLinkRel('noopener noreferrer nofollow', '_blank')).toBe('noopener noreferrer nofollow');
  });

  it('without a target only filters, and returns null when nothing is left', () => {
    expect(safeLinkRel('nofollow', null)).toBe('nofollow');
    expect(safeLinkRel('opener', null)).toBeNull();
    expect(safeLinkRel('opener', '')).toBeNull();
    expect(safeLinkRel(42, undefined)).toBeNull();
  });
});

describe('SafeLink', () => {
  it('never renders rel="opener" from stored content', () => {
    const [a] = anchors(html('<p><a href="https://evil.example" target="_blank" rel="opener">x</a></p>'));

    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    expect(a.getAttribute('target')).toBe('_blank');
  });

  it('keeps the default Tiptap rel of new links', () => {
    const [a] = anchors(html('<p><a href="https://example.com">x</a></p>'));

    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer nofollow');
  });

  it('omits rel when a link without a target has no safe link type', () => {
    const [a] = anchors(
      html('<p><a href="https://example.com" rel="opener">x</a></p>', { HTMLAttributes: { target: null, rel: null } }),
    );

    expect(a.hasAttribute('rel')).toBe(false);
    expect(a.hasAttribute('target')).toBe(false);
  });

  it('keeps the link when the parent renders a disallowed href', () => {
    const [a] = anchors(html('<p><a href="javascript:alert(1)" target="_blank" rel="opener">x</a></p>'));

    expect(a?.getAttribute('href') ?? '').not.toContain('javascript');
    expect(a?.getAttribute('rel') ?? 'noopener noreferrer').toBe('noopener noreferrer');
  });
});
