# @rahul_dadhich15/diff-checker

[![CI](https://github.com/rahuldadhich1517-sys/diff-checker/actions/workflows/ci.yml/badge.svg)](https://github.com/rahuldadhich1517-sys/diff-checker/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@rahul_dadhich15/diff-checker.svg)](https://www.npmjs.com/package/@rahul_dadhich15/diff-checker)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6.svg)](https://www.typescriptlang.org/)

Production-ready, deterministic, dependency-free TypeScript library for line-by-line text and source-code diffing, unified diff formatting, and structured diff summaries.

> **Important:** `@rahul_dadhich15/diff-checker` performs **textual, line-by-line comparison**. It does not perform abstract syntax tree (AST) parsing or language-specific semantic code comparison.

---

## Table of Contents

1. [Package Overview](#1-package-overview)
2. [Installation](#2-installation)
3. [Quick Start](#3-quick-start)
4. [Basic Text Comparison](#4-basic-text-comparison)
5. [Source-Code Comparison](#5-source-code-comparison)
6. [Structured Diff Results](#6-structured-diff-results)
7. [Added and Removed Line Numbers](#7-added-and-removed-line-numbers)
8. [Options and Comparison Semantics](#8-options-and-comparison-semantics)
9. [Unified Diff Formatting](#9-unified-diff-formatting)
10. [Summary Functionality](#10-summary-functionality)
11. [Error Handling](#11-error-handling)
12. [TypeScript Examples](#12-typescript-examples)
13. [Performance and Complexity](#13-performance-and-complexity)
14. [Limits and Edge Cases](#14-limits-and-edge-cases)
15. [Security and Privacy](#15-security-and-privacy)
16. [Development Instructions](#16-development-instructions)
17. [Tests and Coverage](#17-tests-and-coverage)
18. [Build Instructions](#18-build-instructions)
19. [API Reference](#19-api-reference)
20. [Supported Runtime Environments](#20-supported-runtime-environments)
21. [Known Limitations](#21-known-limitations)
22. [Contributing](#22-contributing)
23. [License](#23-license)
24. [Changelog](#24-changelog)

---

## 1. Package Overview

`@rahul_dadhich15/diff-checker` is designed for comparing plain text, source code files, configurations (JSON, YAML, XML, TOML), markdown, and log files line by line.

Key highlights:
- **Zero Runtime Dependencies**: Lightweight, secure, with no third-party supply-chain vulnerabilities.
- **Myers' $O(ND)$ Diff Algorithm**: Minimal edit scripts with linear-time common prefix/suffix trimming and fast disjoint set detection.
- **Accurate Line Numbering**: 1-based line numbers tracking original and modified line positions monotonically without fabricating values.
- **Precise Newline Semantics**: Preserves and distinguishes LF (`\n`), CRLF (`\r\n`), CR (`\r`), and missing trailing newlines at EOF.
- **Standard Unified Diff Formatter**: Emits standard patch-compatible hunks (`@@ -l,s +l,s @@`), configurable context lines, and `\ No newline at end of file` markers.
- **Dual ESM & CommonJS**: Full compatibility across Node.js 18+, modern bundlers, Deno, Bun, and browsers.
- **Strongly Typed**: Written in strict TypeScript with complete declaration (`.d.ts` and `.d.cts`) files.

---

## 2. Installation

Install via npm:

```bash
npm install @rahul_dadhich15/diff-checker
```

Or using pnpm or yarn:

```bash
pnpm add @rahul_dadhich15/diff-checker
# or
yarn add @rahul_dadhich15/diff-checker
```

---

## 3. Quick Start

```ts
import { diffChecker, formatUnifiedDiff, summarizeDiff } from '@rahul_dadhich15/diff-checker';

const original = 'apple\nbanana\ncherry\n';
const modified = 'apple\nblueberry\ncherry\n';

// 1. Compute structured line diff
const result = diffChecker(original, modified);

console.log(result.identical); // false
console.log(result.summary);
// {
//   added: 1,
//   removed: 1,
//   unchanged: 2,
//   changed: 1,
//   totalChanges: 2,
//   originalLineCount: 3,
//   modifiedLineCount: 3,
//   identical: false
// }

// 2. Generate standard unified diff text
const unified = formatUnifiedDiff(result);
console.log(unified);
// --- a
// +++ b
// @@ -1,3 +1,3 @@
//  apple
// -banana
// +blueberry
//  cherry
```

---

## 4. Basic Text Comparison

Compare any two strings line by line:

```ts
import { diffChecker } from '@rahul_dadhich15/diff-checker';

const original = 'First line\nSecond line\nThird line\n';
const modified = 'First line\nModified second line\nThird line\nFourth line\n';

const diff = diffChecker(original, modified);

for (const change of diff.changes) {
  if (change.type === 'added') {
    console.log(`+ [Line ${change.newLineNumber}] ${change.value}`);
  } else if (change.type === 'removed') {
    console.log(`- [Line ${change.oldLineNumber}] ${change.value}`);
  } else {
    console.log(`  [Old ${change.oldLineNumber} -> New ${change.newLineNumber}] ${change.value}`);
  }
}
```

---

## 5. Source-Code Comparison

Compare source code snippets such as TypeScript, JavaScript, Python, SQL, CSS, or JSON:

```ts
import { diffChecker } from '@rahul_dadhich15/diff-checker';

const oldCode = `function calculateTotal(items: Item[]): number {
  let total = 0;
  for (const item of items) {
    total += item.price;
  }
  return total;
}`;

const newCode = `function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}`;

const diff = diffChecker(oldCode, newCode);
console.log(`Lines changed: ${diff.summary.changed}`);
console.log(`Lines removed: ${diff.summary.removed}`);
console.log(`Lines added: ${diff.summary.added}`);
```

---

## 6. Structured Diff Results

`diffChecker` returns a `DiffResult` object with the following interface:

```ts
interface DiffResult {
  readonly changes: readonly DiffLine[];
  readonly summary: DiffSummary;
  readonly identical: boolean;
}

interface DiffLine {
  readonly type: 'added' | 'removed' | 'unchanged';
  readonly value: string;
  readonly oldLineNumber?: number | undefined;
  readonly newLineNumber?: number | undefined;
  readonly lineEnding?: string | undefined;
}
```

- `changes`: An immutable array of line edit operations.
- `summary`: High-level counts and statistics.
- `identical`: Boolean flag indicating whether original and modified inputs are identical under comparison options.

---

## 7. Added and Removed Line Numbers

All line numbers are **1-based**:

- **Added lines** (`type: "added"`):
  - `oldLineNumber` is `undefined`.
  - `newLineNumber` contains the 1-based line number in the modified input.
- **Removed lines** (`type: "removed"`):
  - `oldLineNumber` contains the 1-based line number in the original input.
  - `newLineNumber` is `undefined`.
- **Unchanged lines** (`type: "unchanged"`):
  - Both `oldLineNumber` and `newLineNumber` are present, pointing to their respective positions.

Line numbers are strictly monotonic and never fabricated.

---

## 8. Options and Comparison Semantics

Pass `DiffCheckerOptions` as the optional third argument:

```ts
const options: DiffCheckerOptions = {
  ignoreWhitespace: true,
  ignoreCase: true,
  ignoreLineEndings: true,
  ignoreTrailingNewline: true,
  maxInputLines: 10000,
  maxInputLength: 1000000,
};

const result = diffChecker(original, modified, options);
```

### Supported Options:

| Option | Type | Default | Description |
|---|---|---|---|
| `ignoreWhitespace` | `boolean` | `false` | Trims leading/trailing whitespace and collapses internal whitespace runs (spaces/tabs) to a single space. Original line content is preserved in results. |
| `ignoreCase` | `boolean` | `false` | Case-insensitive line comparison. Original line casing is preserved in results. |
| `ignoreLineEndings` | `boolean` | `false` | Treats all newline styles (`\n`, `\r\n`, `\r`) as equivalent during comparison. |
| `ignoreTrailingNewline` | `boolean` | `false` | Ignores whether the final line in an input ends with a newline (e.g. treats `"hello"` and `"hello\n"` as matching). |
| `maxInputLines` | `number` | `undefined` | Maximum allowed line count in either input. Throws `DiffCheckerError` with `INPUT_LIMIT_EXCEEDED` if exceeded. |
| `maxInputLength` | `number` | `undefined` | Maximum allowed character length for either input string. Throws `DiffCheckerError` with `INPUT_LIMIT_EXCEEDED` if exceeded. |

---

## 9. Unified Diff Formatting

Exposes `formatUnifiedDiff(diffResult, options?)` to generate standard Unified Diff text suitable for developer tools or display.

```ts
import { diffChecker, formatUnifiedDiff } from '@rahul_dadhich15/diff-checker';

const result = diffChecker(originalText, modifiedText);

const patch = formatUnifiedDiff(result, {
  contextLines: 3,               // Default: 3
  originalFileName: 'old.txt',   // Default: 'a'
  modifiedFileName: 'new.txt',   // Default: 'b'
  newline: '\n',                 // Default: '\n' ('\r\n' supported)
  trailingNewline: true,         // Default: true
});
```

### Unified Diff Capabilities:
- Correct hunk header line ranges: `@@ -oldStart,oldCount +newStart,newCount @@`.
- Single-line count formatting: `@@ -1 +1 @@` (omits `,1` count per standard conventions).
- Empty original/modified files: `-0,0` or `+0,0`.
- Automatic hunk merging: Adjacent changes within `2 * contextLines` lines are grouped into a single hunk.
- `\ No newline at end of file` marker appended when inputs lack a trailing newline.
- Returns empty string `""` when there are no changes (`identical: true`).

---

## 10. Summary Functionality

Use `summarizeDiff(diffResult | changes)` to compute structured statistics:

```ts
import { diffChecker, summarizeDiff } from '@rahul_dadhich15/diff-checker';

const result = diffChecker(original, modified);
const summary = summarizeDiff(result);
```

### Summary Fields:

| Field | Description |
|---|---|
| `added` | Total lines added. |
| `removed` | Total lines removed. |
| `unchanged` | Total lines that matched. |
| `changed` | Count of paired replacement lines: `min(removed, added)` within adjacent edit chunks. |
| `totalChanges` | Total edit operations: `added + removed`. |
| `originalLineCount` | Total lines in original input (`removed + unchanged`). |
| `modifiedLineCount` | Total lines in modified input (`added + unchanged`). |
| `identical` | `true` if inputs are identical under comparison options. |

---

## 11. Error Handling

All runtime errors thrown by the package are instances of `DiffCheckerError` and carry a typed `code` property:

```ts
import { diffChecker, DiffCheckerError } from '@rahul_dadhich15/diff-checker';

try {
  // @ts-expect-error invalid input
  diffChecker(12345, 'modified text');
} catch (err) {
  if (err instanceof DiffCheckerError) {
    console.error(`Diff error [${err.code}]: ${err.message}`);
    // Code: 'INVALID_INPUT_TYPE' | 'INVALID_OPTION' | 'INPUT_LIMIT_EXCEEDED'
  }
}
```

### Error Codes:
- `INVALID_INPUT_TYPE`: Non-string inputs passed to diff functions or non-array/result passed to formatters.
- `INVALID_OPTION`: Negative, non-integer, or wrong-type option parameters.
- `INPUT_LIMIT_EXCEEDED`: Input lines or string length exceeded `maxInputLines` or `maxInputLength`.

---

## 12. TypeScript Examples

Submodule exports are available for granular bundling:

```ts
// Root export
import { diffChecker, formatUnifiedDiff, summarizeDiff } from '@rahul_dadhich15/diff-checker';

// Submodule exports
import { diffChecker } from '@rahul_dadhich15/diff-checker/diff-checker';
import { formatUnifiedDiff } from '@rahul_dadhich15/diff-checker/unified-diff';
import { summarizeDiff } from '@rahul_dadhich15/diff-checker/summary';

// Type exports
import type {
  DiffCheckerOptions,
  DiffLine,
  DiffOperation,
  DiffResult,
  DiffSummary,
  UnifiedDiffOptions,
} from '@rahul_dadhich15/diff-checker';
```

---

## 13. Performance and Complexity

The library uses an optimized variant of Eugene W. Myers' $O(ND)$ Difference Algorithm:

1. **Exact String Identity Fast Path**: When `originalText === modifiedText`, runs in $O(N)$ linear time without entering the graph search.
2. **Common Prefix and Suffix Trimming**: Identifies and removes common prefix and suffix lines in $O(N)$ time before diffing, reducing the search space to only the middle edited region.
3. **Disjoint Set Early Exit**: For large slices that share 0 common lines, detects disjointness via line keys in $O(N + M)$ linear time, emitting clean replacements without quadratic search steps.
4. **Myers Search**: For edited regions with $D$ edit operations, runs in $O((N + M) \times D)$ time and $O(D^2)$ space.

---

## 14. Limits and Edge Cases

- **Line Splitting**: Supports mixed line endings within the same input, trailing newlines, inputs without trailing newlines, empty lines, and repeated empty lines.
- **Multibyte and Emojis**: Fully supports UTF-16 characters, emojis, accents, and RTL (Arabic/Hebrew) scripts.
- **Extremely Long Lines**: Individual lines with 50,000+ characters are processed without stack overflows or regex backtracking issues.
- **Configurable Boundaries**: Protect server resources in multi-tenant environments by providing `maxInputLines` and `maxInputLength`.

---

## 15. Security and Privacy

All inputs are treated as **untrusted raw text**:
- **No Evaluation**: Never runs `eval()` or `new Function()`.
- **No Network Calls**: Operates 100% in-memory; no external servers or telemetries are contacted.
- **No HTML Injection**: Raw source code (containing `<script>`, event handlers, template syntax, or SQL) is never rendered as HTML.
- **No Global Mutation**: Input strings and options objects are never modified.

---

## 16. Development Instructions

Prerequisites: Node.js 18.0.0 or higher.

```bash
# Clone the repository
git clone https://github.com/rahuldadhich1517-sys/diff-checker.git
cd diff-checker

# Install dependencies
npm install

# Type-check TypeScript
npm run typecheck

# Run tests
npm run test:run

# Run tests with coverage
npm run test:coverage

# Build distribution artifacts
npm run build
```

---

## 17. Tests and Coverage

The test suite contains **90 unit and integration tests** across 9 test files:

- `tests/diff-checker.test.ts`: Insertions, deletions, replacements, line numbering, repeated content.
- `tests/line-handling.test.ts`: LF, CRLF, CR, mixed endings, whitespace/case options, Unicode.
- `tests/unified-diff.test.ts`: Unified diff hunk calculations, context merging, EOF markers.
- `tests/summary.test.ts`: Hand-calculated statistics, replacements vs operations.
- `tests/edge-cases.test.ts`: Runtime validations and resource limits.
- `tests/security.test.ts`: Untrusted code inputs, script tags, SQL statements.
- `tests/performance.test.ts`: Bounded regression checks on large files and long lines.
- `tests/property.test.ts`: Source reconstruction invariants and monotonicity.
- `tests/integration.test.ts`: Real-world TypeScript, JSON, YAML, Python, Markdown code diffs.

### Test Coverage:
- **Statements**: > 98%
- **Branches**: > 96%
- **Functions**: 100%
- **Lines**: > 98%

---

## 18. Build Instructions

Build outputs are generated using `tsup`:

```bash
npm run build
```

Output directory:
```
dist/
├── index.js             # ESM bundle
├── index.cjs            # CommonJS bundle
├── index.d.ts           # ESM type declarations
├── index.d.cts          # CommonJS type declarations
├── diff-checker/        # Submodule bundle
├── unified-diff/        # Submodule bundle
└── summary/             # Submodule bundle
```

---

## 19. API Reference

### `diffChecker(originalText, modifiedText, options?): DiffResult`
Compares two strings line by line and returns structured diff results.

### `formatUnifiedDiff(diffResult, options?): string`
Formats a `DiffResult` or array of `DiffLine` into standard unified diff patch format.

### `summarizeDiff(diffResult): DiffSummary`
Computes summary statistics (added, removed, unchanged, changed, totalChanges, line counts).

### `DiffCheckerError`
Custom error class thrown when invalid inputs or resource limit violations occur.

---

## 20. Supported Runtime Environments

- Node.js >= 18.0.0
- Modern Browsers (Chrome, Firefox, Safari, Edge)
- Deno
- Bun
- Cloudflare Workers / Edge Runtimes

---

## 21. Known Limitations

- **Textual Comparison Only**: Compares lines by text; does not detect semantic symbol renamings or AST alterations.
- **Line-Level Granularity**: Edits within a line are represented as line replacements. Word-level or character-level diffing is not included in the core line-diff utility.
- **Move Detection**: Reordered lines are reported as deletions and insertions rather than moved blocks.

---

## 22. Contributing

Contributions, bug reports, and pull requests are welcome! Please open an issue on GitHub to discuss proposed changes before submitting a PR.

---

## 23. License

Distributed under the [MIT License](LICENSE). Copyright (c) 2026 Rahul Dadhich.

---

## 24. Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and release notes.
