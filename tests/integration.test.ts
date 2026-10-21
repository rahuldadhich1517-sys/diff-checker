import { describe, it, expect } from 'vitest';
import { diffChecker, formatUnifiedDiff, summarizeDiff } from '../src/index.js';
import { diffChecker as diffCheckerSub } from '../src/diff-checker/index.js';
import { formatUnifiedDiff as formatUnifiedDiffSub } from '../src/unified-diff/index.js';
import { summarizeDiff as summarizeDiffSub } from '../src/summary/index.js';

describe('diffChecker - Integration with Source Code and Configs', () => {
  it('diffs TypeScript source code accurately', () => {
    const originalTs = [
      'export interface User {',
      '  id: string;',
      '  name: string;',
      '}',
      '',
      'export function getUser(id: string): User {',
      '  return { id, name: "Alice" };',
      '}',
    ].join('\n') + '\n';

    const modifiedTs = [
      'export interface User {',
      '  id: string;',
      '  name: string;',
      '  email: string;',
      '}',
      '',
      'export function getUser(id: string): User {',
      '  return { id, name: "Alice", email: "alice@example.com" };',
      '}',
    ].join('\n') + '\n';

    const result = diffChecker(originalTs, modifiedTs);
    expect(result.identical).toBe(false);
    expect(result.summary.added).toBe(2);
    expect(result.summary.removed).toBe(1);
    expect(result.summary.changed).toBe(1);

    const unified = formatUnifiedDiff(result, {
      originalFileName: 'user.ts',
      modifiedFileName: 'user.ts',
    });
    expect(unified).toContain('--- user.ts');
    expect(unified).toContain('+++ user.ts');
    expect(unified).toContain('+  email: string;');
    expect(unified).toContain('-  return { id, name: "Alice" };');
    expect(unified).toContain('+  return { id, name: "Alice", email: "alice@example.com" };');
  });

  it('diffs JSON configuration text', () => {
    const origJson = JSON.stringify({ name: 'pkg', version: '0.1.0', private: true }, null, 2) + '\n';
    const modJson = JSON.stringify({ name: 'pkg', version: '0.2.0', private: false }, null, 2) + '\n';

    const result = diffChecker(origJson, modJson);
    expect(result.summary.changed).toBe(2);
    expect(result.summary.unchanged).toBe(3);
  });

  it('diffs YAML text', () => {
    const origYaml = 'name: CI\non: push\njobs:\n  build:\n    runs-on: ubuntu-latest\n';
    const modYaml = 'name: CI\non: [push, pull_request]\njobs:\n  build:\n    runs-on: ubuntu-22.04\n';

    const result = diffChecker(origYaml, modYaml);
    expect(result.summary.changed).toBe(2);
    expect(result.summary.unchanged).toBe(3);
  });

  it('diffs Python source code', () => {
    const origPy = 'def calculate(x, y):\n    return x + y\n';
    const modPy = 'def calculate(x, y):\n    # add docstring\n    return x + y\n';

    const result = diffChecker(origPy, modPy);
    expect(result.summary.added).toBe(1);
    expect(result.summary.unchanged).toBe(2);
  });

  it('diffs Markdown text', () => {
    const origMd = '# Diff Checker\n\nA simple line-by-line diff tool.\n';
    const modMd = '# Diff Checker\n\nA production-ready line-by-line diff tool.\n\n## Features\n';

    const result = diffChecker(origMd, modMd);
    expect(result.summary.changed).toBe(1);
    expect(result.summary.removed).toBe(1);
    expect(result.summary.added).toBe(3);
  });

  it('diffs HTML markup', () => {
    const origHtml = '<div class="container">\n  <h1>Title</h1>\n</div>\n';
    const modHtml = '<div class="container">\n  <h1>Updated Title</h1>\n  <p>Subtitle</p>\n</div>\n';

    const result = diffChecker(origHtml, modHtml);
    expect(result.summary.changed).toBe(1);
    expect(result.summary.removed).toBe(1);
    expect(result.summary.added).toBe(2);
  });

  it('supports submodule imports consistently', () => {
    const res1 = diffChecker('a\n', 'b\n');
    const res2 = diffCheckerSub('a\n', 'b\n');
    expect(res1).toEqual(res2);

    const sum1 = summarizeDiff(res1);
    const sum2 = summarizeDiffSub(res2);
    expect(sum1).toEqual(sum2);

    const uni1 = formatUnifiedDiff(res1);
    const uni2 = formatUnifiedDiffSub(res2);
    expect(uni1).toBe(uni2);
  });
});
