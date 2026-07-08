import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Preserves embed iframes (Vimeo, YouTube, etc.) when loading existing HTML into the editor.
 */
export const EmbedIframe = Node.create({
  name: 'embedIframe',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: '100%' },
      height: { default: '360' },
      allowfullscreen: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'iframe' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'iframe',
      mergeAttributes(HTMLAttributes, {
        frameborder: '0',
        allowfullscreen: 'allowfullscreen',
      }),
    ];
  },
});
