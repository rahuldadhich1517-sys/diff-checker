import { splitLines } from '../internal/line-splitter.js';
import { validateDiffCheckerInputs, validateLineCountLimits } from '../internal/validation.js';
import { computeDiffLines } from '../internal/algorithm.js';
import { summarizeDiff } from '../summary/summary.js';
import type { DiffCheckerOptions, DiffLine, DiffResult } from './types.js';

/**
 * Compares two strings line by line and returns structured diff results.
 *
 * @param originalText The baseline text or source code snippet.
 * @param modifiedText The modified text or source code snippet to compare against.
 * @param options Optional configuration for comparison semantics and resource limits.
 * @returns A DiffResult object with detailed changes, summary statistics, and identical flag.
 */
export function diffChecker(
  originalText: string,
  modifiedText: string,
  options?: DiffCheckerOptions,
): DiffResult {
  validateDiffCheckerInputs(originalText, modifiedText, options);

  const resolvedOptions: DiffCheckerOptions = options ?? {};

  const originalLines = splitLines(originalText);
  const modifiedLines = splitLines(modifiedText);

  validateLineCountLimits(
    originalLines.length,
    modifiedLines.length,
    resolvedOptions.maxInputLines,
  );

  // Fast path: exact string identity
  if (originalText === modifiedText) {
    const changes: DiffLine[] = originalLines.map((line, idx) => ({
      type: 'unchanged',
      value: line.value,
      oldLineNumber: idx + 1,
      newLineNumber: idx + 1,
      lineEnding: line.lineEnding,
    }));

    const summary = summarizeDiff(changes);

    return {
      changes,
      summary,
      identical: true,
    };
  }

  const changes = computeDiffLines(originalLines, modifiedLines, resolvedOptions);
  const summary = summarizeDiff(changes);

  return {
    changes,
    summary,
    identical: summary.identical,
  };
}
