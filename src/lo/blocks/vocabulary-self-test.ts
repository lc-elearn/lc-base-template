/**
 * vocabulary-self-test.ts — the word bank's self-test as one pure reducer (E63, spec §5).
 * The view holds only `useReducer(selfTestReducer, INITIAL_SELF_TEST)`.
 *
 * Either/or (W7): `hidden` is one side or none, so hiding one side shows the other.
 * Words are revealed one by one, by term (unique in a word bank, schema rule 5; a plain
 * list that repeats a word reveals both, it is one word).
 * `lastRevealed` is the word the view moves focus to. Switching view keeps the hidden
 * side and forgets what was revealed; pressing the pressed button again shows all.
 *
 * Initial state hides nothing, so the prerendered markup equals the first client render.
 */
import { NATIVE_LANGUAGE_NAME, TARGET_LANGUAGE_NAME } from '@/lib/lang';

/** Which side of every entry a hide button covers: the course language, or English. */
export type HideSide = 'target' | 'native';

/** The language each side of a row is in, by name: the one map the controls and rows share. */
export const LANGUAGE_NAMES: Readonly<Record<HideSide, string>> = {
  target: TARGET_LANGUAGE_NAME,
  native: NATIVE_LANGUAGE_NAME,
};

export interface SelfTestState {
  readonly hidden: HideSide | 'none';
  /** Terms revealed since the side was hidden or the view switched. */
  readonly revealed: readonly string[];
  /** The term revealed last, which takes focus; null when there is none. */
  readonly lastRevealed: string | null;
  /**
   * The ROW whose Reveal was pressed, which takes focus. A word listed under two topics
   * is one word (revealed in both places) but two rows; focus goes to the one pressed.
   */
  readonly lastRow: string | null;
}

export type SelfTestAction =
  | { readonly type: 'hide'; readonly side: HideSide }
  | { readonly type: 'reveal'; readonly term: string; readonly row?: string }
  | { readonly type: 'switch-view' };

export const INITIAL_SELF_TEST: SelfTestState = {
  hidden: 'none',
  revealed: [],
  lastRevealed: null,
  lastRow: null,
};

export function selfTestReducer(state: SelfTestState, action: SelfTestAction): SelfTestState {
  switch (action.type) {
    case 'hide':
      return {
        hidden: state.hidden === action.side ? 'none' : action.side,
        revealed: [],
        lastRevealed: null,
        lastRow: null,
      };
    case 'reveal':
      if (state.hidden === 'none' || state.revealed.includes(action.term)) return state;
      return {
        ...state,
        revealed: [...state.revealed, action.term],
        lastRevealed: action.term,
        lastRow: action.row ?? action.term,
      };
    case 'switch-view':
      return { ...state, revealed: [], lastRevealed: null, lastRow: null };
  }
}

/** Whether `side` of the entry `term` is hidden now. */
export function isHidden(state: SelfTestState, term: string, side: HideSide): boolean {
  return state.hidden === side && !state.revealed.includes(term);
}

/** Whether any of `terms` (the entries shown) has a side hidden: row clicks stop (W8). */
export function isAnyHidden(state: SelfTestState, terms: readonly string[]): boolean {
  return state.hidden !== 'none' && terms.some((term) => !state.revealed.includes(term));
}
