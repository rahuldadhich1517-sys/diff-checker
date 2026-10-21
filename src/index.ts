export { diffChecker } from './diff-checker/index.js';
export { formatUnifiedDiff } from './unified-diff/index.js';
export { summarizeDiff } from './summary/index.js';
export { DiffCheckerError } from './internal/errors.js';

export type {
  DiffCheckerErrorCode,
  DiffCheckerOptions,
  DiffLine,
  DiffOperation,
  DiffResult,
  DiffSummary,
  UnifiedDiffOptions,
} from './diff-checker/types.js';
