/**
 * Toolbar button chrome (1.7): labels, display mode, host icon templates and the built-in SVG icons.
 */

import { describe, expect, it } from 'vitest';

import { TOOLBAR_ICON_PATHS, decorateToolbarButton, readToolbarDisplay, readToolbarLabels, toolbarIcon } from './toolbar-icons';

function root(data: Record<string, string> = {}, html = ''): HTMLElement {
  const el = document.createElement('div');
  for (const [key, value] of Object.entries(data)) {
    el.dataset[key] = value;
  }
  el.innerHTML = html;

  return el;
}

describe('readToolbarDisplay', () => {
  it('is icon only when asked, text otherwise', () => {
    expect(readToolbarDisplay(root({ tiptapToolbarDisplayValue: ' ICON ' }))).toBe('icon');
    expect(readToolbarDisplay(root({ tiptapToolbarDisplayValue: 'text' }))).toBe('text');
    expect(readToolbarDisplay(root({ tiptapToolbarDisplayValue: 'emoji' }))).toBe('text');
    expect(readToolbarDisplay(root())).toBe('text');
  });
});

describe('readToolbarLabels', () => {
  it('keeps the non-empty string labels of a JSON object', () => {
    const el = root({ tiptapToolbarLabelsValue: JSON.stringify({ bold: 'Negrita', italic: ' ', undo: 3 }) });
    expect(readToolbarLabels(el)).toEqual({ bold: 'Negrita' });
  });

  it('gives no labels for a missing, empty, invalid or non-object value', () => {
    expect(readToolbarLabels(root())).toEqual({});
    expect(readToolbarLabels(root({ tiptapToolbarLabelsValue: '  ' }))).toEqual({});
    expect(readToolbarLabels(root({ tiptapToolbarLabelsValue: '{nope' }))).toEqual({});
    expect(readToolbarLabels(root({ tiptapToolbarLabelsValue: '[]' }))).toEqual({});
    expect(readToolbarLabels(root({ tiptapToolbarLabelsValue: 'null' }))).toEqual({});
    expect(readToolbarLabels(root({ tiptapToolbarLabelsValue: '"bold"' }))).toEqual({});
  });
});

describe('toolbarIcon', () => {
  it('prefers the host template of the command', () => {
    const el = root({}, '<template data-tiptap-icon="italic"><i>I</i></template><template data-tiptap-icon="bold"><b class="host">B</b></template>');
    const icon = toolbarIcon(el, 'bold');
    expect(icon?.querySelector('b.host')?.textContent).toBe('B');
    // the template stays reusable (cloned, not moved)
    expect(toolbarIcon(el, 'bold')?.querySelector('b.host')).not.toBeNull();
  });

  it('ignores an empty host template', () => {
    const el = root({}, '<template data-tiptap-icon="bold"></template>');
    expect(toolbarIcon(el, 'bold')?.querySelector('svg.tiptap-editor-toolbar__icon')).not.toBeNull();
  });

  it('falls back to the built-in SVG, or null for a command without icon', () => {
    const svg = toolbarIcon(root(), 'undo')?.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
    expect(svg?.innerHTML).toContain('<path');
    expect(toolbarIcon(root(), 'heading_1')).toBeNull();
  });

  it('ships an icon for every non-heading command', () => {
    for (const id of Object.keys(TOOLBAR_ICON_PATHS)) {
      expect(toolbarIcon(root(), id)?.querySelector('svg')).not.toBeNull();
    }
  });
});

describe('decorateToolbarButton', () => {
  it('labels the button with the translated label and keeps the glyph in text mode', () => {
    const button = document.createElement('button');
    decorateToolbarButton(root(), button, { id: 'bold', label: 'B', title: 'Bold' }, 'text', { bold: 'Negrita' });
    expect([button.title, button.getAttribute('aria-label'), button.textContent, button.dataset.tiptapCommand]).toEqual(['Negrita', 'Negrita', 'B', 'bold']);
    expect(button.classList.contains('tiptap-editor-toolbar__btn--icon')).toBe(false);
  });

  it('falls back to the English title and draws the icon in icon mode', () => {
    const button = document.createElement('button');
    decorateToolbarButton(root(), button, { id: 'bold', label: 'B', title: 'Bold' }, 'icon', {});
    expect(button.getAttribute('aria-label')).toBe('Bold');
    expect(button.querySelector('svg')).not.toBeNull();
    expect(button.textContent).toBe('');
    expect(button.classList.contains('tiptap-editor-toolbar__btn--icon')).toBe(true);
  });

  it('keeps the glyph in icon mode when the command has no icon or no id', () => {
    const heading = document.createElement('button');
    decorateToolbarButton(root(), heading, { id: 'heading_2', label: 'H2', title: 'Heading 2' }, 'icon', { heading_2: 'Título 2' });
    expect([heading.textContent, heading.title]).toEqual(['H2', 'Título 2']);

    const anonymous = document.createElement('button');
    decorateToolbarButton(root(), anonymous, { label: '?', title: 'Other' }, 'icon', { bold: 'x' });
    expect([anonymous.textContent, anonymous.getAttribute('aria-label'), anonymous.dataset.tiptapCommand]).toEqual(['?', 'Other', undefined]);
  });
});
