/**
 * VocabularyRow — one entry of the vocabulary block: the term, in the course language,
 * with its clip, and its gloss (E63 moves it out of VocabularyBlock.tsx unchanged).
 *
 * The speaker sits inside the `<dt>` and BEFORE the word. Inside, because a control in
 * a column of its own is separated from the thing it plays for anyone navigating by
 * element. Before, because it gives every row one shared left edge to scan down and
 * click, and because a vocabulary list is heard before it is read.
 */
import { playRowClip, ROW_CLIP_CLASSES } from '@/audio/row-clip';
import { AudioClip } from '@/components/audio/AudioClip';
import { TARGET_LANG } from '@/lib/lang';
import type { VocabularyItem } from './vocabulary-block-schema';

export interface VocabularyRowProps {
  item: VocabularyItem;
}

export function VocabularyRow({ item }: VocabularyRowProps) {
  const plays = item.audio !== undefined;
  return (
    // THE WHOLE ROW PLAYS THE CLIP, and it is a MOUSE affordance only — no role, no
    // tabIndex, no key handler: the speaker inside is the keyboard path (E62). Only a
    // row WITH a clip gets the cursor and the hover: a pointer over a row that does
    // nothing is a promise the page cannot keep.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- pointer-only enhancement (mouse and touch) over the speaker <button>, which is the keyboard path; see src/audio/row-clip.ts
    <div
      onClick={plays ? playRowClip : undefined}
      data-row-clip={plays ? '' : undefined}
      className={`grid gap-x-6 rounded-md sm:col-span-2 sm:grid-cols-subgrid ${
        plays ? ROW_CLIP_CLASSES : ''
      }`}
    >
      <dt lang={TARGET_LANG} className="flex items-center gap-2 font-medium text-foreground">
        {item.audio === undefined ? null : (
          // `title` is the speaker's accessible name: "play" alone would be the same on
          // every row of the list.
          <AudioClip
            className="super-compact-speaker"
            inline
            soundFile={item.audio}
            title={`Listen: ${item.term}`}
          />
        )}
        {item.term}
      </dt>
      {/* Centred like the term, which sits beside a 54px speaker. */}
      <dd className="self-center text-muted-foreground">{item.gloss}</dd>
    </div>
  );
}
