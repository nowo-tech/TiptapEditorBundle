/**
 * Tiptap editor bundle: mounts editors on [data-tiptap-root], syncs HTML to Symfony textarea fields.
 * Variants mirror UX presets; optional `data-tiptap-example-value` loads extension recipes like https://tiptap.dev/docs/examples
 */

import type { Extension } from '@tiptap/core';
import { Editor } from '@tiptap/core';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import FloatingMenu from '@tiptap/extension-floating-menu';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import { common, createLowlight } from 'lowlight';

import { createBundleLogger } from './logger';

declare const __TIPTAP_EDITOR_BUILD_TIME__: string;

const lowlight = createLowlight(common);

const log = createBundleLogger('tiptap-editor', {
  buildTime: typeof __TIPTAP_EDITOR_BUILD_TIME__ !== 'undefined' ? __TIPTAP_EDITOR_BUILD_TIME__ : undefined,
});
log.scriptLoaded();

const ROOT_SELECTOR = '[data-tiptap-root="1"]';

export type EditorVariant = 'default' | 'simple' | 'notion' | 'agent' | 'headless';

/** Matches {@see \Nowo\TiptapEditorBundle\TiptapExample} */
export type ExampleId =
  | 'formatting'
  | 'images'
  | 'long_text'
  | 'markdown_shortcuts'
  | 'minimal'
  | 'tables'
  | 'tasks'
  | 'text_direction_rtl'
  | 'menus'
  | 'syntax_highlighting';

const VARIANT_SET = new Set<string>(['default', 'simple', 'notion', 'agent', 'headless']);

const EXAMPLE_VALUES: ExampleId[] = [
  'formatting',
  'images',
  'long_text',
  'markdown_shortcuts',
  'minimal',
  'tables',
  'tasks',
  'text_direction_rtl',
  'menus',
  'syntax_highlighting',
];

const EXAMPLE_SET = new Set<string>(EXAMPLE_VALUES);

function parseBool(value: string | undefined): boolean {
  return value === '1' || value === 'true';
}

function parseVariant(raw: string | undefined): EditorVariant {
  const v = (raw ?? 'default').toLowerCase();
  return VARIANT_SET.has(v) ? (v as EditorVariant) : 'default';
}

function parseExample(raw: string | undefined): ExampleId | null {
  if (!raw) {
    return null;
  }
  const k = raw.trim().toLowerCase();
  return EXAMPLE_SET.has(k) ? (k as ExampleId) : null;
}

function syncTextarea(textarea: HTMLTextAreaElement, html: string): void {
  textarea.value = html;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
}

export type ToolbarBtn = {
  label: string;
  title: string;
  active?: () => boolean;
  run: () => void;
};

function runLinkPrompt(editor: Editor): void {
  const prev = editor.getAttributes('link').href as string | undefined;
  const url = window.prompt('URL', prev ?? 'https://');
  if (url === null) {
    return;
  }
  if (url === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
}

function runImagePrompt(editor: Editor): void {
  const url = window.prompt('URL de imagen', 'https://');
  if (url === null || url.trim() === '') {
    return;
  }
  editor.chain().focus().setImage({ src: url.trim() }).run();
}

function headingBtn(level: 1 | 2 | 3 | 4 | 5 | 6, editor: Editor): ToolbarBtn {
  return {
    label: `H${level}`,
    title: `Heading ${level}`,
    active: () => editor.isActive('heading', { level }),
    run: () => editor.chain().focus().toggleHeading({ level }).run(),
  };
}

function undoRedo(editor: Editor): ToolbarBtn[] {
  return [
    { label: '↶', title: 'Undo', run: () => editor.chain().focus().undo().run() },
    { label: '↷', title: 'Redo', run: () => editor.chain().focus().redo().run() },
  ];
}

function marks(editor: Editor): ToolbarBtn[] {
  return [
    {
      label: 'B',
      title: 'Bold',
      active: () => editor.isActive('bold'),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: 'I',
      title: 'Italic',
      active: () => editor.isActive('italic'),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: 'S',
      title: 'Strike',
      active: () => editor.isActive('strike'),
      run: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      label: '</>',
      title: 'Code',
      active: () => editor.isActive('code'),
      run: () => editor.chain().focus().toggleCode().run(),
    },
    {
      label: 'U',
      title: 'Underline',
      active: () => editor.isActive('underline'),
      run: () => editor.chain().focus().toggleUnderline().run(),
    },
  ];
}

function lists(editor: Editor): ToolbarBtn[] {
  return [
    {
      label: '•',
      title: 'Bullet list',
      active: () => editor.isActive('bulletList'),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: '1.',
      title: 'Ordered list',
      active: () => editor.isActive('orderedList'),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: '❝',
      title: 'Blockquote',
      active: () => editor.isActive('blockquote'),
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: '{}',
      title: 'Code block',
      active: () => editor.isActive('codeBlock'),
      run: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      label: '—',
      title: 'Horizontal rule',
      run: () => editor.chain().focus().setHorizontalRule().run(),
    },
  ];
}

function align(editor: Editor): ToolbarBtn[] {
  return [
    {
      label: '⬅',
      title: 'Align left',
      active: () => editor.isActive({ textAlign: 'left' }),
      run: () => editor.chain().focus().setTextAlign('left').run(),
    },
    {
      label: '⬛',
      title: 'Align center',
      active: () => editor.isActive({ textAlign: 'center' }),
      run: () => editor.chain().focus().setTextAlign('center').run(),
    },
    {
      label: '➡',
      title: 'Align right',
      active: () => editor.isActive({ textAlign: 'right' }),
      run: () => editor.chain().focus().setTextAlign('right').run(),
    },
    {
      label: '⬌',
      title: 'Justify',
      active: () => editor.isActive({ textAlign: 'justify' }),
      run: () => editor.chain().focus().setTextAlign('justify').run(),
    },
  ];
}

const paragraph = (editor: Editor): ToolbarBtn => ({
  label: '¶',
  title: 'Paragraph',
  active: () => editor.isActive('paragraph') && !editor.isActive('heading'),
  run: () => editor.chain().focus().setParagraph().run(),
});

const linkBtn = (editor: Editor): ToolbarBtn => ({
  label: '🔗',
  title: 'Link',
  active: () => editor.isActive('link'),
  run: () => runLinkPrompt(editor),
});

function variantPresetToolbarRows(editor: Editor, variant: EditorVariant): ToolbarBtn[][] {
  const u = undoRedo(editor);
  const m = marks(editor);
  const l = lists(editor);
  const a = align(editor);
  const p = paragraph(editor);

  switch (variant) {
    case 'headless':
      return [
        [...u, p, headingBtn(1, editor), headingBtn(2, editor), headingBtn(3, editor), headingBtn(4, editor), headingBtn(5, editor), headingBtn(6, editor)],
        [...m, linkBtn(editor)],
        [...l],
        [...a],
      ];
    case 'notion':
      return [
        [...u, headingBtn(1, editor), headingBtn(2, editor), headingBtn(3, editor), p],
        [...m.slice(0, 4), ...l.slice(0, 4)],
      ];
    case 'simple':
    case 'default':
      return [
        [...u, headingBtn(1, editor), headingBtn(2, editor), headingBtn(3, editor), p],
        [...m, linkBtn(editor)],
        [...l],
      ];
    case 'agent':
      return [
        [...u, headingBtn(1, editor), headingBtn(2, editor), headingBtn(3, editor), p],
        [...m, linkBtn(editor)],
        [...l.slice(0, 5)],
        [...a],
      ];
    default:
      return [[...u, ...m, ...l.slice(0, 3)]];
  }
}

function minimalToolbarRows(editor: Editor): ToolbarBtn[][] {
  return [[...undoRedo(editor), ...marks(editor).slice(0, 3), { label: '↵', title: 'Hard break', run: () => editor.chain().focus().setHardBreak().run() }]];
}

function formattingExtras(editor: Editor): ToolbarBtn[] {
  return [
    {
      label: '✎',
      title: 'Highlight',
      active: () => editor.isActive('highlight'),
      run: () => editor.chain().focus().toggleHighlight().run(),
    },
    {
      label: 'x₂',
      title: 'Subscript',
      active: () => editor.isActive('subscript'),
      run: () => editor.chain().focus().toggleSubscript().run(),
    },
    {
      label: 'x²',
      title: 'Superscript',
      active: () => editor.isActive('superscript'),
      run: () => editor.chain().focus().toggleSuperscript().run(),
    },
  ];
}

function tableToolbarRow(editor: Editor): ToolbarBtn[] {
  return [
    {
      label: '▦',
      title: 'Insert table',
      run: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      label: '+⌇',
      title: 'Add column before',
      run: () => editor.chain().focus().addColumnBefore().run(),
    },
    {
      label: '+═',
      title: 'Add row before',
      run: () => editor.chain().focus().addRowBefore().run(),
    },
    {
      label: '▥',
      title: 'Toggle header row',
      run: () => editor.chain().focus().toggleHeaderRow().run(),
    },
    {
      label: '✕',
      title: 'Delete table',
      run: () => editor.chain().focus().deleteTable().run(),
    },
  ];
}

function taskToolbarRow(editor: Editor): ToolbarBtn[] {
  return [
    {
      label: '☑',
      title: 'Task list',
      active: () => editor.isActive('taskList'),
      run: () => editor.chain().focus().toggleTaskList().run(),
    },
  ];
}

function imageToolbarRow(editor: Editor): ToolbarBtn[] {
  return [{ label: '🖼', title: 'Insert image', run: () => runImagePrompt(editor) }];
}

function toolbarRows(editor: Editor, variant: EditorVariant, example: ExampleId | null): ToolbarBtn[][] {
  if (!example) {
    return variantPresetToolbarRows(editor, variant);
  }

  switch (example) {
    case 'minimal':
      return minimalToolbarRows(editor);
    case 'formatting':
      return [...variantPresetToolbarRows(editor, 'simple'), formattingExtras(editor)];
    case 'tables':
      return [...variantPresetToolbarRows(editor, 'simple'), tableToolbarRow(editor)];
    case 'tasks':
      return [...variantPresetToolbarRows(editor, 'simple'), taskToolbarRow(editor)];
    case 'images':
      return [...variantPresetToolbarRows(editor, 'simple'), imageToolbarRow(editor)];
    case 'syntax_highlighting':
    case 'markdown_shortcuts':
    case 'long_text':
    case 'text_direction_rtl':
    case 'menus':
      return variantPresetToolbarRows(editor, 'simple');
    default:
      return variantPresetToolbarRows(editor, variant);
  }
}

/**
 * One continuous horizontal strip (scroll) — all actions in a single row.
 */
function attachToolbar(host: HTMLElement, editor: Editor, variant: EditorVariant, example: ExampleId | null): void {
  const bar = document.createElement('div');
  bar.className = 'tiptap-editor-toolbar';
  bar.setAttribute('role', 'toolbar');

  const rows = toolbarRows(editor, variant, example);
  const specsFlat = rows.flat();
  const rowEl = document.createElement('div');
  rowEl.className = 'tiptap-editor-toolbar__row tiptap-editor-toolbar__row--strip';
  const buttonsFlat: HTMLButtonElement[] = [];

  if (variant === 'agent' && !example) {
    const badge = document.createElement('span');
    badge.className = 'tiptap-editor-toolbar__badge tiptap-editor-toolbar__badge--lead';
    badge.textContent = 'Agent';
    badge.title = 'Superficie tipo AI — enlaza Tiptap AI Toolkit para funciones reales';
    rowEl.appendChild(badge);
  }

  for (const spec of specsFlat) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = spec.label;
    btn.title = spec.title;
    btn.className = 'tiptap-editor-toolbar__btn';
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      spec.run();
    });
    buttonsFlat.push(btn);
    rowEl.appendChild(btn);
  }

  bar.appendChild(rowEl);

  const mount = host.querySelector('[data-tiptap-mount]');
  if (mount?.parentElement) {
    host.insertBefore(bar, mount);
  } else {
    host.prepend(bar);
  }

  const refreshActive = (): void => {
    specsFlat.forEach((spec, i) => {
      const el = buttonsFlat[i];
      if (!el || !spec.active) return;
      el.classList.toggle('tiptap-editor-toolbar__btn--active', spec.active());
    });
  };

  editor.on('selectionUpdate', refreshActive);
  editor.on('transaction', refreshActive);
  refreshActive();
}

/** Applies light/dark classes from data-tiptap-theme-value (handles auto + OS changes). */
export function applyChromeTheme(root: HTMLElement): void {
  const mode = (root.dataset.tiptapThemeValue ?? 'light').toLowerCase();
  root.classList.remove('tiptap-theme-light', 'tiptap-theme-dark', 'tiptap-theme-auto');

  let effective: 'light' | 'dark';
  if (mode === 'auto') {
    root.classList.add('tiptap-theme-auto');
    effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else if (mode === 'dark') {
    effective = 'dark';
  } else {
    effective = 'light';
  }

  root.classList.add(effective === 'dark' ? 'tiptap-theme-dark' : 'tiptap-theme-light');

  if (mode === 'auto' && root.dataset.tiptapThemeAutoBound !== '1') {
    root.dataset.tiptapThemeAutoBound = '1';
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyChromeTheme(root));
  }
}

function attachAgentFab(root: HTMLElement): void {
  const surface = root.querySelector<HTMLElement>('.tiptap-editor-chrome') ?? root;
  surface.classList.add('tiptap-editor-surface--fab');
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'tiptap-editor-agent-fab';
  fab.setAttribute('aria-label', 'AI assistant');
  fab.innerHTML = '<span class="tiptap-editor-agent-fab__glyph" aria-hidden="true">✨</span>';
  fab.title = 'Demo visual: Tiptap AI Toolkit en https://tiptap.dev/product/ai-toolkit';
  fab.addEventListener('click', (ev) => {
    ev.preventDefault();
    window.alert(
      'Demo Symfony: para agentes que editan el documento usa Tiptap AI Toolkit (producto de plataforma).\n\nhttps://tiptap.dev/',
    );
  });
  surface.appendChild(fab);
}

export type MenuMount = { bubble: HTMLElement; floating: HTMLElement };

function wireMenuDom(editor: Editor, menu: MenuMount): void {
  const wire = (root: HTMLElement): void => {
    root.querySelectorAll<HTMLButtonElement>('[data-tiptap-menu-action]').forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        const act = btn.getAttribute('data-tiptap-menu-action');
        const chain = editor.chain().focus();
        switch (act) {
          case 'bold':
            chain.toggleBold().run();
            break;
          case 'italic':
            chain.toggleItalic().run();
            break;
          case 'strike':
            chain.toggleStrike().run();
            break;
          default:
            break;
        }
      });
    });
  };
  wire(menu.bubble);
  wire(menu.floating);
}

function buildExtensions(
  placeholder: string,
  variant: EditorVariant,
  example: ExampleId | null,
  menuMount: MenuMount | null,
): Extension[] {
  const headingLevels =
    variant === 'headless' && !example ? ([1, 2, 3, 4, 5, 6] as const) : ([1, 2, 3] as const);

  const starterOpts: Record<string, unknown> = {
    heading: { levels: [...headingLevels] },
  };

  if (example === 'minimal') {
    starterOpts.heading = false;
    starterOpts.blockquote = false;
    starterOpts.bulletList = false;
    starterOpts.orderedList = false;
    starterOpts.horizontalRule = false;
    starterOpts.codeBlock = false;
  }

  if (example === 'syntax_highlighting') {
    starterOpts.codeBlock = false;
  }

  const exts: Extension[] = [
    StarterKit.configure(starterOpts),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'tiptap-editor-link',
      },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
  ];

  if (example === 'formatting') {
    exts.push(Highlight.configure({ multicolor: true }), Subscript, Superscript);
  }

  if (example === 'tables') {
    exts.push(
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    );
  }

  if (example === 'tasks') {
    exts.push(
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    );
  }

  if (example === 'images') {
    exts.push(
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
    );
  }

  if (example === 'markdown_shortcuts') {
    exts.push(Typography);
  }

  if (example === 'long_text') {
    exts.push(CharacterCount.configure({ limit: null }));
  }

  if (example === 'syntax_highlighting') {
    exts.push(
      CodeBlockLowlight.configure({
        lowlight,
      }),
    );
  }

  if (example === 'menus' && menuMount) {
    menuMount.bubble.classList.add('tiptap-example-bubble');
    menuMount.bubble.innerHTML =
      '<button type="button" class="tiptap-editor-toolbar__btn" data-tiptap-menu-action="bold">B</button>' +
      '<button type="button" class="tiptap-editor-toolbar__btn" data-tiptap-menu-action="italic">I</button>' +
      '<button type="button" class="tiptap-editor-toolbar__btn" data-tiptap-menu-action="strike">S</button>';

    menuMount.floating.classList.add('tiptap-example-floating');
    menuMount.floating.innerHTML =
      '<span class="tiptap-example-floating__hint">Menú flotante · escribe en una línea vacía para verlo</span>';

    exts.push(
      BubbleMenu.configure({
        element: menuMount.bubble,
        shouldShow: ({ editor: ed }) => !ed.isActive('codeBlock'),
      }),
      FloatingMenu.configure({
        element: menuMount.floating,
      }),
    );
  }

  if (placeholder !== '') {
    exts.push(
      Placeholder.configure({
        placeholder,
      }),
    );
  }

  return exts;
}

function attachCharacterCountFooter(chrome: HTMLElement, editor: Editor): void {
  const footer = document.createElement('div');
  footer.className = 'tiptap-editor-charcount';
  chrome.appendChild(footer);
  const upd = (): void => {
    const storage = editor.storage.characterCount as { characters: () => number; words: () => number };
    footer.textContent = `${storage.characters()} caracteres · ${storage.words()} palabras`;
  };
  editor.on('update', upd);
  upd();
}

/**
 * Initializes one widget root (textarea + mount).
 */
export function initTiptapRoot(root: HTMLElement): void {
  if (root.dataset.tiptapInitialized === '1') {
    return;
  }

  const textarea = root.querySelector('textarea');
  const mount = root.querySelector<HTMLElement>('[data-tiptap-mount]');
  if (!(textarea instanceof HTMLTextAreaElement) || !mount) {
    log.warn('skipped: textarea or mount missing');
    return;
  }

  const variant = parseVariant(root.dataset.tiptapVariantValue);
  const example = parseExample(root.dataset.tiptapExampleValue);
  applyChromeTheme(root);
  root.classList.add(`tiptap-variant-${variant}`);
  if (example) {
    root.classList.add(`tiptap-example-${example}`);
  }

  const debug = parseBool(root.dataset.tiptapDebugValue);
  log.setDebug(debug);

  const toolbar = parseBool(root.dataset.tiptapToolbarValue);

  const minHeight = root.dataset.tiptapMinHeightValue ?? '240px';
  const placeholder = root.dataset.tiptapPlaceholderValue ?? '';

  mount.style.minHeight = minHeight;

  const chrome =
    root.querySelector<HTMLElement>('.tiptap-editor-chrome') ?? (variant === 'headless' ? root : null);

  let menuMount: MenuMount | null = null;
  if (example === 'menus') {
    menuMount = {
      bubble: document.createElement('div'),
      floating: document.createElement('div'),
    };
    const menuHost = chrome ?? root;
    menuHost.appendChild(menuMount.bubble);
    menuHost.appendChild(menuMount.floating);
  }

  const editorProps: {
    attributes: Record<string, string>;
  } = {
    attributes: {
      class: 'tiptap-editor-prose',
    },
  };

  if (example === 'text_direction_rtl') {
    editorProps.attributes.dir = 'rtl';
    editorProps.attributes.lang = 'ar';
  }

  const editor = new Editor({
    element: mount,
    extensions: buildExtensions(placeholder, variant, example, menuMount),
    content: textarea.value || '<p></p>',
    editorProps,
    onUpdate: () => {
      syncTextarea(textarea, editor.getHTML());
    },
  });

  if (example === 'menus' && menuMount) {
    wireMenuDom(editor, menuMount);
  }

  syncTextarea(textarea, editor.getHTML());

  if (toolbar && chrome) {
    attachToolbar(chrome, editor, variant, example);
  }

  if (example === 'long_text') {
    const ccHost = chrome ?? root;
    attachCharacterCountFooter(ccHost, editor);
  }

  if (variant === 'agent' && !example) {
    attachAgentFab(root);
  }

  root.dataset.tiptapInitialized = '1';
}

function discoverRoots(doc: Document | HTMLElement): HTMLElement[] {
  return Array.from(doc.querySelectorAll<HTMLElement>(ROOT_SELECTOR));
}

export function runInit(): void {
  for (const root of discoverRoots(document)) {
    initTiptapRoot(root);
  }
}

export function runInitAndObserve(): void {
  runInit();
  const observer = new MutationObserver(() => runInit());
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

if (typeof window !== 'undefined') {
  (
    window as unknown as {
      NowoTiptapEditor?: {
        initTiptapRoot: typeof initTiptapRoot;
        applyChromeTheme: typeof applyChromeTheme;
        runInit: typeof runInit;
        runInitAndObserve: typeof runInitAndObserve;
      };
    }
  ).NowoTiptapEditor = {
    initTiptapRoot,
    applyChromeTheme,
    runInit,
    runInitAndObserve,
  };
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInitAndObserve);
  } else {
    runInitAndObserve();
  }
}
