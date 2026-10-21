export type DiffCheckerErrorCode =
  | 'INVALID_INPUT_TYPE'
  | 'INVALID_OPTION'
  | 'INPUT_LIMIT_EXCEEDED';

export class DiffCheckerError extends Error {
  readonly code: DiffCheckerErrorCode;

  constructor(message: string, code: DiffCheckerErrorCode) {
    super(message);
    this.name = 'DiffCheckerError';
    this.code = code;
    Object.setPrototypeOf(this, DiffCheckerError.prototype);
  }
}
