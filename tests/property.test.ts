import { describe, it, expect } from 'vitest';
import { diffChecker, formatUnifiedDiff } from '../src/index.js';

describe('diffChecker - Property-based and Invariant Testing', () => {
  // Test corpus generator
  const testCases = [
    { orig: '', mod: '' },
    { orig: 'hello', mod: 'hello' },
    { orig: 'hello\n', mod: 'hello\n' },
    { orig: 'hello\n', mod: 'world\n' },
    { orig: 'a\nb\nc\n', mod: 'a\nx\nc\n' },
    { orig: 'a\nb\nc\n', mod: 'a\nc\n' },
    { orig: 'a\nc\n', mod: 'a\nb\nc\n' },
    { orig: 'line1\r\nline2\r\n', mod: 'line1\r\nline3\r\n' },
    { orig: '{\n  x();\n}\n', mod: '{\n  y();\n}\n' },
    { orig: '1\n2\n3\n4\n5\n', mod: '1\n3\n5\n' },
    { orig: 'repeat\nrepeat\nrepeat\n', mod: 'repeat\nnew\nrepeat\n' },
  ];

  it('Property 1 & 2: Identity invariant', () => {
    for (const { orig } of testCases) {
      const res = diffChecker(orig, orig);
      expect(res.identical).toBe(true);
      expect(res.summary.added).toBe(0);
      expect(res.summary.removed).toBe(0);
    }
  });

  it('Property 3 & 4: Exact source reconstruction from diff operations', () => {
    for (const { orig, mod } of testCases) {
      const res = diffChecker(orig, mod);

      // Reconstruct original: unchanged and removed lines
      const reconstructedOrig = res.changes
        .filter((c) => c.type === 'unchanged' || c.type === 'removed')
        .map((c) => c.value + (c.lineEnding ?? ''))
        .join('');

      // Reconstruct modified: unchanged and added lines
      const reconstructedMod = res.changes
        .filter((c) => c.type === 'unchanged' || c.type === 'added')
        .map((c) => c.value + (c.lineEnding ?? ''))
        .join('');

      // Note: for identical files or strict line endings, exact string match
      expect(reconstructedOrig).toBe(orig);
      expect(reconstructedMod).toBe(mod);
    }
  });

  it('Property 5: Monotonic line numbering', () => {
    for (const { orig, mod } of testCases) {
      const res = diffChecker(orig, mod);

      let lastOldLine = 0;
      let lastNewLine = 0;

      for (const line of res.changes) {
        if (line.type === 'unchanged') {
          expect(line.oldLineNumber).toBeDefined();
          expect(line.newLineNumber).toBeDefined();
          expect(line.oldLineNumber!).toBe(lastOldLine + 1);
          expect(line.newLineNumber!).toBe(lastNewLine + 1);
          lastOldLine = line.oldLineNumber!;
          lastNewLine = line.newLineNumber!;
        } else if (line.type === 'removed') {
          expect(line.oldLineNumber).toBeDefined();
          expect(line.newLineNumber).toBeUndefined();
          expect(line.oldLineNumber!).toBe(lastOldLine + 1);
          lastOldLine = line.oldLineNumber!;
        } else if (line.type === 'added') {
          expect(line.oldLineNumber).toBeUndefined();
          expect(line.newLineNumber).toBeDefined();
          expect(line.newLineNumber!).toBe(lastNewLine + 1);
          lastNewLine = line.newLineNumber!;
        }
      }
    }
  });

  it('Property 9: Summary counts agree exactly with detailed change lines', () => {
    for (const { orig, mod } of testCases) {
      const res = diffChecker(orig, mod);
      const addedCount = res.changes.filter((c) => c.type === 'added').length;
      const removedCount = res.changes.filter((c) => c.type === 'removed').length;
      const unchangedCount = res.changes.filter((c) => c.type === 'unchanged').length;

      expect(res.summary.added).toBe(addedCount);
      expect(res.summary.removed).toBe(removedCount);
      expect(res.summary.unchanged).toBe(unchangedCount);
      expect(res.summary.totalChanges).toBe(addedCount + removedCount);
      expect(res.summary.identical).toBe(addedCount === 0 && removedCount === 0);
    }
  });

  it('Property 10: Determinism - repeated calls produce identical results', () => {
    const orig = 'function test() {\n  return 42;\n}\n';
    const mod = 'function test() {\n  const x = 42;\n  return x;\n}\n';

    const first = diffChecker(orig, mod);
    for (let i = 0; i < 5; i++) {
      const next = diffChecker(orig, mod);
      expect(next).toEqual(first);
      expect(formatUnifiedDiff(next)).toBe(formatUnifiedDiff(first));
    }
  });

  it('Property: Immutability - inputs and options are never mutated', () => {
    const orig = 'alpha\nbeta\n';
    const mod = 'alpha\ngamma\n';
    const options = { ignoreWhitespace: false, contextLines: 3 };

    const optionsBefore = JSON.stringify(options);
    diffChecker(orig, mod, options);
    expect(JSON.stringify(options)).toBe(optionsBefore);
  });
});
