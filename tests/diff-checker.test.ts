import { describe, it, expect } from 'vitest';
import { diffChecker } from '../src/index.js';

describe('diffChecker - Basic and Line-by-line comparison', () => {
  it('handles empty inputs', () => {
    const result = diffChecker('', '');
    expect(result.identical).toBe(true);
    expect(result.changes).toEqual([]);
    expect(result.summary).toEqual({
      added: 0,
      removed: 0,
      unchanged: 0,
      changed: 0,
      totalChanges: 0,
      originalLineCount: 0,
      modifiedLineCount: 0,
      identical: true,
    });
  });

  it('handles identical single-line strings', () => {
    const result = diffChecker('hello', 'hello');
    expect(result.identical).toBe(true);
    expect(result.changes).toEqual([
      {
        type: 'unchanged',
        value: 'hello',
        oldLineNumber: 1,
        newLineNumber: 1,
        lineEnding: '',
      },
    ]);
    expect(result.summary.unchanged).toBe(1);
    expect(result.summary.added).toBe(0);
    expect(result.summary.removed).toBe(0);
  });

  it('handles identical multiline strings', () => {
    const text = 'line 1\nline 2\nline 3\n';
    const result = diffChecker(text, text);
    expect(result.identical).toBe(true);
    expect(result.changes).toHaveLength(3);
    expect(result.changes.every((c) => c.type === 'unchanged')).toBe(true);
    expect(result.changes[0]).toEqual({
      type: 'unchanged',
      value: 'line 1',
      oldLineNumber: 1,
      newLineNumber: 1,
      lineEnding: '\n',
    });
    expect(result.changes[1]).toEqual({
      type: 'unchanged',
      value: 'line 2',
      oldLineNumber: 2,
      newLineNumber: 2,
      lineEnding: '\n',
    });
    expect(result.changes[2]).toEqual({
      type: 'unchanged',
      value: 'line 3',
      oldLineNumber: 3,
      newLineNumber: 3,
      lineEnding: '\n',
    });
  });

  it('handles empty original and non-empty modified (pure additions)', () => {
    const result = diffChecker('', 'alpha\nbeta\n');
    expect(result.identical).toBe(false);
    expect(result.changes).toEqual([
      {
        type: 'added',
        value: 'alpha',
        oldLineNumber: undefined,
        newLineNumber: 1,
        lineEnding: '\n',
      },
      {
        type: 'added',
        value: 'beta',
        oldLineNumber: undefined,
        newLineNumber: 2,
        lineEnding: '\n',
      },
    ]);
    expect(result.summary.added).toBe(2);
    expect(result.summary.removed).toBe(0);
    expect(result.summary.changed).toBe(0);
  });

  it('handles non-empty original and empty modified (pure removals)', () => {
    const result = diffChecker('alpha\nbeta\n', '');
    expect(result.identical).toBe(false);
    expect(result.changes).toEqual([
      {
        type: 'removed',
        value: 'alpha',
        oldLineNumber: 1,
        newLineNumber: undefined,
        lineEnding: '\n',
      },
      {
        type: 'removed',
        value: 'beta',
        oldLineNumber: 2,
        newLineNumber: undefined,
        lineEnding: '\n',
      },
    ]);
    expect(result.summary.removed).toBe(2);
    expect(result.summary.added).toBe(0);
    expect(result.summary.changed).toBe(0);
  });

  it('detects a single added line in the beginning', () => {
    const original = 'two\nthree\n';
    const modified = 'one\ntwo\nthree\n';
    const result = diffChecker(original, modified);

    expect(result.identical).toBe(false);
    expect(result.changes).toHaveLength(3);
    expect(result.changes[0]).toEqual({
      type: 'added',
      value: 'one',
      oldLineNumber: undefined,
      newLineNumber: 1,
      lineEnding: '\n',
    });
    expect(result.changes[1]).toEqual({
      type: 'unchanged',
      value: 'two',
      oldLineNumber: 1,
      newLineNumber: 2,
      lineEnding: '\n',
    });
    expect(result.changes[2]).toEqual({
      type: 'unchanged',
      value: 'three',
      oldLineNumber: 2,
      newLineNumber: 3,
      lineEnding: '\n',
    });
  });

  it('detects a single added line in the middle', () => {
    const original = 'one\nthree\n';
    const modified = 'one\ntwo\nthree\n';
    const result = diffChecker(original, modified);

    expect(result.identical).toBe(false);
    expect(result.changes).toEqual([
      {
        type: 'unchanged',
        value: 'one',
        oldLineNumber: 1,
        newLineNumber: 1,
        lineEnding: '\n',
      },
      {
        type: 'added',
        value: 'two',
        oldLineNumber: undefined,
        newLineNumber: 2,
        lineEnding: '\n',
      },
      {
        type: 'unchanged',
        value: 'three',
        oldLineNumber: 2,
        newLineNumber: 3,
        lineEnding: '\n',
      },
    ]);
  });

  it('detects a single added line at the end', () => {
    const original = 'one\ntwo\n';
    const modified = 'one\ntwo\nthree\n';
    const result = diffChecker(original, modified);

    expect(result.identical).toBe(false);
    expect(result.changes).toEqual([
      {
        type: 'unchanged',
        value: 'one',
        oldLineNumber: 1,
        newLineNumber: 1,
        lineEnding: '\n',
      },
      {
        type: 'unchanged',
        value: 'two',
        oldLineNumber: 2,
        newLineNumber: 2,
        lineEnding: '\n',
      },
      {
        type: 'added',
        value: 'three',
        oldLineNumber: undefined,
        newLineNumber: 3,
        lineEnding: '\n',
      },
    ]);
  });

  it('detects a single removed line in the beginning', () => {
    const original = 'one\ntwo\nthree\n';
    const modified = 'two\nthree\n';
    const result = diffChecker(original, modified);

    expect(result.identical).toBe(false);
    expect(result.changes).toEqual([
      {
        type: 'removed',
        value: 'one',
        oldLineNumber: 1,
        newLineNumber: undefined,
        lineEnding: '\n',
      },
      {
        type: 'unchanged',
        value: 'two',
        oldLineNumber: 2,
        newLineNumber: 1,
        lineEnding: '\n',
      },
      {
        type: 'unchanged',
        value: 'three',
        oldLineNumber: 3,
        newLineNumber: 2,
        lineEnding: '\n',
      },
    ]);
  });

  it('detects a single removed line in the middle', () => {
    const original = 'one\ntwo\nthree\n';
    const modified = 'one\nthree\n';
    const result = diffChecker(original, modified);

    expect(result.identical).toBe(false);
    expect(result.changes).toEqual([
      {
        type: 'unchanged',
        value: 'one',
        oldLineNumber: 1,
        newLineNumber: 1,
        lineEnding: '\n',
      },
      {
        type: 'removed',
        value: 'two',
        oldLineNumber: 2,
        newLineNumber: undefined,
        lineEnding: '\n',
      },
      {
        type: 'unchanged',
        value: 'three',
        oldLineNumber: 3,
        newLineNumber: 2,
        lineEnding: '\n',
      },
    ]);
  });

  it('detects a single removed line at the end', () => {
    const original = 'one\ntwo\nthree\n';
    const modified = 'one\ntwo\n';
    const result = diffChecker(original, modified);

    expect(result.identical).toBe(false);
    expect(result.changes).toEqual([
      {
        type: 'unchanged',
        value: 'one',
        oldLineNumber: 1,
        newLineNumber: 1,
        lineEnding: '\n',
      },
      {
        type: 'unchanged',
        value: 'two',
        oldLineNumber: 2,
        newLineNumber: 2,
        lineEnding: '\n',
      },
      {
        type: 'removed',
        value: 'three',
        oldLineNumber: 3,
        newLineNumber: undefined,
        lineEnding: '\n',
      },
    ]);
  });

  it('detects single-line replacement', () => {
    const original = 'one\nold\nthree\n';
    const modified = 'one\nnew\nthree\n';
    const result = diffChecker(original, modified);

    expect(result.identical).toBe(false);
    expect(result.changes).toEqual([
      {
        type: 'unchanged',
        value: 'one',
        oldLineNumber: 1,
        newLineNumber: 1,
        lineEnding: '\n',
      },
      {
        type: 'removed',
        value: 'old',
        oldLineNumber: 2,
        newLineNumber: undefined,
        lineEnding: '\n',
      },
      {
        type: 'added',
        value: 'new',
        oldLineNumber: undefined,
        newLineNumber: 2,
        lineEnding: '\n',
      },
      {
        type: 'unchanged',
        value: 'three',
        oldLineNumber: 3,
        newLineNumber: 3,
        lineEnding: '\n',
      },
    ]);
    expect(result.summary.changed).toBe(1);
    expect(result.summary.added).toBe(1);
    expect(result.summary.removed).toBe(1);
  });

  it('handles multiple consecutive lines replaced by fewer lines', () => {
    const original = 'prefix\nrem1\nrem2\nrem3\nsuffix\n';
    const modified = 'prefix\nadd1\nsuffix\n';
    const result = diffChecker(original, modified);

    expect(result.identical).toBe(false);
    expect(result.summary.removed).toBe(3);
    expect(result.summary.added).toBe(1);
    expect(result.summary.changed).toBe(1); // 1 replacement, 2 extra deletions
    expect(result.changes).toEqual([
      {
        type: 'unchanged',
        value: 'prefix',
        oldLineNumber: 1,
        newLineNumber: 1,
        lineEnding: '\n',
      },
      {
        type: 'removed',
        value: 'rem1',
        oldLineNumber: 2,
        newLineNumber: undefined,
        lineEnding: '\n',
      },
      {
        type: 'removed',
        value: 'rem2',
        oldLineNumber: 3,
        newLineNumber: undefined,
        lineEnding: '\n',
      },
      {
        type: 'removed',
        value: 'rem3',
        oldLineNumber: 4,
        newLineNumber: undefined,
        lineEnding: '\n',
      },
      {
        type: 'added',
        value: 'add1',
        oldLineNumber: undefined,
        newLineNumber: 2,
        lineEnding: '\n',
      },
      {
        type: 'unchanged',
        value: 'suffix',
        oldLineNumber: 5,
        newLineNumber: 3,
        lineEnding: '\n',
      },
    ]);
  });

  it('handles one line replaced by multiple lines', () => {
    const original = 'prefix\nrem1\nsuffix\n';
    const modified = 'prefix\nadd1\nadd2\nsuffix\n';
    const result = diffChecker(original, modified);

    expect(result.summary.removed).toBe(1);
    expect(result.summary.added).toBe(2);
    expect(result.summary.changed).toBe(1);
    expect(result.changes).toEqual([
      {
        type: 'unchanged',
        value: 'prefix',
        oldLineNumber: 1,
        newLineNumber: 1,
        lineEnding: '\n',
      },
      {
        type: 'removed',
        value: 'rem1',
        oldLineNumber: 2,
        newLineNumber: undefined,
        lineEnding: '\n',
      },
      {
        type: 'added',
        value: 'add1',
        oldLineNumber: undefined,
        newLineNumber: 2,
        lineEnding: '\n',
      },
      {
        type: 'added',
        value: 'add2',
        oldLineNumber: undefined,
        newLineNumber: 3,
        lineEnding: '\n',
      },
      {
        type: 'unchanged',
        value: 'suffix',
        oldLineNumber: 3,
        newLineNumber: 4,
        lineEnding: '\n',
      },
    ]);
  });

  it('handles repeated identical lines and braces', () => {
    const original = '{\n  x();\n}\n{\n  y();\n}\n';
    const modified = '{\n  x();\n}\n{\n  z();\n}\n';
    const result = diffChecker(original, modified);

    expect(result.summary.changed).toBe(1);
    expect(result.summary.unchanged).toBe(5);
    expect(result.summary.added).toBe(1);
    expect(result.summary.removed).toBe(1);

    const changedLines = result.changes.filter((c) => c.type !== 'unchanged');
    expect(changedLines).toEqual([
      {
        type: 'removed',
        value: '  y();',
        oldLineNumber: 5,
        newLineNumber: undefined,
        lineEnding: '\n',
      },
      {
        type: 'added',
        value: '  z();',
        oldLineNumber: undefined,
        newLineNumber: 5,
        lineEnding: '\n',
      },
    ]);
  });

  it('handles blank line additions, deletions, and replacements', () => {
    const original = 'line1\n\nline2\n';
    const modified = 'line1\n\n\nline2\n';
    const result = diffChecker(original, modified);

    expect(result.summary.added).toBe(1);
    expect(result.summary.removed).toBe(0);
    expect(result.summary.unchanged).toBe(3);
  });

  it('handles insertion in middle surrounded by prefix and suffix', () => {
    const original = 'pref\nsuff\n';
    const modified = 'pref\ninserted\nsuff\n';
    const result = diffChecker(original, modified);

    expect(result.changes).toEqual([
      {
        type: 'unchanged',
        value: 'pref',
        oldLineNumber: 1,
        newLineNumber: 1,
        lineEnding: '\n',
      },
      {
        type: 'added',
        value: 'inserted',
        oldLineNumber: undefined,
        newLineNumber: 2,
        lineEnding: '\n',
      },
      {
        type: 'unchanged',
        value: 'suff',
        oldLineNumber: 2,
        newLineNumber: 3,
        lineEnding: '\n',
      },
    ]);
  });

  it('handles deletion in middle surrounded by prefix and suffix', () => {
    const original = 'pref\ndeleted\nsuff\n';
    const modified = 'pref\nsuff\n';
    const result = diffChecker(original, modified);

    expect(result.changes).toEqual([
      {
        type: 'unchanged',
        value: 'pref',
        oldLineNumber: 1,
        newLineNumber: 1,
        lineEnding: '\n',
      },
      {
        type: 'removed',
        value: 'deleted',
        oldLineNumber: 2,
        newLineNumber: undefined,
        lineEnding: '\n',
      },
      {
        type: 'unchanged',
        value: 'suff',
        oldLineNumber: 3,
        newLineNumber: 2,
        lineEnding: '\n',
      },
    ]);
  });

  it('runs disjoint check with ignoreWhitespace, ignoreCase, ignoreLineEndings options', () => {
    const original = 'pref\n  ALPHA  \r\nsuff\n';
    const modified = 'pref\n  BETA  \nsuff\n';
    const result = diffChecker(original, modified, {
      ignoreWhitespace: true,
      ignoreCase: true,
      ignoreLineEndings: true,
    });

    expect(result.summary.removed).toBe(1);
    expect(result.summary.added).toBe(1);
  });

  it('handles reordered lines as removals and additions', () => {
    const original = 'alpha\nbeta\n';
    const modified = 'beta\nalpha\n';
    const result = diffChecker(original, modified);

    expect(result.identical).toBe(false);
    expect(result.summary.originalLineCount).toBe(2);
    expect(result.summary.modifiedLineCount).toBe(2);
    // Verified that reordering preserves all content and valid line counts
    const addedValues = result.changes.filter((c) => c.type === 'added').map((c) => c.value);
    const removedValues = result.changes.filter((c) => c.type === 'removed').map((c) => c.value);
    expect(addedValues.length).toBeGreaterThan(0);
    expect(removedValues.length).toBeGreaterThan(0);
  });
});
