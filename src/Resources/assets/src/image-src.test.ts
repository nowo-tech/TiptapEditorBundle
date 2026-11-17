/**
 * SN-I2 (1.8): image `src` allow-list — http(s) and relative URLs only, in parsed and rendered HTML.
 */

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, describe, expect, it } from 'vitest';

import { SafeImage, safeImageSrc } from './image-src';

const editors: Editor[] = [];

function editor(content: string): Editor {
  const ed = new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit, SafeImage.configure({ inline: true, allowBase64: false })],
    content,
  });
  editors.push(ed);

  return ed;
}

afterEach(() => {
  editors.splice(0).forEach((ed) => ed.destroy());
});

describe('safeImageSrc', () => {
  it('keeps http(s) and relative URLs', () => {
    expect(safeImageSrc(' https://example.com/a.png ')).toBe('https://example.com/a.png');
    expect(safeImageSrc('HTTP://example.com/a.png')).toBe('HTTP://example.com/a.png');
    expect(safeImageSrc('/uploads/a.png')).toBe('/uploads/a.png');
    expect(safeImageSrc('a.png?x=1:2')).toBe('a.png?x=1:2');
    expect(safeImageSrc('//cdn.example.com/a.png')).toBe('//cdn.example.com/a.png');
  });

  it('drops every other scheme, in any case and with control characters', () => {
    for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', 'data:image/png;base64,AA', 'DATA:image/png;base64,AA', 'vbscript:x', 'blob:https://x/1', 'file:///etc/passwd']) {
      expect(safeImageSrc(bad), bad).toBeNull();
    }
    expect(safeImageSrc('')).toBeNull();
    expect(safeImageSrc('   ')).toBeNull();
    expect(safeImageSrc(null)).toBeNull();
    expect(safeImageSrc(42)).toBeNull();
  });
});

describe('SafeImage', () => {
  it('parses only safe images from HTML', () => {
    const html = editor(
      '<p><img src="https://example.com/a.png" alt="a"><img src="javascript:alert(1)"><img src="DATA:image/png;base64,AA"><img src="/b.png"></p>',
    ).getHTML();

    expect(html).toBe('<p><img src="https://example.com/a.png" alt="a"><img src="/b.png"></p>');
  });

  it('never renders an unsafe src set through the API', () => {
    const ed = editor('<p>x</p>');
    ed.commands.setImage({ src: 'javascript:alert(1)', alt: 'bad' });

    expect(ed.getHTML()).toContain('<img alt="bad">');
    expect(ed.getHTML()).not.toContain('javascript');
  });
});
