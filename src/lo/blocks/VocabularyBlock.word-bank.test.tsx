// @vitest-environment happy-dom
/**
 * VocabularyBlock.word-bank.test.tsx — the word bank as a learner uses it (E63, spec
 * §4–5): the A–Z view's letter headings, and the self-test that hides one side and
 * reveals word by word. Mounted, because both need clicks.
 *
 * Language names are derived from the course language, never written in: the Russian
 * course runs these tests with `"languageCode": "ru"` (TODO, 2026-11-09).
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test } from 'vitest';
import { VocabularyBlock } from './VocabularyBlock';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const CLIP = 'audio/lo-00-example/placeholder.m4a';

const BANK = {
  topics: [{ id: 'one', heading: 'Topic one' }],
  items: [
    { term: 'beta', gloss: 'second', audio: CLIP, topic: 'one' },
    { term: 'alpha', gloss: 'first', audio: CLIP, topic: 'one' },
    { term: 'alpha beta', gloss: 'both', topic: 'one', only: 'topics' },
    { term: 'gamma', gloss: 'third', only: 'alphabetical' },
    { term: 'amber', gloss: 'fourth', only: 'alphabetical' },
  ],
};

let root: Root | undefined;
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.body.innerHTML = '';
});

function mount(options: Record<string, boolean>): HTMLElement {
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => root?.render(<VocabularyBlock content={BANK} options={options} />));
  return container;
}

/** The button whose accessible name or text is exactly `name`. */
function button(container: HTMLElement, name: string): HTMLButtonElement {
  const found = Array.from(container.querySelectorAll('button')).find(
    (element) => (element.getAttribute('aria-label') ?? element.textContent) === name,
  );
  if (found === undefined) throw new Error(`no button named "${name}"`);
  return found;
}

const press = (element: HTMLElement) => act(() => element.click());
const headings = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('h4')).map((heading) => heading.textContent);
const terms = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('dt')).map((term) => term.textContent);

describe('A–Z view with letter headings', () => {
  test('one centred <h4> per letter, the rule drawn in CSS', () => {
    const container = mount({ letterHeadings: true });
    press(button(container, 'Alphabetical'));

    expect(headings(container)).toEqual(['A', 'B', 'G']);
    expect(terms(container)).toEqual(['alpha', 'amber', 'beta', 'gamma']);
    const heading = container.querySelector('h4') as HTMLElement;
    expect(heading.className).toContain('vocabulary-letter');
    // The heading holds its letter and nothing else: the rules are pseudo-elements.
    expect(heading.childNodes).toHaveLength(1);
  });

  test('a second press reverses the list, and the headings with it', () => {
    const container = mount({ letterHeadings: true });
    press(button(container, 'Alphabetical'));
    press(button(container, 'Alphabetical'));

    expect(headings(container)).toEqual(['G', 'B', 'A']);
    expect(terms(container)).toEqual(['gamma', 'beta', 'amber', 'alpha']);
  });

  test('without letterHeadings, the A–Z view is one list', () => {
    const container = mount({});
    press(button(container, 'Alphabetical'));
    expect(headings(container)).toEqual([]);
    expect(terms(container)).toEqual(['alpha', 'amber', 'beta', 'gamma']);
  });
});
