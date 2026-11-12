# Tap anywhere on a row to hear it (E62)

**Date:** 2026-11-12 · **Status:** design approved 2026-11-12, not built · **Plan:** not yet written
**TODO:** §E62 · **Builds on:** `src/lo/blocks/VocabularyBlock.tsx` (`playRowClip`, ported from french-lo-1's `PhraseTable`)
**Comes before:** the vocabulary word bank (Russian, template issue 108), which reuses the helper this spec adds

## 1. Why

A learner on a phone should be able to tap anywhere on a row that has its own recording
and hear it, not only the small speaker button. The maintainer wants this to be how audio
rows behave across the whole template (2026-11-12). The maintainer recalls a similar
request from the German course; it is not on GitHub, so its exact wording is still to be
confirmed against this spec.

Today only the vocabulary block does it. A survey of every component that renders a clip
(2026-11-12) found six exercise types whose rows each carry a clip and play it only from
the speaker, beside the vocabulary block that already plays from the whole row:

| Component                                  | Row element                      | What else in the row takes a click |
| ------------------------------------------ | -------------------------------- | ---------------------------------- |
| `inline-gap/InlineTypedGapExercise.tsx`    | `<span data-gap-row>`            | text inputs                        |
| `text-entry/TextEntryRuntime.tsx`          | `TableRow`                       | text input                         |
| `phrase-reorder/PhraseReorderExercise.tsx` | slot `<li>`                      | token buttons (click and drag)     |
| `drag-fill-gaps/DragFillGapsExercise.tsx`  | row `<li>`                       | draggable tiles, slot buttons      |
| `word-spot/WordSpotExercise.tsx`           | `<li className="word-spot-row">` | word buttons                       |
| `line-match/LineMatchExercise.tsx`         | phone-layout `<li>` only         | `Select` combobox                  |
| `lo/blocks/VocabularyBlock.tsx`            | row `<div>` (already done)       | the speaker only                   |

`inline-gap` has two audio modes: an independent clip per row, and a master playlist
whose speakers are displays that call `audio.playRow(rowIndex)`. Both render a `<button>`
speaker, so both are covered by the same forwarding.

## 2. Decisions (maintainer, 2026-11-12)

| #   | Decision                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | **One shared helper** replaces the vocabulary block's private `playRowClip`. A row click presses that row's own speaker button, so the speaker stays the one owner of playback (what is playing, the progress ring, stopping other clips). |
| R2  | **Every row that has its own clip uses it**: the seven components in §1.                                                                                                                                                                   |
| R3  | **Flashcards and memory match are unchanged.** A tap there turns the card over; it cannot also play.                                                                                                                                       |
| R4  | **No course or block setting.** It is how audio rows behave everywhere. A setting can be added if someone needs one.                                                                                                                       |
| R5  | **A mouse and touch convenience only.** The row gets no role, `tabIndex` or key handler; the speaker `<button>` stays the keyboard and screen-reader route, so no word is announced or tab-stopped twice.                                  |
| R6  | **Its own change and pull request**, before the vocabulary word bank.                                                                                                                                                                      |

## 3. The helper

`src/audio/row-clip.ts`, pure DOM, no React state:

- `playRowClip(event)`: the row's `onClick`. Presses the row's speaker unless §4 says not to.
- `shouldPlayRowClip(target, row, selection)`: the decision in §4, exported so it is tested
  without a browser event.
- `ROW_CLIP_CLASSES`: the pointer cursor and hover background a row with a clip gets,
  moved from `VocabularyBlock` so every row looks the same. A row with no clip gets neither:
  a pointer over a row that does nothing is a promise the page cannot keep.

**Finding the speaker.** The vocabulary block finds it as "the first `button` in the row".
In an exercise the first button can be a word tile. The speaker `<button>` in
`CircularAudioProgressAnimatedSpeakerDisplay.tsx` gains a marker, `data-row-clip-speaker`,
and the helper presses `row.querySelector('[data-row-clip-speaker]')`. A row with none does
nothing.

## 4. When a row click does not play

`shouldPlayRowClip` returns false when:

1. **The click landed on a control inside the row**: `target.closest(…)` finds a `button`,
   `a[href]`, `input`, `select`, `textarea`, `label`, `[contenteditable]`,
   `[draggable="true"]`, or an element with role `button`, `link`, `checkbox`, `switch`,
   `combobox`, `option` or `slider`, **and that element is inside the row**. The match must
   be contained by the row, because a row can sit inside a focusable scroll container
   (`rich-text-table-scroll`, `tabIndex={0}`) that would otherwise match every click.
   The speaker is a `button`, so a click on it plays once, through its own handler.
2. **Text is selected** (`selection.toString()` is not empty): the learner is selecting a
   sentence to copy, not asking to hear it. A plain click collapses any old selection on
   `mousedown`, before `click` fires, so only a drag-to-select reaches `click` with text
   still selected.
3. **The row has no speaker** (`[data-row-clip-speaker]` not found).

A caller that wants it off for a while (the vocabulary block while a word is hidden for
self-testing) leaves `onClick` unset, as rows with no clip already do.

## 5. Each component

Each row in §1 gets `onClick={hasClip ? playRowClip : undefined}` and `ROW_CLIP_CLASSES`
when it has a clip, with the same `eslint-disable-next-line
jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events` comment
`VocabularyBlock` carries today, pointing to R5. `VocabularyBlock` imports the helper and
deletes its own copy. No component's markup changes otherwise.

## 6. Tests (each written first, seen failing)

- `src/audio/row-clip.test.ts`: plays on a click on row text; not on a `button`, `input`,
  `select`, `textarea`, `label`, `[draggable="true"]` or role `combobox` inside the row;
  does play when the only focusable ancestor is outside the row; not with a non-empty
  selection; not when the row has no marked speaker; presses the marked speaker, not the
  first button.
- One test per component in §1: clicking the row's prompt text plays its clip; clicking
  its input, tile, word or combobox does not.
- `CircularAudioProgressAnimatedSpeakerDisplay`: the interactive speaker carries
  `data-row-clip-speaker`; the non-interactive one does not.
- One browser test (`e2e/`) at a phone size: a tap on a vocabulary row's gloss plays the
  clip, and a tap on an inline-gap input focuses it without playing.

## 7. Docs

- `docs/STYLE.md`: one line under audio, "a row with its own clip uses
  `src/audio/row-clip.ts`", linking here.
- `CONTRIBUTING.md`'s exercise-engine recipe: a new engine with per-row clips uses the helper.
- `docs/process/TODO.md`: E62.

## 8. Out of scope

- Flashcards and memory match (R3).
- Keyboard access to the row (R5).
- A per-course or per-block setting (R4).
- The vocabulary word bank itself, which has its own spec.
