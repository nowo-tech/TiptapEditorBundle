/**
 * Link `rel` hardening (RG2-L1): the editor never renders `rel="opener"`, and every link with a `target` gets
 * `noopener noreferrer`, so a page opened from stored content never gets `window.opener` (reverse tabnabbing).
 * Mirrors `AllowlistTiptapHtmlSanitizer` on the server, which stays the authoritative check.
 */

import { Link } from '@tiptap/extension-link';

/** `rel` link types kept on `<a>`; anything else (`opener` first of all) is dropped. Same list as the server. */
export const SAFE_LINK_REL_TOKENS: readonly string[] = [
  'alternate',
  'author',
  'bookmark',
  'external',
  'help',
  'license',
  'me',
  'next',
  'nofollow',
  'noopener',
  'noreferrer',
  'prev',
  'privacy-policy',
  'search',
  'sponsored',
  'tag',
  'terms-of-service',
  'ugc',
];

/**
 * The `rel` value to render: known link types only, lower-cased and deduplicated, plus `noopener noreferrer` when the
 * link has a target. `null` when nothing is left (the attribute is then omitted).
 */
export function safeLinkRel(rel: unknown, target: unknown): string | null {
  const tokens = new Set<string>();
  if (typeof rel === 'string') {
    for (const token of rel.toLowerCase().split(/\s+/)) {
      if (SAFE_LINK_REL_TOKENS.includes(token)) {
        tokens.add(token);
      }
    }
  }
  if (typeof target === 'string' && target !== '') {
    tokens.add('noopener');
    tokens.add('noreferrer');
  }

  return tokens.size > 0 ? [...tokens].join(' ') : null;
}

/** Tiptap Link mark whose rendered `<a>` always carries a safe `rel` ({@link safeLinkRel}). */
export const SafeLink = Link.extend({
  renderHTML(props) {
    // Link's own renderHTML (href allow-list) always returns ['a', attributes, 0].
    const parent = this.parent as (p: typeof props) => [string, Record<string, unknown>, ...unknown[]];
    const [tag, attributes, ...content] = parent(props);

    return [tag, { ...attributes, rel: safeLinkRel(attributes.rel, attributes.target) }, ...content] as ReturnType<typeof parent>;
  },
});
