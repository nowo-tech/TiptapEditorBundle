/**
 * Lifecycle helpers and custom element registration for the Tiptap widget bundle.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { destroyTiptapRoot, syncTiptapTextareasIn } from './tiptap-editor';

describe('tiptap-editor lifecycle', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('registers the nowo-tiptap-editor autonomous custom element', () => {
    expect(customElements.get('nowo-tiptap-editor')).toBeDefined();
  });

  it('destroyTiptapRoot does not throw when the root was never initialized', () => {
    const el = document.createElement('div');
    expect(() => destroyTiptapRoot(el)).not.toThrow();
  });

  it('syncTiptapTextareasIn does not throw when no widget roots are present', () => {
    const el = document.createElement('div');
    expect(() => syncTiptapTextareasIn(el)).not.toThrow();
  });
});
