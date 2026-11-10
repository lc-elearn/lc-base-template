/**
 * typed-answer-alternatives.spec.ts — a typed gap that accepts more than one answer
 * (TODO §E54; docs/specs/2026-11-10-typed-answer-alternatives-design.md §8). The
 * `inline-gap` showcase card's last sentence is `[profesor|maestro|docente::su trabajo]`
 * (inline-gap.fixture.ts), its sixth blank of six. Written here, not imported: the
 * fixture's own imports use the `@/` alias, which this folder's tsconfig does not have.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

import { expectNoAxeViolations } from '../support';
import { card, openShowcase } from './debug-support';

const FIXTURE = 'inline-gap';
const BLANK = 'Answer for blank 6';

async function openGap(page: Page): Promise<{ exercise: Locator; blank: Locator }> {
  await openShowcase(page);
  const exercise = card(page, FIXTURE);
  return { exercise, blank: exercise.getByLabel(BLANK) };
}

test('an answer that is not the preferred one is marked right', async ({ page }) => {
  const { exercise, blank } = await openGap(page);

  await blank.fill('maestro');
  await exercise.getByRole('button', { name: 'Check' }).click();

  await expect(blank).toHaveAttribute('aria-invalid', 'false');
  await expect(exercise.getByRole('status')).toContainText('1 correct out of 6');
});

test('a revealed wrong answer lists the others, axe stays clean, Show answers fills the preferred', async ({
  page,
}) => {
  const { exercise, blank } = await openGap(page);
  const check = exercise.getByRole('button', { name: 'Check' });

  await blank.fill('pintor');
  await check.click(); // the first wrong Check: a hint, no answers
  await expect(exercise.getByText('Also accepted:')).toHaveCount(0);
  await check.click(); // the second: the closest answer, and the others

  await expect(exercise.getByText('Also accepted:')).toBeVisible();
  const others = exercise.getByText('maestro · docente', { exact: true });
  await expect(others).toBeVisible();
  await expect(others).toHaveAttribute('lang', (await blank.getAttribute('lang')) ?? '');
  await expectNoAxeViolations(page, `article#${FIXTURE}`);

  await exercise.getByRole('button', { name: 'Show answers' }).click();
  await expect(blank).toHaveValue('profesor');
});
