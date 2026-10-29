/**
 * Suggestion hook (1.6): typing a configured trigger (`@`, `#doc`, `/doc`, …) opens a list of candidates fetched from
 * a host URL; the list follows the combobox pattern of the chat mentions (`role="listbox"` / `option`,
 * `aria-activedescendant`, Up / Down, Enter / Tab to insert, Escape to close) and inserts the candidate's token as
 * text (e.g. `@ana` or `[[wiki:<uuid>]]`).
 */

import type { FetchLike } from './upload';

export type SuggestionTrigger = {
  trigger: string;
  url: string;
};

export type SuggestionItem = {
  id: string;
  label: string;
  hint?: string;
  token: string;
};

export type SuggestionConfig = {
  triggers: SuggestionTrigger[];
  listLabel: string;
  emptyLabel: string;
};

export type TriggerMatch = {
  trigger: SuggestionTrigger;
  query: string;
  /** Characters to replace before the caret (trigger + query). */
  length: number;
};

/** What the hook needs from the editor. */
export type SuggestionEditor = {
  surface: HTMLElement;
  textBefore(): string;
  replaceBefore(length: number, text: string): void;
  onChange(callback: () => void): void;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

/** Reads the suggestion configuration rendered by the form theme, or null when the hook is off. */
export function readSuggestionConfig(root: HTMLElement): SuggestionConfig | null {
  let triggers: SuggestionTrigger[] = [];
  try {
    const parsed = JSON.parse(root.dataset.tiptapSuggestionsValue ?? '[]') as unknown;
    triggers = Array.isArray(parsed)
      ? parsed.filter(
          (item): item is SuggestionTrigger =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as SuggestionTrigger).trigger === 'string' &&
            (item as SuggestionTrigger).trigger !== '' &&
            typeof (item as SuggestionTrigger).url === 'string',
        )
      : [];
  } catch {
    triggers = [];
  }

  if (triggers.length === 0) {
    return null;
  }

  return {
    triggers,
    listLabel: root.dataset.tiptapSuggestionsLabelValue || 'Suggestions',
    emptyLabel: root.dataset.tiptapSuggestionsEmptyValue || 'No results',
  };
}

/**
 * The trigger typed right before the caret, if any: a one-character trigger takes a query without spaces (`@an`), a
 * longer one an optional query after a space (`#doc deploy plan`). The trigger starts the text or follows a space.
 */
export function matchTrigger(textBefore: string, triggers: SuggestionTrigger[]): TriggerMatch | null {
  for (const trigger of triggers) {
    const t = escapeRegExp(trigger.trigger);
    const pattern =
      trigger.trigger.length === 1
        ? new RegExp(`(?:^|\\s)(${t}([\\p{L}\\p{N}._-]{0,40}))$`, 'u')
        : new RegExp(`(?:^|\\s)(${t}(?:\\s([^\\n]{0,60}))?)$`, 'u');
    const match = pattern.exec(textBefore);
    if (match) {
      return { trigger, query: (match[2] ?? '').trim(), length: match[1].length };
    }
  }

  return null;
}

/** GETs the candidates for a query (`?q=`); an error answers no candidates. */
export async function fetchCandidates(url: string, query: string, fetchImpl: FetchLike): Promise<SuggestionItem[]> {
  const separator = url.includes('?') ? '&' : '?';
  try {
    const response = await fetchImpl(`${url}${separator}q=${encodeURIComponent(query)}`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as unknown;

    return Array.isArray(data)
      ? data.filter(
          (item): item is SuggestionItem =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as SuggestionItem).token === 'string' &&
            typeof (item as SuggestionItem).label === 'string',
        )
      : [];
  } catch {
    return [];
  }
}

let listCounter = 0;

/** The listbox under the editor and its keyboard state. */
export class SuggestionList {
  readonly element: HTMLUListElement;
  private items: SuggestionItem[] = [];
  private active = 0;

  constructor(
    root: HTMLElement,
    private readonly surface: HTMLElement,
    private readonly config: SuggestionConfig,
    private readonly onPick: (item: SuggestionItem) => void,
  ) {
    listCounter += 1;
    this.element = document.createElement('ul');
    this.element.id = `tiptap-suggestions-${listCounter}`;
    this.element.className = 'tiptap-editor-suggestions';
    this.element.setAttribute('role', 'listbox');
    this.element.setAttribute('aria-label', config.listLabel);
    this.element.hidden = true;
    root.appendChild(this.element);
    this.surface.setAttribute('aria-autocomplete', 'list');
  }

  get isOpen(): boolean {
    return !this.element.hidden;
  }

  open(items: SuggestionItem[]): void {
    this.items = items;
    this.active = 0;
    this.element.replaceChildren();
    if (items.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'tiptap-editor-suggestions__empty';
      empty.setAttribute('role', 'option');
      empty.setAttribute('aria-disabled', 'true');
      empty.id = `${this.element.id}-empty`;
      empty.textContent = this.config.emptyLabel;
      this.element.appendChild(empty);
    }
    items.forEach((item, index) => {
      const option = document.createElement('li');
      option.id = `${this.element.id}-${index}`;
      option.className = 'tiptap-editor-suggestions__option';
      option.setAttribute('role', 'option');
      option.dataset.suggestionId = item.id;
      const label = document.createElement('span');
      label.className = 'tiptap-editor-suggestions__label';
      label.textContent = item.label;
      option.appendChild(label);
      if (item.hint) {
        const hint = document.createElement('span');
        hint.className = 'tiptap-editor-suggestions__hint';
        hint.textContent = item.hint;
        option.appendChild(hint);
      }
      option.addEventListener('mousedown', (event) => {
        event.preventDefault();
        this.onPick(item);
      });
      this.element.appendChild(option);
    });
    this.element.hidden = false;
    this.surface.setAttribute('aria-controls', this.element.id);
    this.highlight();
  }

  close(): void {
    this.element.hidden = true;
    this.items = [];
    this.surface.removeAttribute('aria-controls');
    this.surface.removeAttribute('aria-activedescendant');
  }

  move(delta: number): void {
    if (this.items.length === 0) {
      return;
    }
    this.active = (this.active + delta + this.items.length) % this.items.length;
    this.highlight();
  }

  current(): SuggestionItem | null {
    return this.items[this.active] ?? null;
  }

  private highlight(): void {
    const options = Array.from(this.element.querySelectorAll<HTMLElement>('.tiptap-editor-suggestions__option'));
    options.forEach((option, index) => option.setAttribute('aria-selected', index === this.active ? 'true' : 'false'));
    const current = options[this.active];
    if (current) {
      this.surface.setAttribute('aria-activedescendant', current.id);
    } else {
      this.surface.removeAttribute('aria-activedescendant');
    }
  }
}

/**
 * Wires the hook: matches triggers on every change, fetches candidates (debounced, latest query wins), handles the
 * list keys before ProseMirror (capture phase on the root) and inserts the picked token.
 */
export function attachSuggestionHook(
  root: HTMLElement,
  editor: SuggestionEditor,
  config: SuggestionConfig,
  fetchImpl: FetchLike,
  debounceMs = 150,
): { list: SuggestionList; refresh: () => Promise<void> } {
  let match: TriggerMatch | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let sequence = 0;

  const pick = (item: SuggestionItem): void => {
    if (match) {
      editor.replaceBefore(match.length, `${item.token} `);
    }
    match = null;
    list.close();
  };
  const list = new SuggestionList(root, editor.surface, config, pick);

  const refresh = async (): Promise<void> => {
    match = matchTrigger(editor.textBefore(), config.triggers);
    if (!match) {
      list.close();
      return;
    }
    sequence += 1;
    const mine = sequence;
    const items = await fetchCandidates(match.trigger.url, match.query, fetchImpl);
    if (mine === sequence && match) {
      list.open(items);
    }
  };

  editor.onChange(() => {
    clearTimeout(timer);
    timer = setTimeout(() => void refresh(), debounceMs);
  });

  root.addEventListener(
    'keydown',
    (event: KeyboardEvent) => {
      if (!list.isOpen) {
        return;
      }
      const handled = ((): boolean => {
        switch (event.key) {
          case 'ArrowDown':
            list.move(1);
            return true;
          case 'ArrowUp':
            list.move(-1);
            return true;
          case 'Enter':
          case 'Tab': {
            const item = list.current();
            if (item) {
              pick(item);
            } else {
              list.close();
            }
            return true;
          }
          case 'Escape':
            list.close();
            return true;
          default:
            return false;
        }
      })();
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );

  return { list, refresh };
}
