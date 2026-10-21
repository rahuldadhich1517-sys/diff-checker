import { describe, it, expect } from 'vitest';
import { diffChecker, summarizeDiff } from '../src/index.js';
import type { DiffLine } from '../src/index.js';

describe('summarizeDiff - Diff Summary Statistics', () => {
  it('summarizes empty / identical diffs', () => {
    const diff = diffChecker('', '');
    const summary = summarizeDiff(diff);

    expect(summary).toEqual({
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

  it('summarizes purely additions', () => {
    const diff = diffChecker('', 'line 1\nline 2\nline 3\n');
    const summary = summarizeDiff(diff);

    expect(summary).toEqual({
      added: 3,
      removed: 0,
      unchanged: 0,
      changed: 0,
      totalChanges: 3,
      originalLineCount: 0,
      modifiedLineCount: 3,
      identical: false,
    });
  });

  it('summarizes purely removals', () => {
    const diff = diffChecker('line 1\nline 2\nline 3\nline 4\n', '');
    const summary = summarizeDiff(diff);

    expect(summary).toEqual({
      added: 0,
      removed: 4,
      unchanged: 0,
      changed: 0,
      totalChanges: 4,
      originalLineCount: 4,
      modifiedLineCount: 0,
      identical: false,
    });
  });

  it('calculates conceptual replacements (changed) accurately for 1-to-1 replacement', () => {
    const lines: DiffLine[] = [
      { type: 'unchanged', value: 'a', oldLineNumber: 1, newLineNumber: 1 },
      { type: 'removed', value: 'old', oldLineNumber: 2 },
      { type: 'added', value: 'new', newLineNumber: 2 },
      { type: 'unchanged', value: 'b', oldLineNumber: 3, newLineNumber: 3 },
    ];

    const summary = summarizeDiff(lines);
    expect(summary.changed).toBe(1);
    expect(summary.added).toBe(1);
    expect(summary.removed).toBe(1);
    expect(summary.totalChanges).toBe(2);
    expect(summary.unchanged).toBe(2);
    expect(summary.originalLineCount).toBe(3);
    expect(summary.modifiedLineCount).toBe(3);
    expect(summary.identical).toBe(false);
  });

  it('calculates conceptual replacements for asymmetric replacement (3 removed, 2 added)', () => {
    const lines: DiffLine[] = [
      { type: 'removed', value: 'r1', oldLineNumber: 1 },
      { type: 'removed', value: 'r2', oldLineNumber: 2 },
      { type: 'removed', value: 'r3', oldLineNumber: 3 },
      { type: 'added', value: 'a1', newLineNumber: 1 },
      { type: 'added', value: 'a2', newLineNumber: 2 },
    ];

    const summary = summarizeDiff(lines);
    // min(3, 2) = 2 replacements
    expect(summary.changed).toBe(2);
    expect(summary.removed).toBe(3);
    expect(summary.added).toBe(2);
    expect(summary.totalChanges).toBe(5);
    expect(summary.originalLineCount).toBe(3);
    expect(summary.modifiedLineCount).toBe(2);
  });

  it('calculates conceptual replacements across multiple separate change chunks', () => {
    const lines: DiffLine[] = [
      // Chunk 1: 1 removed, 2 added -> min(1, 2) = 1
      { type: 'removed', value: 'r1', oldLineNumber: 1 },
      { type: 'added', value: 'a1', newLineNumber: 1 },
      { type: 'added', value: 'a2', newLineNumber: 2 },
      // Boundary unchanged line
      { type: 'unchanged', value: 'ctx', oldLineNumber: 2, newLineNumber: 3 },
      // Chunk 2: 3 removed, 1 added -> min(3, 1) = 1
      { type: 'removed', value: 'r2', oldLineNumber: 3 },
      { type: 'removed', value: 'r3', oldLineNumber: 4 },
      { type: 'removed', value: 'r4', oldLineNumber: 5 },
      { type: 'added', value: 'a3', newLineNumber: 4 },
    ];

    const summary = summarizeDiff(lines);
    expect(summary.changed).toBe(2); // 1 + 1 = 2
    expect(summary.removed).toBe(4);
    expect(summary.added).toBe(3);
    expect(summary.totalChanges).toBe(7);
    expect(summary.unchanged).toBe(1);
    expect(summary.originalLineCount).toBe(5);
    expect(summary.modifiedLineCount).toBe(4);
  });
});
