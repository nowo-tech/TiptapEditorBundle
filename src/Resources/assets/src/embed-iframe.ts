import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Returns the normalized iframe URL when it is an absolute `https:` URL (and, when `allowedHosts`
 * is non-empty, its host is on that list); otherwise `null`. Rejects `javascript:`, `data:`, relative
 * URLs and credentials in the authority so untrusted pasted/loaded HTML cannot smuggle a script URL.
 */
export function safeEmbedSrc(raw: unknown, allowedHosts: readonly string[] = []): string | null {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return null;
  }
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '') {
    return null;
  }
  if (allowedHosts.length > 0 && !allowedHosts.some((h) => h.toLowerCase() === url.hostname.toLowerCase())) {
    return null;
  }
  return url.href;
}

export type EmbedIframeOptions = {
  /** Optional host allowlist; empty = any https host. */
  allowedHosts: string[];
};

/**
 * Preserves embed iframes (Vimeo, YouTube, etc.) when loading existing HTML into the editor.
 * Only https `src` values (optionally restricted to `allowedHosts`) are accepted, both when parsing
 * HTML and when rendering, so a `javascript:` iframe can never round-trip through the editor.
 */
export const EmbedIframe = Node.create<EmbedIframeOptions>({
  name: 'embedIframe',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return { allowedHosts: [] };
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element: HTMLElement) => safeEmbedSrc(element.getAttribute('src'), this.options.allowedHosts),
      },
      width: { default: '100%' },
      height: { default: '360' },
      allowfullscreen: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe',
        getAttrs: (element) =>
          safeEmbedSrc((element as HTMLElement).getAttribute('src'), this.options.allowedHosts) === null ? false : null,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, ...rest } = HTMLAttributes as Record<string, unknown>;
    const safe = safeEmbedSrc(src, this.options.allowedHosts);
    return [
      'iframe',
      mergeAttributes(rest, safe === null ? {} : { src: safe }, {
        frameborder: '0',
        allowfullscreen: 'allowfullscreen',
      }),
    ];
  },
});
