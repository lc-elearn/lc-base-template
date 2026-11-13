// src/build/debug-pages-in.ts
/**
 * debug-pages-in.ts — which of a build's files are debug pages.
 *
 * The Pages workflow publishes a course build only when this finds none
 * (docs/specs/2026-11-13-github-pages-previews-design.md §3.1): the same list DEPLOY.md
 * step 6 check 3 asks a person to look for. Import-free beyond page-names.ts, so a Bun
 * script can use it (AGENTS.md, hard constraint 1).
 */
import { DEBUG_ENTRY_FILES } from './page-names';

const DEBUG_FILES: ReadonlySet<string> = new Set(Object.values(DEBUG_ENTRY_FILES));

/** The debug pages among `fileNames` (names only, not paths), in their given order. */
export function findDebugPages(fileNames: readonly string[]): string[] {
  return fileNames.filter((name) => DEBUG_FILES.has(name));
}
