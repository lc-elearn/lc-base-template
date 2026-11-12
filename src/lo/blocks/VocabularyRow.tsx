/**
 * VocabularyRow — one entry of the vocabulary block: the term, in the course language,
 * with its clip, and its gloss (E63 splits it out of VocabularyBlock.tsx).
 *
 * The speaker sits inside the `<dt>` and BEFORE the word. Inside, because a control in
 * a column of its own is separated from the thing it plays for anyone navigating by
 * element. Before, because it gives every row one shared left edge to scan down and
 * click, and because a vocabulary list is heard before it is read.
 *
 * SELF-TEST (spec §5). A hidden word is REMOVED FROM THE DOM, not hidden with CSS, so
 * assistive technology cannot read it early; its cell holds a Reveal button named for
 * its slot ("Reveal Russian, word 3"). The revealed word takes focus. While the term is
 * hidden its speaker is "Listen: word 3", not "Listen: брак", and the `<dt>` drops
 * `lang`: the cell then holds English chrome, and `lang` is for target-language text
 * only (§6).
 */
import { useEffect, useRef } from 'react';
import { playRowClip, ROW_CLIP_CLASSES } from '@/audio/row-clip';
import { AudioClip } from '@/components/audio/AudioClip';
import { buttonVariants } from '@/components/ui/button';
import { fillLabel, resolveLabel, type UiStringsOverride } from '@/config/ui-strings';
import { NATIVE_LANGUAGE_NAME, TARGET_LANG, TARGET_LANGUAGE_NAME } from '@/lib/lang';
import type { VocabularyItem } from './vocabulary-block-schema';
import { isHidden, type HideSide, type SelfTestState } from './vocabulary-self-test';

const LANGUAGE_NAMES: Readonly<Record<HideSide, string>> = {
  target: TARGET_LANGUAGE_NAME,
  native: NATIVE_LANGUAGE_NAME,
};

/** The word just revealed: focusable from script only, and focused once, on mount. */
function RevealedWord({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <span
      ref={ref}
      tabIndex={-1}
      className="rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {text}
    </span>
  );
}

export interface VocabularyRowProps {
  item: VocabularyItem;
  /** The entry's place in the view, from 1: how a hidden word is named ("word 3"). */
  number: number;
  test: SelfTestState;
  /** False while any word in the block is hidden, so a click never both plays and reveals (W8). */
  rowClicks: boolean;
  labels?: UiStringsOverride;
  onReveal: (term: string) => void;
}

export function VocabularyRow({
  item,
  number,
  test,
  rowClicks,
  labels,
  onReveal,
}: VocabularyRowProps) {
  const termHidden = isHidden(test, item.term, 'target');
  const glossHidden = isHidden(test, item.term, 'native');
  const focusSide = test.lastRevealed === item.term ? test.hidden : 'none';
  const plays = item.audio !== undefined && rowClicks;

  const cell = (side: HideSide, text: string, hidden: boolean) => {
    if (hidden) {
      return (
        <button
          type="button"
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
          aria-label={fillLabel(resolveLabel('vocabularyRevealWord', labels), {
            language: LANGUAGE_NAMES[side],
            number,
          })}
          onClick={() => onReveal(item.term)}
        >
          {resolveLabel('vocabularyReveal', labels)}
        </button>
      );
    }
    return focusSide === side ? <RevealedWord text={text} /> : text;
  };

  return (
    // THE WHOLE ROW PLAYS THE CLIP, and it is a MOUSE affordance only — no role, no
    // tabIndex, no key handler: the speaker inside is the keyboard path (E62). Only a
    // row WITH a clip gets the cursor and the hover, and none while a word is hidden.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- pointer-only enhancement (mouse and touch) over the speaker <button>, which is the keyboard path; see src/audio/row-clip.ts
    <div
      onClick={plays ? playRowClip : undefined}
      data-row-clip={plays ? '' : undefined}
      className={`grid gap-x-6 rounded-md sm:col-span-2 sm:grid-cols-subgrid ${
        plays ? ROW_CLIP_CLASSES : ''
      }`}
    >
      <dt
        lang={termHidden ? undefined : TARGET_LANG}
        className="flex items-center gap-2 font-medium text-foreground"
      >
        {item.audio === undefined ? null : (
          // `title` is the speaker's accessible name: "play" alone would be the same on
          // every row, and a hidden term must not be spoken in it.
          <AudioClip
            className="super-compact-speaker"
            inline
            soundFile={item.audio}
            title={
              termHidden
                ? fillLabel(resolveLabel('vocabularyListenWord', labels), { number })
                : `Listen: ${item.term}`
            }
          />
        )}
        {cell('target', item.term, termHidden)}
      </dt>
      {/* Centred like the term, which sits beside a 54px speaker. */}
      <dd className="self-center text-muted-foreground">
        {cell('native', item.gloss, glossHidden)}
      </dd>
    </div>
  );
}
