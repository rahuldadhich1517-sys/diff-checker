import { describe, it, expect } from 'vitest';
import { diffChecker, formatUnifiedDiff } from '../src/index.js';

describe('formatUnifiedDiff - Unified Diff Formatter', () => {
  it('returns empty string when there are no changes', () => {
    const diff = diffChecker('hello\nworld\n', 'hello\nworld\n');
    const unified = formatUnifiedDiff(diff);
    expect(unified).toBe('');
  });

  it('formats pure additions on an empty file', () => {
    const diff = diffChecker('', 'line 1\nline 2\n');
    const unified = formatUnifiedDiff(diff, {
      originalFileName: 'empty.txt',
      modifiedFileName: 'new.txt',
    });

    const expected = [
      '--- empty.txt',
      '+++ new.txt',
      '@@ -0,0 +1,2 @@',
      '+line 1',
      '+line 2',
      '',
    ].join('\n');

    expect(unified).toBe(expected);
  });

  it('formats pure deletions down to an empty file', () => {
    const diff = diffChecker('line 1\nline 2\n', '');
    const unified = formatUnifiedDiff(diff);

    const expected = [
      '--- a',
      '+++ b',
      '@@ -1,2 +0,0 @@',
      '-line 1',
      '-line 2',
      '',
    ].join('\n');

    expect(unified).toBe(expected);
  });

  it('formats single-line replacement with default context', () => {
    const original = 'c1\nc2\nold\nc3\nc4\n';
    const modified = 'c1\nc2\nnew\nc3\nc4\n';
    const diff = diffChecker(original, modified);
    const unified = formatUnifiedDiff(diff);

    const expected = [
      '--- a',
      '+++ b',
      '@@ -1,5 +1,5 @@',
      ' c1',
      ' c2',
      '-old',
      '+new',
      ' c3',
      ' c4',
      '',
    ].join('\n');

    expect(unified).toBe(expected);
  });

  it('respects configurable contextLines = 1', () => {
    const original = 'c1\nc2\nold\nc3\nc4\n';
    const modified = 'c1\nc2\nnew\nc3\nc4\n';
    const diff = diffChecker(original, modified);
    const unified = formatUnifiedDiff(diff, { contextLines: 1 });

    const expected = [
      '--- a',
      '+++ b',
      '@@ -2,3 +2,3 @@',
      ' c2',
      '-old',
      '+new',
      ' c3',
      '',
    ].join('\n');

    expect(unified).toBe(expected);
  });

  it('respects contextLines = 0', () => {
    const original = 'c1\nc2\nold\nc3\nc4\n';
    const modified = 'c1\nc2\nnew\nc3\nc4\n';
    const diff = diffChecker(original, modified);
    const unified = formatUnifiedDiff(diff, { contextLines: 0 });

    const expected = [
      '--- a',
      '+++ b',
      '@@ -3 +3 @@',
      '-old',
      '+new',
      '',
    ].join('\n');

    expect(unified).toBe(expected);
  });

  it('merges adjacent changes when gap <= 2 * contextLines', () => {
    // Gap of 2 context lines between changes (2 <= 2 * 3 = 6) -> single merged hunk
    const original = 'a\nb\nCHANGE_1\nx\ny\nCHANGE_2\nc\nd\n';
    const modified = 'a\nb\nMOD_1\nx\ny\nMOD_2\nc\nd\n';
    const diff = diffChecker(original, modified);
    const unified = formatUnifiedDiff(diff, { contextLines: 3 });

    expect(unified).toContain('@@ -1,8 +1,8 @@');
    expect(unified.match(/@@/g)).toHaveLength(2); // One hunk header (has 2 @@ markers)
  });

  it('produces multiple separate hunks when gap > 2 * contextLines', () => {
    // Gap of 8 lines with contextLines = 2 (8 > 4) -> 2 separate hunks
    const gap = 'g1\ng2\ng3\ng4\ng5\ng6\ng7\ng8\n';
    const original = 'CHANGE_1\n' + gap + 'CHANGE_2\n';
    const modified = 'MOD_1\n' + gap + 'MOD_2\n';

    const diff = diffChecker(original, modified);
    const unified = formatUnifiedDiff(diff, { contextLines: 2 });

    const hunkHeaders = unified.split('\n').filter((l) => l.startsWith('@@'));
    expect(hunkHeaders).toHaveLength(2);
    expect(hunkHeaders[0]).toBe('@@ -1,3 +1,3 @@');
    expect(hunkHeaders[1]).toBe('@@ -8,3 +8,3 @@');
  });

  it('outputs "\\ No newline at end of file" when original input lacks trailing newline', () => {
    const original = 'a\nold';
    const modified = 'a\nnew\n';
    const diff = diffChecker(original, modified);
    const unified = formatUnifiedDiff(diff);

    expect(unified).toContain('-old\n\\ No newline at end of file\n+new');
  });

  it('outputs "\\ No newline at end of file" when modified input lacks trailing newline', () => {
    const original = 'a\nold\n';
    const modified = 'a\nnew';
    const diff = diffChecker(original, modified);
    const unified = formatUnifiedDiff(diff);

    expect(unified).toContain('+new\n\\ No newline at end of file');
  });

  it('supports custom headers (originalHeader, modifiedHeader)', () => {
    const diff = diffChecker('old\n', 'new\n');
    const unified = formatUnifiedDiff(diff, {
      originalHeader: '--- a/app.ts\t2026-01-01 00:00:00.000000000 +0000',
      modifiedHeader: '+++ b/app.ts\t2026-01-02 00:00:00.000000000 +0000',
    });

    expect(unified).toContain('--- a/app.ts\t2026-01-01 00:00:00.000000000 +0000');
    expect(unified).toContain('+++ b/app.ts\t2026-01-02 00:00:00.000000000 +0000');
  });

  it('supports configurable newline style (CRLF)', () => {
    const diff = diffChecker('old\n', 'new\n');
    const unified = formatUnifiedDiff(diff, { newline: '\r\n' });

    expect(unified).toContain('\r\n');
    expect(unified.startsWith('--- a\r\n+++ b\r\n')).toBe(true);
  });

  it('supports trailingNewline: false', () => {
    const diff = diffChecker('old\n', 'new\n');
    const unified = formatUnifiedDiff(diff, { trailingNewline: false });

    expect(unified.endsWith('+new')).toBe(true);
  });

  it('handles pure addition with contextLines = 0 preceded by unchanged lines', () => {
    const original = 'first\nlast\n';
    const modified = 'first\ninserted\nlast\n';
    const diff = diffChecker(original, modified);
    const unified = formatUnifiedDiff(diff, { contextLines: 0 });

    expect(unified).toContain('@@ -1,0 +2 @@');
    expect(unified).toContain('+inserted');
  });

  it('handles pure deletion with contextLines = 0 preceded by unchanged lines', () => {
    const original = 'first\ndeleted\nlast\n';
    const modified = 'first\nlast\n';
    const diff = diffChecker(original, modified);
    const unified = formatUnifiedDiff(diff, { contextLines: 0 });

    expect(unified).toContain('@@ -2 +1,0 @@');
    expect(unified).toContain('-deleted');
  });

  it('outputs "\\ No newline at end of file" for unchanged trailing line without newline', () => {
    const original = 'first\nlast';
    const modified = 'first\nmod\nlast';
    const diff = diffChecker(original, modified);
    const unified = formatUnifiedDiff(diff);

    expect(unified).toContain(' last\n\\ No newline at end of file');
  });

  it('accepts raw DiffLine[] directly', () => {
    const diff = diffChecker('old\n', 'new\n');
    const unified = formatUnifiedDiff(diff.changes);

    expect(unified).toContain('-old');
    expect(unified).toContain('+new');
  });
});
