import { describe, it, expect } from 'vitest';
import { diffChecker } from '../src/index.js';

describe('diffChecker - Line Handling and Newline Semantics', () => {
  it('correctly splits CRLF line endings', () => {
    const original = 'alpha\r\nbeta\r\n';
    const modified = 'alpha\r\ngamma\r\n';
    const result = diffChecker(original, modified);

    expect(result.changes).toEqual([
      {
        type: 'unchanged',
        value: 'alpha',
        oldLineNumber: 1,
        newLineNumber: 1,
        lineEnding: '\r\n',
      },
      {
        type: 'removed',
        value: 'beta',
        oldLineNumber: 2,
        newLineNumber: undefined,
        lineEnding: '\r\n',
      },
      {
        type: 'added',
        value: 'gamma',
        oldLineNumber: undefined,
        newLineNumber: 2,
        lineEnding: '\r\n',
      },
    ]);
  });

  it('correctly splits CR-only line endings', () => {
    const original = 'alpha\rbeta\r';
    const modified = 'alpha\rbeta\r';
    const result = diffChecker(original, modified);

    expect(result.identical).toBe(true);
    expect(result.changes).toEqual([
      {
        type: 'unchanged',
        value: 'alpha',
        oldLineNumber: 1,
        newLineNumber: 1,
        lineEnding: '\r',
      },
      {
        type: 'unchanged',
        value: 'beta',
        oldLineNumber: 2,
        newLineNumber: 2,
        lineEnding: '\r',
      },
    ]);
  });

  it('handles mixed line endings within the same input', () => {
    const text = 'line1\r\nline2\nline3\rline4';
    const result = diffChecker(text, text);

    expect(result.identical).toBe(true);
    expect(result.changes).toHaveLength(4);
    expect(result.changes[0]?.lineEnding).toBe('\r\n');
    expect(result.changes[1]?.lineEnding).toBe('\n');
    expect(result.changes[2]?.lineEnding).toBe('\r');
    expect(result.changes[3]?.lineEnding).toBe('');
  });

  it('distinguishes trailing newline differences when ignoreTrailingNewline is false', () => {
    const original = 'hello';
    const modified = 'hello\n';
    const result = diffChecker(original, modified, { ignoreTrailingNewline: false });

    expect(result.identical).toBe(false);
    expect(result.changes).toEqual([
      {
        type: 'removed',
        value: 'hello',
        oldLineNumber: 1,
        newLineNumber: undefined,
        lineEnding: '',
      },
      {
        type: 'added',
        value: 'hello',
        oldLineNumber: undefined,
        newLineNumber: 1,
        lineEnding: '\n',
      },
    ]);
  });

  it('treats trailing newline differences as identical when ignoreTrailingNewline is true', () => {
    const original = 'hello';
    const modified = 'hello\n';
    const result = diffChecker(original, modified, { ignoreTrailingNewline: true });

    expect(result.identical).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toEqual({
      type: 'unchanged',
      value: 'hello',
      oldLineNumber: 1,
      newLineNumber: 1,
      lineEnding: '\n',
    });
  });

  it('distinguishes CRLF vs LF when ignoreLineEndings is false', () => {
    const original = 'line1\r\nline2\r\n';
    const modified = 'line1\nline2\n';
    const result = diffChecker(original, modified, { ignoreLineEndings: false });

    expect(result.identical).toBe(false);
    expect(result.summary.removed).toBe(2);
    expect(result.summary.added).toBe(2);
  });

  it('treats CRLF and LF as identical when ignoreLineEndings is true', () => {
    const original = 'line1\r\nline2\r\n';
    const modified = 'line1\nline2\n';
    const result = diffChecker(original, modified, { ignoreLineEndings: true });

    expect(result.identical).toBe(true);
    expect(result.summary.unchanged).toBe(2);
    expect(result.changes[0]?.value).toBe('line1');
    expect(result.changes[1]?.value).toBe('line2');
  });

  it('ignores whitespace when ignoreWhitespace is true, while preserving original line content', () => {
    const original = '  const  x   =  1;  \n';
    const modified = 'const x = 1;\n';

    const defaultResult = diffChecker(original, modified, { ignoreWhitespace: false });
    expect(defaultResult.identical).toBe(false);

    const relaxedResult = diffChecker(original, modified, { ignoreWhitespace: true });
    expect(relaxedResult.identical).toBe(true);
    expect(relaxedResult.changes).toHaveLength(1);
    // Preserves the modified content in unchanged result
    expect(relaxedResult.changes[0]?.value).toBe('const x = 1;');
  });

  it('handles tabs and internal multiple spaces under ignoreWhitespace', () => {
    const original = '\t\tfoo(\t  "bar"  \t);\n';
    const modified = 'foo( "bar" );\n';
    const result = diffChecker(original, modified, { ignoreWhitespace: true });
    expect(result.identical).toBe(true);
  });

  it('ignores case when ignoreCase is true, while preserving line content and casing', () => {
    const original = 'SELECT * FROM users;\n';
    const modified = 'select * from users;\n';

    const defaultResult = diffChecker(original, modified, { ignoreCase: false });
    expect(defaultResult.identical).toBe(false);

    const relaxedResult = diffChecker(original, modified, { ignoreCase: true });
    expect(relaxedResult.identical).toBe(true);
    expect(relaxedResult.changes).toHaveLength(1);
    // Preserves the target line value
    expect(relaxedResult.changes[0]?.value).toBe('select * from users;');
  });

  it('correctly handles Unicode characters, emojis, and RTL text', () => {
    const original = '🚀 Launch\nこんにちは\nمرحبا بك\nCafé au lait\n';
    const modified = '🚀 Launch\nこんにちは 世界\nمرحبا بك\nCafé au lait\n';
    const result = diffChecker(original, modified);

    expect(result.identical).toBe(false);
    expect(result.summary.unchanged).toBe(3);
    expect(result.summary.changed).toBe(1);
    expect(result.changes[1]).toEqual({
      type: 'removed',
      value: 'こんにちは',
      oldLineNumber: 2,
      newLineNumber: undefined,
      lineEnding: '\n',
    });
    expect(result.changes[2]).toEqual({
      type: 'added',
      value: 'こんにちは 世界',
      oldLineNumber: undefined,
      newLineNumber: 2,
      lineEnding: '\n',
    });
  });

  it('preserves meaningful trailing whitespace on lines when ignoreWhitespace is false', () => {
    const original = 'let a = 1;   \n';
    const modified = 'let a = 1;\n';
    const result = diffChecker(original, modified);

    expect(result.identical).toBe(false);
    expect(result.changes[0]?.value).toBe('let a = 1;   ');
    expect(result.changes[1]?.value).toBe('let a = 1;');
  });
});
