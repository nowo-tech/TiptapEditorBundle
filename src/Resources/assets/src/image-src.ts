/**
 * Image `src` allow-list (1.8, audit SN-I2): the editor keeps only http(s) and relative image URLs. `javascript:`,
 * `data:` (any case, so `allowBase64: false` cannot be bypassed with `DATA:`) and every other scheme are dropped when
 * HTML is parsed and when an image is rendered. Mirrors the server sanitizer, which allows only http/https media.
 */

import { Image } from '@tiptap/extension-image';

const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

/**
 * The trimmed URL when it is http(s) or relative (no scheme, including protocol-relative `//host/…`); otherwise `null`.
 * Control characters and whitespace are removed before the scheme check, as browsers do when resolving a URL.
 */
export function safeImageSrc(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const src = raw.trim();
  if (src === '') {
    return null;
  }
  const scheme = SCHEME.exec(src.replace(/[\u0000-\u0020]/g, ''))?.[1]?.toLowerCase();
  if (scheme !== undefined && scheme !== 'http' && scheme !== 'https') {
    return null;
  }

  return src;
}

/** Tiptap Image node that only accepts and renders {@link safeImageSrc} URLs. */
export const SafeImage = Image.extend({
  addAttributes() {
    const parent = (this.parent as () => Record<string, Record<string, unknown>>)();

    return {
      ...parent,
      src: {
        ...parent.src,
        default: null,
        parseHTML: (element: HTMLElement) => safeImageSrc(element.getAttribute('src')),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (element) => (safeImageSrc((element as HTMLElement).getAttribute('src')) === null ? false : null),
      },
    ];
  },

  renderHTML(props) {
    const parent = this.parent as (p: typeof props) => [string, Record<string, unknown>];
    const [tag, attributes] = parent(props);
    // Same attribute order as Tiptap's Image; an unsafe src is left out.
    const safe: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(attributes)) {
      if (name !== 'src') {
        safe[name] = value;
      } else if (safeImageSrc(value) !== null) {
        safe[name] = safeImageSrc(value);
      }
    }

    return [tag, safe] as ReturnType<typeof parent>;
  },
});
