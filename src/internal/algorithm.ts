import type { ParsedLine } from './line-splitter.js';
import type { DiffCheckerOptions, DiffLine, DiffOperation } from '../diff-checker/types.js';

export function getLineComparisonKey(line: ParsedLine, options: DiffCheckerOptions): string {
  let val = line.value;

  if (options.ignoreWhitespace) {
    val = val.trim().replace(/\s+/g, ' ');
  }

  if (options.ignoreCase) {
    val = val.toLowerCase();
  }

  if (options.ignoreLineEndings || (options.ignoreTrailingNewline && line.lineEnding === '')) {
    return val;
  }

  return `${val}\x00${line.lineEnding}`;
}

export function areLinesEqual(
  a: ParsedLine,
  b: ParsedLine,
  options: DiffCheckerOptions,
): boolean {
  let aVal = a.value;
  let bVal = b.value;

  if (options.ignoreWhitespace) {
    aVal = aVal.trim().replace(/\s+/g, ' ');
    bVal = bVal.trim().replace(/\s+/g, ' ');
  }

  if (options.ignoreCase) {
    aVal = aVal.toLowerCase();
    bVal = bVal.toLowerCase();
  }

  if (aVal !== bVal) {
    return false;
  }

  if (options.ignoreLineEndings) {
    return true;
  }

  if (options.ignoreTrailingNewline && (a.lineEnding === '' || b.lineEnding === '')) {
    return true;
  }

  return a.lineEnding === b.lineEnding;
}

interface RawOp {
  readonly type: DiffOperation;
  readonly aIndex?: number;
  readonly bIndex?: number;
}

/**
 * Executes Myers' O(ND) diff algorithm with prefix/suffix trimming and O(N+M) disjoint checks.
 */
export function computeDiffLines(
  originalLines: readonly ParsedLine[],
  modifiedLines: readonly ParsedLine[],
  options: DiffCheckerOptions,
): DiffLine[] {
  const N = originalLines.length;
  const M = modifiedLines.length;

  if (N === 0 && M === 0) {
    return [];
  }

  if (N === 0) {
    return modifiedLines.map((line, idx) => ({
      type: 'added',
      value: line.value,
      oldLineNumber: undefined,
      newLineNumber: idx + 1,
      lineEnding: line.lineEnding,
    }));
  }

  if (M === 0) {
    return originalLines.map((line, idx) => ({
      type: 'removed',
      value: line.value,
      oldLineNumber: idx + 1,
      newLineNumber: undefined,
      lineEnding: line.lineEnding,
    }));
  }

  // 1. Prefix trimming
  let prefixLen = 0;
  while (
    prefixLen < N &&
    prefixLen < M &&
    areLinesEqual(originalLines[prefixLen]!, modifiedLines[prefixLen]!, options)
  ) {
    prefixLen++;
  }

  // 2. Suffix trimming
  let suffixLen = 0;
  while (
    suffixLen < N - prefixLen &&
    suffixLen < M - prefixLen &&
    areLinesEqual(
      originalLines[N - 1 - suffixLen]!,
      modifiedLines[M - 1 - suffixLen]!,
      options,
    )
  ) {
    suffixLen++;
  }

  const n = N - prefixLen - suffixLen;
  const m = M - prefixLen - suffixLen;

  const aSlice = originalLines.slice(prefixLen, N - suffixLen);
  const bSlice = modifiedLines.slice(prefixLen, M - suffixLen);

  const middleOps: RawOp[] = [];

  if (n === 0 && m === 0) {
    // Exact match in middle (no edits)
  } else if (n === 0) {
    for (let j = 0; j < m; j++) {
      middleOps.push({ type: 'added', bIndex: j });
    }
  } else if (m === 0) {
    for (let i = 0; i < n; i++) {
      middleOps.push({ type: 'removed', aIndex: i });
    }
  } else {
    // Disjoint check: If no elements in aSlice appear in bSlice,
    // all aSlice are removed and all bSlice are added.
    const bKeys = new Set<string>();
    for (let j = 0; j < m; j++) {
      bKeys.add(getLineComparisonKey(bSlice[j]!, options));
    }

    let hasCommon = false;
    for (let i = 0; i < n; i++) {
      if (bKeys.has(getLineComparisonKey(aSlice[i]!, options))) {
        hasCommon = true;
        break;
      }
    }

    if (!hasCommon) {
      for (let i = 0; i < n; i++) {
        middleOps.push({ type: 'removed', aIndex: i });
      }
      for (let j = 0; j < m; j++) {
        middleOps.push({ type: 'added', bIndex: j });
      }
    } else {
      // Myers' Diff Algorithm on aSlice and bSlice
      const ops = runMyers(aSlice, bSlice, options);
      middleOps.push(...ops);
    }
  }

  // Group adjacent changes within contiguous non-matching chunks: removals first, then additions
  const normalizedMiddleOps = normalizeChangeChunks(middleOps);

  // Assemble full DiffLine result: prefix + middle + suffix
  const result: DiffLine[] = [];

  // Prefix
  for (let i = 0; i < prefixLen; i++) {
    const modLine = modifiedLines[i]!;
    result.push({
      type: 'unchanged',
      value: modLine.value,
      oldLineNumber: i + 1,
      newLineNumber: i + 1,
      lineEnding: modLine.lineEnding,
    });
  }

  // Middle
  let currentOldLine = prefixLen + 1;
  let currentNewLine = prefixLen + 1;

  for (const op of normalizedMiddleOps) {
    if (op.type === 'unchanged') {
      const modLine = bSlice[op.bIndex!]!;
      result.push({
        type: 'unchanged',
        value: modLine.value,
        oldLineNumber: currentOldLine++,
        newLineNumber: currentNewLine++,
        lineEnding: modLine.lineEnding,
      });
    } else if (op.type === 'removed') {
      const origLine = aSlice[op.aIndex!]!;
      result.push({
        type: 'removed',
        value: origLine.value,
        oldLineNumber: currentOldLine++,
        newLineNumber: undefined,
        lineEnding: origLine.lineEnding,
      });
    } else if (op.type === 'added') {
      const modLine = bSlice[op.bIndex!]!;
      result.push({
        type: 'added',
        value: modLine.value,
        oldLineNumber: undefined,
        newLineNumber: currentNewLine++,
        lineEnding: modLine.lineEnding,
      });
    }
  }

  // Suffix
  for (let i = 0; i < suffixLen; i++) {
    const origIdx = N - suffixLen + i;
    const modIdx = M - suffixLen + i;
    const modLine = modifiedLines[modIdx]!;
    result.push({
      type: 'unchanged',
      value: modLine.value,
      oldLineNumber: origIdx + 1,
      newLineNumber: modIdx + 1,
      lineEnding: modLine.lineEnding,
    });
  }

  return result;
}

function runMyers(
  aSlice: readonly ParsedLine[],
  bSlice: readonly ParsedLine[],
  options: DiffCheckerOptions,
): RawOp[] {
  const n = aSlice.length;
  const m = bSlice.length;
  const MAX = n + m;
  const offset = MAX;

  let v = new Int32Array(2 * MAX + 1);

  // d = 0 snake from (0, 0)
  let x0 = 0;
  let y0 = 0;
  while (x0 < n && y0 < m && areLinesEqual(aSlice[x0]!, bSlice[y0]!, options)) {
    x0++;
    y0++;
  }
  v[offset] = x0;

  const trace: Int32Array[] = [new Int32Array(v)];
  let targetD = -1;

  if (x0 >= n && y0 >= m) {
    targetD = 0;
  } else {
    for (let d = 1; d <= MAX; d++) {
      const nextV = new Int32Array(v);
      for (let k = -d; k <= d; k += 2) {
        let x: number;
        if (k === -d || (k !== d && v[k - 1 + offset]! < v[k + 1 + offset]!)) {
          x = v[k + 1 + offset]!; // Addition
        } else {
          x = v[k - 1 + offset]! + 1; // Deletion
        }
        let y = x - k;

        while (x < n && y < m && areLinesEqual(aSlice[x]!, bSlice[y]!, options)) {
          x++;
          y++;
        }

        nextV[k + offset] = x;

        if (x >= n && y >= m) {
          targetD = d;
          v = nextV;
          trace.push(v);
          break;
        }
      }

      if (targetD !== -1) {
        break;
      }

      v = nextV;
      trace.push(v);
    }
  }

  // Backtrack
  const ops: RawOp[] = [];
  let currX = n;
  let currY = m;

  for (let d = targetD; d > 0; d--) {
    const k = currX - currY;
    const vPrev = trace[d - 1]!;

    let prevK: number;
    let isInsertion: boolean;

    if (k === -d || (k !== d && vPrev[k - 1 + offset]! < vPrev[k + 1 + offset]!)) {
      prevK = k + 1;
      isInsertion = true;
    } else {
      prevK = k - 1;
      isInsertion = false;
    }

    const prevXBeforeSnake = vPrev[prevK + offset]!;
    const prevYBeforeSnake = prevXBeforeSnake - prevK;

    const editEndX = isInsertion ? prevXBeforeSnake : prevXBeforeSnake + 1;
    const editEndY = isInsertion ? prevYBeforeSnake + 1 : prevYBeforeSnake;

    // Snake (unchanged lines)
    for (let sx = currX - 1, sy = currY - 1; sx >= editEndX && sy >= editEndY; sx--, sy--) {
      ops.push({ type: 'unchanged', aIndex: sx, bIndex: sy });
    }

    // Edit step
    if (isInsertion) {
      ops.push({ type: 'added', bIndex: prevYBeforeSnake });
    } else {
      ops.push({ type: 'removed', aIndex: prevXBeforeSnake });
    }

    currX = prevXBeforeSnake;
    currY = prevYBeforeSnake;
  }

  // Remaining snake from (0, 0)
  for (let sx = currX - 1, sy = currY - 1; sx >= 0 && sy >= 0; sx--, sy--) {
    ops.push({ type: 'unchanged', aIndex: sx, bIndex: sy });
  }

  ops.reverse();
  return ops;
}

/**
 * Normalizes contiguous change hunks so that within each change block,
 * all deletions come before all additions, preserving relative order.
 */
function normalizeChangeChunks(ops: readonly RawOp[]): RawOp[] {
  const result: RawOp[] = [];
  let i = 0;
  const len = ops.length;

  while (i < len) {
    if (ops[i]!.type === 'unchanged') {
      result.push(ops[i]!);
      i++;
    } else {
      // Collect contiguous block of changes
      const removed: RawOp[] = [];
      const added: RawOp[] = [];

      while (i < len && ops[i]!.type !== 'unchanged') {
        if (ops[i]!.type === 'removed') {
          removed.push(ops[i]!);
        } else {
          added.push(ops[i]!);
        }
        i++;
      }

      result.push(...removed, ...added);
    }
  }

  return result;
}
