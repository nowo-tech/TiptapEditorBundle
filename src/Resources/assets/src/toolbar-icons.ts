/**
 * Toolbar button chrome (1.7): accessible labels, the `text` / `icon` display mode and the icon hook.
 *
 * - Labels: the form theme renders `data-tiptap-toolbar-labels-value` (JSON, command id => translated label); each
 *   button gets it as `aria-label` and `title` (tooltip), falling back to the English title of the button spec.
 * - Display: `data-tiptap-toolbar-display-value` = `text` (default, the 1.x glyphs such as `B`, `↶`) or `icon`.
 * - Icons: a host can provide its own markup per command with `<template data-tiptap-icon="bold">…</template>` inside
 *   the widget root (form theme block `tiptap_editor_toolbar_icons`, e.g. `ux_icon('tabler:bold')`); otherwise the
 *   built-in inline SVG below is used (no icon font, nothing loaded from the network).
 */

/** How toolbar buttons are drawn. */
export type ToolbarDisplay = 'text' | 'icon';

/** Inner markup (24×24, stroke = currentColor) of the built-in icon of each toolbar command. */
export const TOOLBAR_ICON_PATHS: Readonly<Record<string, string>> = {
  undo: '<path d="M9 14l-4-4 4-4"/><path d="M5 10h11a4 4 0 0 1 0 8h-1"/>',
  redo: '<path d="M15 14l4-4-4-4"/><path d="M19 10H8a4 4 0 0 0 0 8h1"/>',
  bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z"/><path d="M13 12h1a3.5 3.5 0 0 1 0 7H7v-7"/>',
  italic: '<path d="M11 5h6M7 19h6M14 5l-4 14"/>',
  strike:
    '<path d="M5 12h14"/><path d="M16 7a4 3 0 0 0-4-2h-1a3.5 3.5 0 0 0-3 5.5M8 17a4 3 0 0 0 4 2h1a3.5 3.5 0 0 0 3-5.5"/>',
  code: '<path d="M7 8l-4 4 4 4M17 8l4 4-4 4M14 4l-4 16"/>',
  underline: '<path d="M7 5v5a5 5 0 0 0 10 0V5M5 19h14"/>',
  bullet_list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="5" cy="6" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="18" r="1"/>',
  ordered_list: '<path d="M11 6h9M11 12h9M11 18h9"/><path d="M4 4l2-1v6M4 16a2 2 0 1 1 4 0c0 .6-.3 1-.7 1.4L4 21h4"/>',
  blockquote: '<path d="M6 15h15M21 19H6M15 11h6M21 7h-6"/><path d="M4 11V8a2 2 0 0 1 2-2M9 11V8a2 2 0 0 1 2-2"/>',
  code_block: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M10 10l-2 2 2 2M14 10l2 2-2 2"/>',
  horizontal_rule: '<path d="M4 12h16"/><path d="M8 7h8M8 17h8" opacity=".4"/>',
  align_left: '<path d="M4 6h16M4 12h10M4 18h14"/>',
  align_center: '<path d="M4 6h16M8 12h8M6 18h12"/>',
  align_right: '<path d="M4 6h16M10 12h10M6 18h14"/>',
  align_justify: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  paragraph: '<path d="M13 4v16M17 4v16M19 4H9.5a4.5 4.5 0 0 0 0 9H13"/>',
  link: '<path d="M9 15l6-6"/><path d="M11 6l.5-.5a5 5 0 0 1 7 7L18 13M13 18l-.5.5a5 5 0 0 1-7-7L6 11"/>',
  hard_break: '<path d="M18 6v6a3 3 0 0 1-3 3H5M9 11l-4 4 4 4"/>',
  highlight: '<path d="M3 19h4L17.5 8.5a2.8 2.8 0 0 0-4-4L3 15v4M12.5 5.5l4 4"/><path d="M14 19h7"/>',
  subscript: '<path d="M5 7l8 10M5 17l8-10M21 20h-4l3.5-4a1.7 1.7 0 0 0-3.5-2"/>',
  superscript: '<path d="M5 7l8 10M5 17l8-10M21 11h-4l3.5-4A1.7 1.7 0 0 0 17 5"/>',
  table_insert: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M10 4v16"/>',
  table_add_column: '<rect x="3" y="4" width="10" height="16" rx="2"/><path d="M8 4v16M17 12h4M19 10v4"/>',
  table_add_row: '<rect x="4" y="3" width="16" height="10" rx="2"/><path d="M4 8h16M12 17v4M10 19h4"/>',
  table_header_row: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 6.5h18"/>',
  table_delete: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 10l6 6M15 10l-6 6"/>',
  task_list: '<path d="M3.5 5.5L5 7l2.5-2.5M3.5 11.5L5 13l2.5-2.5M3.5 17.5L5 19l2.5-2.5M11 6h9M11 12h9M11 18h9"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-5-5-8 9"/>',
};

const SVG_OPEN =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" ' +
  'class="tiptap-editor-toolbar__icon">';

/** Reads the display mode of a widget root (`icon` or `text`, the default). */
export function readToolbarDisplay(root: HTMLElement): ToolbarDisplay {
  return (root.dataset.tiptapToolbarDisplayValue ?? '').trim().toLowerCase() === 'icon' ? 'icon' : 'text';
}

/** Reads the translated button labels (command id => label) of a widget root; invalid JSON gives no labels. */
export function readToolbarLabels(root: HTMLElement): Record<string, string> {
  const raw = root.dataset.tiptapToolbarLabelsValue;
  if (raw === undefined || raw.trim() === '') {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const labels: Record<string, string> = {};
    for (const [id, label] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof label === 'string' && label.trim() !== '') {
        labels[id] = label;
      }
    }

    return labels;
  } catch {
    return {};
  }
}

/**
 * The icon of a command: the host `<template data-tiptap-icon="<id>">` inside the root, else the built-in SVG, else
 * null (the button keeps its text glyph).
 */
export function toolbarIcon(root: HTMLElement, id: string): DocumentFragment | null {
  const custom = Array.from(root.querySelectorAll<HTMLTemplateElement>('template[data-tiptap-icon]')).find(
    (template) => template.dataset.tiptapIcon === id,
  );
  if (custom) {
    return custom.content.cloneNode(true) as DocumentFragment;
  }

  const paths = TOOLBAR_ICON_PATHS[id];
  if (paths === undefined) {
    return null;
  }

  const template = document.createElement('template');
  template.innerHTML = `${SVG_OPEN}${paths}</svg>`;

  return template.content;
}

/**
 * Labels one toolbar button: `aria-label` and `title` from the translated label (fallback: the English title) and,
 * in `icon` mode, the icon in place of the text glyph (the glyph stays when the command has no icon, e.g. headings).
 */
export function decorateToolbarButton(
  root: HTMLElement,
  button: HTMLButtonElement,
  spec: { id?: string; label: string; title: string },
  display: ToolbarDisplay,
  labels: Record<string, string>,
): void {
  const label = (spec.id !== undefined ? labels[spec.id] : undefined) ?? spec.title;
  button.title = label;
  button.setAttribute('aria-label', label);
  button.textContent = spec.label;
  if (spec.id !== undefined) {
    button.dataset.tiptapCommand = spec.id;
  }

  if (display !== 'icon' || spec.id === undefined) {
    return;
  }

  const icon = toolbarIcon(root, spec.id);
  if (icon === null) {
    return;
  }

  button.textContent = '';
  button.appendChild(icon);
  button.classList.add('tiptap-editor-toolbar__btn--icon');
}
