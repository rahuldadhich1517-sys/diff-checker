import { DiffCheckerError } from './errors.js';
import type { DiffCheckerOptions, UnifiedDiffOptions } from '../diff-checker/types.js';

export function validateDiffCheckerInputs(
  originalText: unknown,
  modifiedText: unknown,
  options?: unknown,
): asserts options is DiffCheckerOptions | undefined {
  if (typeof originalText !== 'string') {
    const actualType = originalText === null ? 'null' : Array.isArray(originalText) ? 'array' : typeof originalText;
    throw new DiffCheckerError(
      `Expected originalText to be a string, received ${actualType}`,
      'INVALID_INPUT_TYPE',
    );
  }

  if (typeof modifiedText !== 'string') {
    const actualType = modifiedText === null ? 'null' : Array.isArray(modifiedText) ? 'array' : typeof modifiedText;
    throw new DiffCheckerError(
      `Expected modifiedText to be a string, received ${actualType}`,
      'INVALID_INPUT_TYPE',
    );
  }

  if (options !== undefined) {
    if (typeof options !== 'object' || options === null || Array.isArray(options)) {
      const actualType = options === null ? 'null' : Array.isArray(options) ? 'array' : typeof options;
      throw new DiffCheckerError(
        `Expected options to be an object, received ${actualType}`,
        'INVALID_OPTION',
      );
    }

    const opts = options as Record<string, unknown>;

    if (opts['ignoreWhitespace'] !== undefined && typeof opts['ignoreWhitespace'] !== 'boolean') {
      throw new DiffCheckerError('ignoreWhitespace option must be a boolean', 'INVALID_OPTION');
    }

    if (opts['ignoreCase'] !== undefined && typeof opts['ignoreCase'] !== 'boolean') {
      throw new DiffCheckerError('ignoreCase option must be a boolean', 'INVALID_OPTION');
    }

    if (opts['ignoreLineEndings'] !== undefined && typeof opts['ignoreLineEndings'] !== 'boolean') {
      throw new DiffCheckerError('ignoreLineEndings option must be a boolean', 'INVALID_OPTION');
    }

    if (opts['ignoreTrailingNewline'] !== undefined && typeof opts['ignoreTrailingNewline'] !== 'boolean') {
      throw new DiffCheckerError('ignoreTrailingNewline option must be a boolean', 'INVALID_OPTION');
    }

    if (opts['maxInputLines'] !== undefined) {
      const val = opts['maxInputLines'];
      if (typeof val !== 'number' || !Number.isInteger(val) || val <= 0) {
        throw new DiffCheckerError(
          `maxInputLines must be a positive integer, received ${String(val)}`,
          'INVALID_OPTION',
        );
      }
    }

    if (opts['maxInputLength'] !== undefined) {
      const val = opts['maxInputLength'];
      if (typeof val !== 'number' || !Number.isInteger(val) || val <= 0) {
        throw new DiffCheckerError(
          `maxInputLength must be a positive integer, received ${String(val)}`,
          'INVALID_OPTION',
        );
      }
    }

    if (opts['maxInputLength'] !== undefined) {
      const limit = opts['maxInputLength'] as number;
      if (originalText.length > limit) {
        throw new DiffCheckerError(
          `originalText length (${originalText.length}) exceeds maxInputLength limit (${limit})`,
          'INPUT_LIMIT_EXCEEDED',
        );
      }
      if (modifiedText.length > limit) {
        throw new DiffCheckerError(
          `modifiedText length (${modifiedText.length}) exceeds maxInputLength limit (${limit})`,
          'INPUT_LIMIT_EXCEEDED',
        );
      }
    }
  }
}

export function validateLineCountLimits(
  originalLinesCount: number,
  modifiedLinesCount: number,
  maxInputLines?: number,
): void {
  if (maxInputLines !== undefined) {
    if (originalLinesCount > maxInputLines) {
      throw new DiffCheckerError(
        `originalText line count (${originalLinesCount}) exceeds maxInputLines limit (${maxInputLines})`,
        'INPUT_LIMIT_EXCEEDED',
      );
    }
    if (modifiedLinesCount > maxInputLines) {
      throw new DiffCheckerError(
        `modifiedText line count (${modifiedLinesCount}) exceeds maxInputLines limit (${maxInputLines})`,
        'INPUT_LIMIT_EXCEEDED',
      );
    }
  }
}

export function validateUnifiedDiffOptions(
  options?: unknown,
): asserts options is UnifiedDiffOptions | undefined {
  if (options === undefined) {
    return;
  }

  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    const actualType = options === null ? 'null' : Array.isArray(options) ? 'array' : typeof options;
    throw new DiffCheckerError(
      `Expected options to be an object, received ${actualType}`,
      'INVALID_OPTION',
    );
  }

  const opts = options as Record<string, unknown>;

  if (opts['contextLines'] !== undefined) {
    const val = opts['contextLines'];
    if (typeof val !== 'number' || !Number.isInteger(val) || val < 0) {
      throw new DiffCheckerError(
        `contextLines must be a non-negative integer, received ${String(val)}`,
        'INVALID_OPTION',
      );
    }
  }

  if (opts['originalFileName'] !== undefined && typeof opts['originalFileName'] !== 'string') {
    throw new DiffCheckerError('originalFileName must be a string', 'INVALID_OPTION');
  }

  if (opts['modifiedFileName'] !== undefined && typeof opts['modifiedFileName'] !== 'string') {
    throw new DiffCheckerError('modifiedFileName must be a string', 'INVALID_OPTION');
  }

  if (opts['originalHeader'] !== undefined && typeof opts['originalHeader'] !== 'string') {
    throw new DiffCheckerError('originalHeader must be a string', 'INVALID_OPTION');
  }

  if (opts['modifiedHeader'] !== undefined && typeof opts['modifiedHeader'] !== 'string') {
    throw new DiffCheckerError('modifiedHeader must be a string', 'INVALID_OPTION');
  }

  if (opts['newline'] !== undefined && opts['newline'] !== '\n' && opts['newline'] !== '\r\n') {
    throw new DiffCheckerError('newline option must be either "\\n" or "\\r\\n"', 'INVALID_OPTION');
  }

  if (opts['trailingNewline'] !== undefined && typeof opts['trailingNewline'] !== 'boolean') {
    throw new DiffCheckerError('trailingNewline option must be a boolean', 'INVALID_OPTION');
  }
}
