# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-21

### Added

- Initial release of `@rahul_dadhich15/diff-checker`.
- Dependency-free Myers' $O(ND)$ line-diff algorithm with linear-time common prefix/suffix trimming and $O(N+M)$ disjoint set fast paths.
- Main diff utility: `diffChecker(originalText, modifiedText, options?)` returning strongly typed, immutable-style `DiffResult`.
- Detailed `DiffLine` objects providing 1-based `oldLineNumber` and `newLineNumber`, change operation (`added`, `removed`, `unchanged`), line value, and exact line ending.
- Structured diff statistics: `summarizeDiff(diffResult)` returning line additions, removals, unchanged counts, conceptual replacement counts (`changed`), total edit operations, and line totals.
- Standard Unified Diff formatting helper: `formatUnifiedDiff(diffResult, options?)` supporting configurable context lines, hunk headers, custom filenames, custom metadata headers, and `\ No newline at end of file` indicators.
- Configurable comparison semantics via `DiffCheckerOptions`:
  - `ignoreWhitespace`: Trims leading/trailing whitespace and collapses internal whitespace runs.
  - `ignoreCase`: Case-folded textual line matching.
  - `ignoreLineEndings`: Normalizes CRLF, LF, and CR terminators.
  - `ignoreTrailingNewline`: Ignores trailing newline differences at end of file.
  - `maxInputLines`: Strict line count limit safeguard.
  - `maxInputLength`: Strict input string length limit safeguard.
- Dedicated custom error class: `DiffCheckerError` with typed machine-readable error codes (`INVALID_INPUT_TYPE`, `INVALID_OPTION`, `INPUT_LIMIT_EXCEEDED`).
- Dual ESM and CommonJS bundle formats with full TypeScript declaration files.
