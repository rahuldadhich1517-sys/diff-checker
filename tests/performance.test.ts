import { describe, it, expect } from 'vitest';
import { diffChecker } from '../src/index.js';

describe('diffChecker - Performance and Resource Safety', () => {
  it('handles large identical files efficiently via fast path', () => {
    const lines = Array.from({ length: 5000 }, (_, i) => `const var_${i} = ${i};`).join('\n') + '\n';

    const start = Date.now();
    const result = diffChecker(lines, lines);
    const duration = Date.now() - start;

    expect(result.identical).toBe(true);
    expect(result.changes).toHaveLength(5000);
    expect(duration).toBeLessThan(1000); // Should be nearly instantaneous (< 100ms)
  });

  it('handles large files with localized changes efficiently via prefix/suffix trimming', () => {
    const commonPrefix = Array.from({ length: 2500 }, (_, i) => `// prefix line ${i}`).join('\n') + '\n';
    const commonSuffix = Array.from({ length: 2500 }, (_, i) => `// suffix line ${i}`).join('\n') + '\n';

    const original = commonPrefix + 'const x = 1;\n' + commonSuffix;
    const modified = commonPrefix + 'const x = 2;\n' + commonSuffix;

    const start = Date.now();
    const result = diffChecker(original, modified);
    const duration = Date.now() - start;

    expect(result.identical).toBe(false);
    expect(result.summary.changed).toBe(1);
    expect(result.summary.unchanged).toBe(5000);
    expect(duration).toBeLessThan(1500);
  });

  it('handles large completely disjoint files efficiently via disjoint set check', () => {
    const original = Array.from({ length: 1500 }, (_, i) => `original line ${i}`).join('\n') + '\n';
    const modified = Array.from({ length: 1500 }, (_, i) => `modified unique line ${i}`).join('\n') + '\n';

    const start = Date.now();
    const result = diffChecker(original, modified);
    const duration = Date.now() - start;

    expect(result.identical).toBe(false);
    expect(result.summary.removed).toBe(1500);
    expect(result.summary.added).toBe(1500);
    expect(result.summary.unchanged).toBe(0);
    expect(duration).toBeLessThan(1500);
  });

  it('handles extremely long individual lines safely', () => {
    const longStr1 = 'a'.repeat(50000);
    const longStr2 = 'a'.repeat(49999) + 'b';

    const original = `header\n${longStr1}\nfooter\n`;
    const modified = `header\n${longStr2}\nfooter\n`;

    const result = diffChecker(original, modified);
    expect(result.summary.changed).toBe(1);
    expect(result.summary.unchanged).toBe(2);
    expect(result.changes[1]?.value.length).toBe(50000);
    expect(result.changes[2]?.value.length).toBe(50000);
  });
});
