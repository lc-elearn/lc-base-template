/**
 * vocabulary-self-test.test.ts — the word bank's self-test (E63, spec §5, W7): hide one
 * side, recall, reveal word by word. Either/or: hiding one side shows the other.
 */
import { describe, expect, test } from 'vitest';
import {
  INITIAL_SELF_TEST,
  isAnyHidden,
  isHidden,
  selfTestReducer,
  type SelfTestAction,
  type SelfTestState,
} from './vocabulary-self-test';

const run = (...actions: SelfTestAction[]): SelfTestState =>
  actions.reduce(selfTestReducer, INITIAL_SELF_TEST);

describe('selfTestReducer', () => {
  test('starts with nothing hidden, so the prerender is unchanged', () => {
    expect(INITIAL_SELF_TEST).toEqual({
      hidden: 'none',
      revealed: [],
      lastRevealed: null,
      lastRow: null,
    });
  });

  test('hide hides one side', () => {
    const state = run({ type: 'hide', side: 'target' });
    expect(isHidden(state, 'брак', 'target')).toBe(true);
    expect(isHidden(state, 'брак', 'native')).toBe(false);
  });

  test('either/or: hiding the other side releases the first', () => {
    const state = run({ type: 'hide', side: 'target' }, { type: 'hide', side: 'native' });
    expect(state.hidden).toBe('native');
    expect(isHidden(state, 'брак', 'target')).toBe(false);
  });

  test('reveal shows one word and remembers it as the one to focus', () => {
    const state = run({ type: 'hide', side: 'target' }, { type: 'reveal', term: 'брак' });
    expect(isHidden(state, 'брак', 'target')).toBe(false);
    expect(isHidden(state, 'жена', 'target')).toBe(true);
    expect(state.lastRevealed).toBe('брак');
  });

  test('reveal remembers the row pressed, so focus goes to that copy of a word', () => {
    const state = run(
      { type: 'hide', side: 'target' },
      { type: 'reveal', term: 'условия', row: 'topic-b:0' },
    );
    expect(state.lastRow).toBe('topic-b:0');
    // One word: it is revealed in every place it shows.
    expect(isHidden(state, 'условия', 'target')).toBe(false);
  });

  test('reveal does nothing when nothing is hidden, or twice', () => {
    expect(run({ type: 'reveal', term: 'брак' })).toEqual(INITIAL_SELF_TEST);
    const once = run({ type: 'hide', side: 'target' }, { type: 'reveal', term: 'брак' });
    expect(selfTestReducer(once, { type: 'reveal', term: 'брак' })).toBe(once);
  });

  test('switching view keeps the hidden side and clears what was revealed', () => {
    const state = run(
      { type: 'hide', side: 'native' },
      { type: 'reveal', term: 'брак' },
      { type: 'switch-view' },
    );
    expect(state).toEqual({ hidden: 'native', revealed: [], lastRevealed: null, lastRow: null });
  });

  test('pressing the pressed button again releases it and shows everything', () => {
    const state = run(
      { type: 'hide', side: 'target' },
      { type: 'reveal', term: 'брак' },
      { type: 'hide', side: 'target' },
    );
    expect(state).toEqual(INITIAL_SELF_TEST);
  });

  test('never changes the state it was given', () => {
    const before = run({ type: 'hide', side: 'target' });
    const copy = structuredClone(before);
    selfTestReducer(before, { type: 'reveal', term: 'брак' });
    expect(before).toEqual(copy);
  });
});

describe('isAnyHidden', () => {
  test('false with nothing hidden, true while one word is, false once all are revealed', () => {
    const shown = ['брак', 'жена'];
    expect(isAnyHidden(INITIAL_SELF_TEST, shown)).toBe(false);
    const hidden = run({ type: 'hide', side: 'target' }, { type: 'reveal', term: 'брак' });
    expect(isAnyHidden(hidden, shown)).toBe(true);
    expect(isAnyHidden(selfTestReducer(hidden, { type: 'reveal', term: 'жена' }), shown)).toBe(
      false,
    );
  });
});
