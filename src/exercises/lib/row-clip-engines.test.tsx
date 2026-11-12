// @vitest-environment happy-dom
/**
 * row-clip-engines.test.tsx — in every exercise whose rows carry their own clip, a click
 * on the row plays it and a click on the row's own control does not (E62).
 * Spec: docs/specs/2026-11-12-row-click-audio-design.md §5–6.
 */
import { act, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ROW_CLIP_ROW_SELECTOR } from '@/audio/row-clip';
import type { ExerciseComponentProps } from '@/exercises/lazy-registry';
import DictationExercise from '@/exercises/dictation/DictationExercise';
import { dictationFixtures } from '@/exercises/dictation/dictation.fixture';
import DragFillGapsExercise from '@/exercises/drag-fill-gaps/DragFillGapsExercise';
import InlineTypedGapExercise from '@/exercises/inline-gap/InlineTypedGapExercise';
import { inlineGapFixtures } from '@/exercises/inline-gap/inline-gap.fixture';
import LineMatchExercise from '@/exercises/line-match/LineMatchExercise';
import PhraseReorderExercise from '@/exercises/phrase-reorder/PhraseReorderExercise';
import { phraseReorderFixtures } from '@/exercises/phrase-reorder/phrase-reorder.fixture';
import WordSpotExercise from '@/exercises/word-spot/WordSpotExercise';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root | undefined;
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.body.innerHTML = '';
});

const CLIP = 'audio/showcase-demo/inline-gap/q1.wav';

const fixture = (list: readonly { id: string; config: unknown }[], id: string): unknown => {
  const found = list.find((entry) => entry.id === id);
  if (found === undefined) throw new Error(`no fixture ${id}`);
  return found.config;
};

/** [name, engine, config, selector of the control inside a row that must NOT play] */
const CASES: [string, ComponentType<ExerciseComponentProps>, unknown, string][] = [
  [
    'inline-gap, independent clips',
    InlineTypedGapExercise,
    fixture(inlineGapFixtures, 'inline-gap-audio'),
    'input',
  ],
  [
    'inline-gap, master playlist',
    InlineTypedGapExercise,
    fixture(inlineGapFixtures, 'inline-gap-master'),
    'input',
  ],
  ['text-entry (dictation)', DictationExercise, dictationFixtures[0]?.config, 'input'],
  [
    'phrase-reorder',
    PhraseReorderExercise,
    phraseReorderFixtures[0]?.config,
    'button:not([data-row-clip-speaker])',
  ],
  [
    'drag-fill-gaps',
    DragFillGapsExercise,
    {
      type: 'drag-fill-gaps',
      content: { items: [{ text: 'Yo [soy] y ella [vive].', audio: CLIP }] },
    },
    'button:not([data-row-clip-speaker])',
  ],
  [
    'word-spot',
    WordSpotExercise,
    { type: 'word-spot', content: { items: [{ text: 'El [ch]ico [ch]ileno.', audio: CLIP }] } },
    'button:not([data-row-clip-speaker])',
  ],
  [
    'line-match (phone layout)',
    LineMatchExercise,
    {
      type: 'line-match',
      content: {
        items: [
          {
            id: 'a',
            label: 'el círculo',
            image: 'images/line-match/circle.svg',
            localLanguage: 'circle',
            audio: CLIP,
          },
          {
            id: 'b',
            label: 'el cuadrado',
            image: 'images/line-match/square.svg',
            localLanguage: 'square',
            audio: CLIP,
          },
        ],
      },
    },
    '[role="combobox"], button:not([data-row-clip-speaker])',
  ],
];

function mount(Engine: ComponentType<ExerciseComponentProps>, config: unknown): HTMLElement {
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => root?.render(<Engine config={config as ExerciseComponentProps['config']} />));
  return container;
}

function firstRow(container: HTMLElement) {
  const row = container.querySelector<HTMLElement>(ROW_CLIP_ROW_SELECTOR);
  if (row === null) throw new Error('no clip row rendered');
  const played = vi.fn();
  row.querySelector('[data-row-clip-speaker]')?.addEventListener('click', played);
  return { row, played };
}

describe.each(CASES)('%s', (_name, Engine, config, controlSelector) => {
  test('a click on the row presses its speaker', () => {
    const { row, played } = firstRow(mount(Engine, config));
    act(() => row.click());
    expect(played).toHaveBeenCalledTimes(1);
  });

  test("a click on the row's own control does not play", () => {
    const { row, played } = firstRow(mount(Engine, config));
    const control = row.querySelector<HTMLElement>(controlSelector);
    if (control === null) throw new Error(`no ${controlSelector} in the row`);
    act(() => control.click());
    expect(played).not.toHaveBeenCalled();
  });
});
