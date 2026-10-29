import { describe, expect, it, vi } from 'vitest';

import { attachSuggestionHook, fetchCandidates, matchTrigger, readSuggestionConfig, SuggestionList } from './suggestion';
import type { SuggestionConfig, SuggestionEditor } from './suggestion';

const triggers = [
  { trigger: '@', url: '/people' },
  { trigger: '#doc', url: '/pages?space=x' },
  { trigger: '/doc', url: '/pages' },
];
const config: SuggestionConfig = { triggers, listLabel: 'Pick', emptyLabel: 'None' };

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function key(name: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: name, cancelable: true, bubbles: true });
}

describe('readSuggestionConfig', () => {
  it('reads valid triggers only', () => {
    const root = document.createElement('div');
    expect(readSuggestionConfig(root)).toBeNull();
    root.dataset.tiptapSuggestionsValue = 'not json';
    expect(readSuggestionConfig(root)).toBeNull();
    root.dataset.tiptapSuggestionsValue = '{"trigger":"@"}';
    expect(readSuggestionConfig(root)).toBeNull();
    root.dataset.tiptapSuggestionsValue = JSON.stringify([{ trigger: '@', url: '/p' }, { trigger: '', url: '/x' }, null, { url: '/y' }]);
    expect(readSuggestionConfig(root)).toEqual({ triggers: [{ trigger: '@', url: '/p' }], listLabel: 'Suggestions', emptyLabel: 'No results' });
    root.dataset.tiptapSuggestionsLabelValue = 'L';
    root.dataset.tiptapSuggestionsEmptyValue = 'E';
    expect(readSuggestionConfig(root)?.listLabel).toBe('L');
    expect(readSuggestionConfig(root)?.emptyLabel).toBe('E');
  });
});

describe('matchTrigger', () => {
  it('matches one-character and word triggers before the caret', () => {
    expect(matchTrigger('hello @an', triggers)).toEqual({ trigger: triggers[0], query: 'an', length: 3 });
    expect(matchTrigger('@', triggers)).toEqual({ trigger: triggers[0], query: '', length: 1 });
    expect(matchTrigger('mail a@b', triggers)).toBeNull();
    expect(matchTrigger('see #doc deploy plan', triggers)).toEqual({ trigger: triggers[1], query: 'deploy plan', length: 16 });
    expect(matchTrigger('/doc', triggers)).toEqual({ trigger: triggers[2], query: '', length: 4 });
    expect(matchTrigger('plain text', triggers)).toBeNull();
  });
});

describe('fetchCandidates', () => {
  it('queries with q and keeps valid items', async () => {
    const fetchImpl = vi.fn(async (_url: string) => json(200, [{ id: '1', label: 'Ana', token: '@ana' }, { id: '2' }]));
    expect(await fetchCandidates('/people', 'a n', fetchImpl)).toEqual([{ id: '1', label: 'Ana', token: '@ana' }]);
    expect(fetchImpl.mock.calls[0][0]).toBe('/people?q=a%20n');
    await fetchCandidates('/pages?space=x', 'd', fetchImpl);
    expect(fetchImpl.mock.calls[1][0]).toBe('/pages?space=x&q=d');
    expect(await fetchCandidates('/p', '', async () => json(404, []))).toEqual([]);
    expect(await fetchCandidates('/p', '', async () => json(200, { not: 'a list' }))).toEqual([]);
    expect(await fetchCandidates('/p', '', async () => Promise.reject(new Error('offline')))).toEqual([]);
  });
});

describe('SuggestionList', () => {
  it('renders the listbox, moves the active option and closes', () => {
    const root = document.createElement('div');
    const surface = document.createElement('div');
    const onPick = vi.fn();
    const list = new SuggestionList(root, surface, config, onPick);

    expect(surface.getAttribute('aria-autocomplete')).toBe('list');
    expect(list.isOpen).toBe(false);
    list.open([
      { id: '1', label: 'Ana', hint: 'ana@x', token: '@ana' },
      { id: '2', label: 'Bob', token: '@bob' },
    ]);
    expect(list.isOpen).toBe(true);
    expect(list.element.getAttribute('role')).toBe('listbox');
    expect(surface.getAttribute('aria-controls')).toBe(list.element.id);
    expect(surface.getAttribute('aria-activedescendant')).toBe(`${list.element.id}-0`);
    expect(list.element.querySelector('.tiptap-editor-suggestions__hint')?.textContent).toBe('ana@x');
    list.move(1);
    expect(list.current()?.label).toBe('Bob');
    list.move(1);
    expect(list.current()?.label).toBe('Ana');
    list.move(-1);
    expect(list.element.querySelectorAll('[aria-selected="true"]')[0].textContent).toBe('Bob');

    list.element.querySelectorAll('li')[0].dispatchEvent(new MouseEvent('mousedown', { cancelable: true }));
    expect(onPick).toHaveBeenCalledWith({ id: '1', label: 'Ana', hint: 'ana@x', token: '@ana' });

    list.open([]);
    expect(list.element.textContent).toBe('None');
    expect(surface.hasAttribute('aria-activedescendant')).toBe(false);
    list.move(1);
    expect(list.current()).toBeNull();
    list.close();
    expect(surface.hasAttribute('aria-controls')).toBe(false);
  });
});

describe('attachSuggestionHook', () => {
  function setup(text: string, items: unknown[]) {
    const root = document.createElement('div');
    const surface = document.createElement('div');
    root.appendChild(surface);
    let changed: () => void = () => undefined;
    const editor: SuggestionEditor & { text: string; replaced: Array<[number, string]> } = {
      surface,
      text,
      replaced: [],
      textBefore() {
        return this.text;
      },
      replaceBefore(length, value) {
        this.replaced.push([length, value]);
      },
      onChange(callback) {
        changed = callback;
      },
    };
    const hook = attachSuggestionHook(root, editor, config, async () => json(200, items), 0);

    return { root, surface, editor, hook, change: () => changed() };
  }

  it('opens on a trigger, drives the list with the keyboard and inserts the token', async () => {
    const { root, editor, hook } = setup('ping @a', [
      { id: '1', label: 'Ana', token: '@ana' },
      { id: '2', label: 'Al', token: '@al' },
    ]);
    await hook.refresh();
    expect(hook.list.isOpen).toBe(true);

    const other = key('a');
    root.dispatchEvent(other);
    expect(other.defaultPrevented).toBe(false);

    const down = key('ArrowDown');
    root.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    root.dispatchEvent(key('ArrowUp'));
    root.dispatchEvent(key('ArrowDown'));
    root.dispatchEvent(key('Enter'));
    expect(editor.replaced).toEqual([[2, '@al ']]);
    expect(hook.list.isOpen).toBe(false);

    const idle = key('Enter');
    root.dispatchEvent(idle);
    expect(idle.defaultPrevented).toBe(false);
  });

  it('Tab inserts, Escape closes, an empty list closes on Enter, text without a trigger closes', async () => {
    const { root, editor, hook } = setup('#doc dep', [{ id: 'p', label: 'Deploy', token: '[[wiki:p]]' }]);
    await hook.refresh();
    root.dispatchEvent(key('Tab'));
    expect(editor.replaced).toEqual([[8, '[[wiki:p]] ']]);

    await hook.refresh();
    root.dispatchEvent(key('Escape'));
    expect(hook.list.isOpen).toBe(false);

    const empty = setup('@zz', []);
    await empty.hook.refresh();
    expect(empty.hook.list.isOpen).toBe(true);
    empty.root.dispatchEvent(key('Enter'));
    expect(empty.hook.list.isOpen).toBe(false);
    expect(empty.editor.replaced).toEqual([]);

    editor.text = 'no trigger here';
    await hook.refresh();
    expect(hook.list.isOpen).toBe(false);
  });

  it('debounces changes and ignores a stale answer', async () => {
    vi.useFakeTimers();
    const { hook, change, editor } = setup('@a', [{ id: '1', label: 'Ana', token: '@ana' }]);
    change();
    change();
    await vi.runAllTimersAsync();
    expect(hook.list.isOpen).toBe(true);
    vi.useRealTimers();

    const slow = setup('@a', [{ id: '1', label: 'Ana', token: '@ana' }]);
    const first = slow.hook.refresh();
    slow.editor.text = 'nothing';
    await slow.hook.refresh();
    await first;
    expect(slow.hook.list.isOpen).toBe(false);
    expect(editor.replaced).toEqual([]);
  });

  it('a pick without a pending match only closes the list', () => {
    const root = document.createElement('div');
    const surface = document.createElement('div');
    const editor: SuggestionEditor = { surface, textBefore: () => '', replaceBefore: vi.fn(), onChange: () => undefined };
    const hook = attachSuggestionHook(root, editor, config, async () => json(200, []));
    hook.list.open([{ id: '1', label: 'Ana', token: '@ana' }]);
    hook.list.element.querySelector('li')?.dispatchEvent(new MouseEvent('mousedown', { cancelable: true }));
    expect(editor.replaceBefore).not.toHaveBeenCalled();
    expect(hook.list.isOpen).toBe(false);
  });
});
