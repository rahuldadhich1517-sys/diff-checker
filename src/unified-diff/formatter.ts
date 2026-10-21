import { DiffCheckerError } from '../internal/errors.js';
import { validateUnifiedDiffOptions } from '../internal/validation.js';
import type { DiffLine, DiffResult, UnifiedDiffOptions } from '../diff-checker/types.js';

function formatRange(start: number, count: number): string {
  if (count === 1) {
    return `${start}`;
  }
  return `${start},${count}`;
}

/**
 * Formats a DiffResult or array of DiffLines into standard Unified Diff format.
 *
 * @param diffResult DiffResult or array of DiffLine from diffChecker.
 * @param options Optional configuration for context lines, headers, and newlines.
 * @returns A string in standard unified diff format, or an empty string if there are no changes.
 */
export function formatUnifiedDiff(
  diffResult: DiffResult | readonly DiffLine[],
  options?: UnifiedDiffOptions,
): string {
  if (diffResult === null || diffResult === undefined) {
    throw new DiffCheckerError(
      `Expected diff result or DiffLine array, received ${String(diffResult)}`,
      'INVALID_INPUT_TYPE',
    );
  }

  validateUnifiedDiffOptions(options);

  let changes: readonly DiffLine[];

  if (Array.isArray(diffResult)) {
    changes = diffResult;
  } else if (typeof diffResult === 'object' && Array.isArray((diffResult as DiffResult).changes)) {
    changes = (diffResult as DiffResult).changes;
  } else {
    throw new DiffCheckerError(
      'Expected an array of DiffLine or a DiffResult object with changes array',
      'INVALID_INPUT_TYPE',
    );
  }

  const changeIndices: number[] = [];
  for (let i = 0; i < changes.length; i++) {
    if (changes[i]!.type !== 'unchanged') {
      changeIndices.push(i);
    }
  }

  // If there are no additions or deletions, return an empty string
  if (changeIndices.length === 0) {
    return '';
  }

  const contextLines = options?.contextLines ?? 3;
  const newline = options?.newline ?? '\n';
  const trailingNewline = options?.trailingNewline ?? true;
  const originalFileName = options?.originalFileName ?? 'a';
  const modifiedFileName = options?.modifiedFileName ?? 'b';
  const originalHeader = options?.originalHeader ?? `--- ${originalFileName}`;
  const modifiedHeader = options?.modifiedHeader ?? `+++ ${modifiedFileName}`;

  // Group change indices into hunks
  const hunkSpans: Array<{ start: number; end: number }> = [];
  let currentStart = Math.max(0, changeIndices[0]! - contextLines);
  let currentEnd = Math.min(changes.length - 1, changeIndices[0]! + contextLines);

  for (let i = 1; i < changeIndices.length; i++) {
    const chIdx = changeIndices[i]!;
    const chStart = Math.max(0, chIdx - contextLines);
    const chEnd = Math.min(changes.length - 1, chIdx + contextLines);

    if (chStart <= currentEnd + 1) {
      currentEnd = Math.max(currentEnd, chEnd);
    } else {
      hunkSpans.push({ start: currentStart, end: currentEnd });
      currentStart = chStart;
      currentEnd = chEnd;
    }
  }
  hunkSpans.push({ start: currentStart, end: currentEnd });

  const outputLines: string[] = [originalHeader, modifiedHeader];

  for (const span of hunkSpans) {
    let oldCount = 0;
    let newCount = 0;
    let oldStart: number | undefined;
    let newStart: number | undefined;

    for (let idx = span.start; idx <= span.end; idx++) {
      const line = changes[idx]!;
      if (line.type === 'unchanged') {
        oldCount++;
        newCount++;
        if (oldStart === undefined) oldStart = line.oldLineNumber;
        if (newStart === undefined) newStart = line.newLineNumber;
      } else if (line.type === 'removed') {
        oldCount++;
        if (oldStart === undefined) oldStart = line.oldLineNumber;
      } else if (line.type === 'added') {
        newCount++;
        if (newStart === undefined) newStart = line.newLineNumber;
      }
    }

    // Determine oldStart if oldCount === 0 (pure additions)
    if (oldStart === undefined) {
      // Find the last line before span.start with an oldLineNumber
      let found: number | undefined;
      for (let idx = span.start - 1; idx >= 0; idx--) {
        if (changes[idx]!.oldLineNumber !== undefined) {
          found = changes[idx]!.oldLineNumber;
          break;
        }
      }
      oldStart = found !== undefined ? found : 0;
    }

    // Determine newStart if newCount === 0 (pure deletions)
    if (newStart === undefined) {
      let found: number | undefined;
      for (let idx = span.start - 1; idx >= 0; idx--) {
        if (changes[idx]!.newLineNumber !== undefined) {
          found = changes[idx]!.newLineNumber;
          break;
        }
      }
      newStart = found !== undefined ? found : 0;
    }

    const hunkHeader = `@@ -${formatRange(oldStart, oldCount)} +${formatRange(newStart, newCount)} @@`;
    outputLines.push(hunkHeader);

    for (let idx = span.start; idx <= span.end; idx++) {
      const line = changes[idx]!;
      if (line.type === 'unchanged') {
        outputLines.push(` ${line.value}`);
        if (line.lineEnding === '') {
          outputLines.push('\\ No newline at end of file');
        }
      } else if (line.type === 'removed') {
        outputLines.push(`-${line.value}`);
        if (line.lineEnding === '') {
          outputLines.push('\\ No newline at end of file');
        }
      } else if (line.type === 'added') {
        outputLines.push(`+${line.value}`);
        if (line.lineEnding === '') {
          outputLines.push('\\ No newline at end of file');
        }
      }
    }
  }

  const formatted = outputLines.join(newline);
  return trailingNewline ? formatted + newline : formatted;
}
