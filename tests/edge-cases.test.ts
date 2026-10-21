import { describe, it, expect } from 'vitest';
import { diffChecker, formatUnifiedDiff, summarizeDiff, DiffCheckerError } from '../src/index.js';

describe('diffChecker - Edge Cases and Validation', () => {
  describe('Input validation for diffChecker', () => {
    it('throws DiffCheckerError when originalText is not a string', () => {
      // @ts-expect-error testing runtime validation
      expect(() => diffChecker(null, 'test')).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => diffChecker(undefined, 'test')).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => diffChecker(123, 'test')).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => diffChecker(['line'], 'test')).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => diffChecker({ text: 'a' }, 'test')).toThrow(DiffCheckerError);

      try {
        // @ts-expect-error testing runtime validation
        diffChecker(123, 'test');
      } catch (err) {
        expect(err).toBeInstanceOf(DiffCheckerError);
        expect((err as DiffCheckerError).code).toBe('INVALID_INPUT_TYPE');
      }
    });

    it('throws DiffCheckerError when modifiedText is not a string', () => {
      // @ts-expect-error testing runtime validation
      expect(() => diffChecker('test', null)).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => diffChecker('test', undefined)).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => diffChecker('test', 456)).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => diffChecker('test', false)).toThrow(DiffCheckerError);
    });

    it('throws DiffCheckerError when options is not an object', () => {
      // @ts-expect-error testing runtime validation
      expect(() => diffChecker('a', 'b', 'options')).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => diffChecker('a', 'b', null)).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => diffChecker('a', 'b', [1, 2])).toThrow(DiffCheckerError);
    });

    it('throws DiffCheckerError when option properties have invalid types', () => {
      // @ts-expect-error testing runtime validation
      expect(() => diffChecker('a', 'b', { ignoreWhitespace: 'yes' })).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => diffChecker('a', 'b', { ignoreCase: 1 })).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => diffChecker('a', 'b', { ignoreLineEndings: 'false' })).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => diffChecker('a', 'b', { ignoreTrailingNewline: {} })).toThrow(DiffCheckerError);
    });

    it('throws DiffCheckerError for invalid maxInputLines values', () => {
      expect(() => diffChecker('a', 'b', { maxInputLines: -1 })).toThrow(DiffCheckerError);
      expect(() => diffChecker('a', 'b', { maxInputLines: 0 })).toThrow(DiffCheckerError);
      expect(() => diffChecker('a', 'b', { maxInputLines: 3.5 })).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => diffChecker('a', 'b', { maxInputLines: '10' })).toThrow(DiffCheckerError);
    });

    it('throws DiffCheckerError for invalid maxInputLength values', () => {
      expect(() => diffChecker('a', 'b', { maxInputLength: -10 })).toThrow(DiffCheckerError);
      expect(() => diffChecker('a', 'b', { maxInputLength: 0 })).toThrow(DiffCheckerError);
      expect(() => diffChecker('a', 'b', { maxInputLength: 1.5 })).toThrow(DiffCheckerError);
    });
  });

  describe('Boundary testing for resource limits', () => {
    it('enforces maxInputLines boundary', () => {
      const text3Lines = 'line1\nline2\nline3\n';
      // Exactly at limit -> succeeds
      expect(() => diffChecker(text3Lines, 'line1\n', { maxInputLines: 3 })).not.toThrow();

      // Exceeds limit -> throws INPUT_LIMIT_EXCEEDED
      expect(() => diffChecker(text3Lines, 'line1\n', { maxInputLines: 2 })).toThrowError(
        /exceeds maxInputLines limit/,
      );
    });

    it('enforces maxInputLines boundary on modifiedText', () => {
      const text3Lines = 'line1\nline2\nline3\n';
      expect(() => diffChecker('line1\n', text3Lines, { maxInputLines: 2 })).toThrowError(
        /modifiedText line count \(3\) exceeds maxInputLines limit \(2\)/,
      );
    });

    it('enforces maxInputLength boundary on originalText', () => {
      const text5Chars = '12345';
      // Exactly at limit -> succeeds
      expect(() => diffChecker(text5Chars, 'abc', { maxInputLength: 5 })).not.toThrow();

      // Exceeds limit -> throws INPUT_LIMIT_EXCEEDED
      expect(() => diffChecker(text5Chars, 'abc', { maxInputLength: 4 })).toThrowError(
        /originalText length \(5\) exceeds maxInputLength limit \(4\)/,
      );
    });

    it('enforces maxInputLength boundary on modifiedText', () => {
      const text5Chars = '12345';
      expect(() => diffChecker('abc', text5Chars, { maxInputLength: 4 })).toThrowError(
        /modifiedText length \(5\) exceeds maxInputLength limit \(4\)/,
      );
    });
  });

  describe('Input validation for formatUnifiedDiff and summarizeDiff', () => {
    it('throws on null or undefined input to formatUnifiedDiff', () => {
      // @ts-expect-error testing runtime validation
      expect(() => formatUnifiedDiff(null)).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => formatUnifiedDiff(undefined)).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => formatUnifiedDiff('string')).toThrow(DiffCheckerError);
    });

    it('throws on invalid options to formatUnifiedDiff', () => {
      const diff = diffChecker('a\n', 'b\n');
      // @ts-expect-error testing runtime validation
      expect(() => formatUnifiedDiff(diff, [1, 2])).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => formatUnifiedDiff(diff, 'str')).toThrow(DiffCheckerError);
      expect(() => formatUnifiedDiff(diff, { contextLines: -1 })).toThrow(DiffCheckerError);
      expect(() => formatUnifiedDiff(diff, { contextLines: 1.5 })).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => formatUnifiedDiff(diff, { newline: 'foo' })).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => formatUnifiedDiff(diff, { originalFileName: 123 })).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => formatUnifiedDiff(diff, { modifiedFileName: 456 })).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => formatUnifiedDiff(diff, { originalHeader: 123 })).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => formatUnifiedDiff(diff, { modifiedHeader: 456 })).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => formatUnifiedDiff(diff, { trailingNewline: 'yes' })).toThrow(DiffCheckerError);
    });

    it('throws on null or invalid input to summarizeDiff', () => {
      // @ts-expect-error testing runtime validation
      expect(() => summarizeDiff(null)).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => summarizeDiff(undefined)).toThrow(DiffCheckerError);
      // @ts-expect-error testing runtime validation
      expect(() => summarizeDiff({ notChanges: [] })).toThrow(DiffCheckerError);
    });
  });
});
