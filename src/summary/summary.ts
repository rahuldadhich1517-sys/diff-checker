import { DiffCheckerError } from '../internal/errors.js';
import type { DiffLine, DiffResult, DiffSummary } from '../diff-checker/types.js';

/**
 * Computes summary statistics from a DiffResult or an array of DiffLine.
 *
 * `changed` represents conceptual replacements: the count of paired removed
 * and added lines within adjacent change blocks (min(removed, added) per block).
 * `totalChanges` represents total edit operations (added + removed).
 */
export function summarizeDiff(changesOrResult: DiffResult | readonly DiffLine[]): DiffSummary {
  if (changesOrResult === null || changesOrResult === undefined) {
    throw new DiffCheckerError(
      `Expected diff result or DiffLine array, received ${String(changesOrResult)}`,
      'INVALID_INPUT_TYPE',
    );
  }

  let lines: readonly DiffLine[];

  if (Array.isArray(changesOrResult)) {
    lines = changesOrResult;
  } else if (typeof changesOrResult === 'object' && Array.isArray((changesOrResult as DiffResult).changes)) {
    lines = (changesOrResult as DiffResult).changes;
  } else {
    throw new DiffCheckerError(
      'Expected an array of DiffLine or a DiffResult object with changes array',
      'INVALID_INPUT_TYPE',
    );
  }

  let added = 0;
  let removed = 0;
  let unchanged = 0;
  let changed = 0;

  let i = 0;
  const len = lines.length;

  while (i < len) {
    const line = lines[i]!;
    if (line.type === 'unchanged') {
      unchanged++;
      i++;
    } else {
      let blockRemoved = 0;
      let blockAdded = 0;

      while (i < len && lines[i]!.type !== 'unchanged') {
        if (lines[i]!.type === 'removed') {
          blockRemoved++;
          removed++;
        } else if (lines[i]!.type === 'added') {
          blockAdded++;
          added++;
        }
        i++;
      }

      changed += Math.min(blockRemoved, blockAdded);
    }
  }

  return {
    added,
    removed,
    unchanged,
    changed,
    totalChanges: added + removed,
    originalLineCount: removed + unchanged,
    modifiedLineCount: added + unchanged,
    identical: added === 0 && removed === 0,
  };
}
