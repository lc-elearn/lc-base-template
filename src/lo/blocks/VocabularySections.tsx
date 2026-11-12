/**
 * VocabularySections — the vocabulary block's list (E63, spec §4): one `<dl>` per
 * topic or letter, each under its heading. A topic without a heading is a divider
 * (none above the first). A list with one section and no heading is today's single
 * `<dl>`, unchanged (W3).
 *
 * HEADING LEVEL FOLLOWS PRESENTATION, as in the sources block: `<h3>` in a plain block,
 * under the section's `<h2>`; `<h4>` in a card, under the accordion's `<h3>`.
 *
 * The sections share one two-column grid (subgrid), so the terms line up across topics
 * and letters as they did in one list.
 */
import type { UiStringsOverride } from '@/config/ui-strings';
import type { VocabularyItem } from './vocabulary-block-schema';
import type { VocabularySection } from './vocabulary-letters';
import type { SelfTestState } from './vocabulary-self-test';
import { VocabularyRow } from './VocabularyRow';
import './vocabulary-block.css';

/** Two columns from `sm`, the term's as wide as the longest term: today's list. */
const LIST = 'grid gap-x-6 gap-y-2 sm:grid-cols-[max-content_1fr]';
/** The same columns around sections, with more room between them. */
const SECTIONS = 'grid gap-x-6 gap-y-4 sm:grid-cols-[max-content_1fr]';
const HEADING = 'font-heading text-lg font-semibold text-foreground sm:col-span-2';

interface VocabularySectionsProps {
  sections: readonly VocabularySection<VocabularyItem>[];
  headingLevel: 'h3' | 'h4';
  /** Letter headings: centred, a thin rule either side (vocabulary-block.css). */
  letters: boolean;
  test: SelfTestState;
  rowClicks: boolean;
  labels?: UiStringsOverride;
  onReveal: (term: string) => void;
}

export function VocabularySections({
  sections,
  headingLevel: Heading,
  letters,
  ...rowProps
}: VocabularySectionsProps) {
  // Each entry's place in the whole view, from 1: "Reveal Russian, word 3".
  const numbers = new Map(
    sections.flatMap((section) => section.items).map((item, index) => [item.term, index + 1]),
  );
  const rows = (section: VocabularySection<VocabularyItem>) =>
    section.items.map((item) => (
      <VocabularyRow
        key={item.term}
        item={item}
        number={numbers.get(item.term) ?? 0}
        {...rowProps}
      />
    ));

  const [first] = sections;
  if (sections.length === 1 && first !== undefined && first.heading === undefined) {
    return <dl className={LIST}>{rows(first)}</dl>;
  }
  return (
    <div className={SECTIONS}>
      {sections.map((section, index) => (
        <div key={section.key} className="grid gap-y-2 sm:col-span-2 sm:grid-cols-subgrid">
          {section.heading === undefined ? (
            index === 0 ? null : (
              <hr className="border-border sm:col-span-2" />
            )
          ) : (
            <Heading className={letters ? `vocabulary-letter ${HEADING}` : HEADING}>
              {section.heading}
            </Heading>
          )}
          <dl className="grid gap-y-2 sm:col-span-2 sm:grid-cols-subgrid">{rows(section)}</dl>
        </div>
      ))}
    </div>
  );
}
