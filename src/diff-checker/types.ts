import type { DiffCheckerErrorCode } from '../internal/errors.js';

export type DiffOperation = 'added' | 'removed' | 'unchanged';

export interface DiffLine {
  readonly type: DiffOperation;
  readonly value: string;
  readonly oldLineNumber?: number | undefined;
  readonly newLineNumber?: number | undefined;
  readonly lineEnding?: string | undefined;
}

export interface DiffSummary {
  /**
   * Total number of lines added in the modified input.
   */
  readonly added: number;
  /**
   * Total number of lines removed from the original input.
   */
  readonly removed: number;
  /**
   * Total number of lines that remained unchanged.
   */
  readonly unchanged: number;
  /**
   * Conceptual line replacements: count of paired removals and additions
   * within contiguous change blocks (min(removed, added) per block).
   */
  readonly changed: number;
  /**
   * Total edit operations: added + removed.
   */
  readonly totalChanges: number;
  /**
   * Total lines in the original input.
   */
  readonly originalLineCount: number;
  /**
   * Total lines in the modified input.
   */
  readonly modifiedLineCount: number;
  /**
   * True if original and modified inputs are identical under comparison options.
   */
  readonly identical: boolean;
}

export interface DiffResult {
  readonly changes: readonly DiffLine[];
  readonly summary: DiffSummary;
  readonly identical: boolean;
}

export interface DiffCheckerOptions {
  /**
   * If true, ignores differences in leading/trailing whitespace and collapses
   * sequences of internal whitespace (spaces and tabs) to a single space.
   * Original line content is preserved in the results.
   * @default false
   */
  readonly ignoreWhitespace?: boolean;

  /**
   * If true, performs case-insensitive line comparison.
   * Original line content and casing are preserved in the results.
   * @default false
   */
  readonly ignoreCase?: boolean;

  /**
   * If true, treats all newline styles (\r\n, \n, \r) as equivalent.
   * @default false
   */
  readonly ignoreLineEndings?: boolean;

  /**
   * If true, ignores whether the final line in an input ends with a newline.
   * @default false
   */
  readonly ignoreTrailingNewline?: boolean;

  /**
   * Maximum allowed lines in either input. Throws DiffCheckerError if exceeded.
   * Must be a positive integer if specified.
   */
  readonly maxInputLines?: number;

  /**
   * Maximum allowed character length for either input string. Throws DiffCheckerError if exceeded.
   * Must be a positive integer if specified.
   */
  readonly maxInputLength?: number;
}

export interface UnifiedDiffOptions {
  /**
   * Number of surrounding context lines to include in each hunk.
   * Must be a non-negative integer.
   * @default 3
   */
  readonly contextLines?: number;

  /**
   * File path or label for the original file in the header.
   * @default "a"
   */
  readonly originalFileName?: string;

  /**
   * File path or label for the modified file in the header.
   * @default "b"
   */
  readonly modifiedFileName?: string;

  /**
   * Custom header line or metadata for original file (e.g. `--- a/file.txt\t2026-01-01`).
   * Overrides `originalFileName` header line if provided.
   */
  readonly originalHeader?: string;

  /**
   * Custom header line or metadata for modified file (e.g. `+++ b/file.txt\t2026-01-01`).
   * Overrides `modifiedFileName` header line if provided.
   */
  readonly modifiedHeader?: string;

  /**
   * Line terminator to use when formatting the unified diff string.
   * @default "\n"
   */
  readonly newline?: '\n' | '\r\n';

  /**
   * Whether to include a trailing newline at the end of the formatted unified diff string.
   * @default true
   */
  readonly trailingNewline?: boolean;
}

export type { DiffCheckerErrorCode };
