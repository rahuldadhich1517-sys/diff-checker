export interface ParsedLine {
  readonly value: string;
  readonly lineEnding: '\r\n' | '\n' | '\r' | '';
}

/**
 * Splits text into lines preserving exact line endings and trailing newline presence.
 * For any text: `splitLines(text).map(l => l.value + l.lineEnding).join('') === text`.
 */
export function splitLines(text: string): ParsedLine[] {
  if (text.length === 0) {
    return [];
  }

  const lines: ParsedLine[] = [];
  let lineStart = 0;
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const ch = text.charCodeAt(i);
    if (ch === 13 /* \r */) {
      if (i + 1 < len && text.charCodeAt(i + 1) === 10 /* \n */) {
        lines.push({
          value: text.slice(lineStart, i),
          lineEnding: '\r\n',
        });
        i++; // Skip \n
        lineStart = i + 1;
      } else {
        lines.push({
          value: text.slice(lineStart, i),
          lineEnding: '\r',
        });
        lineStart = i + 1;
      }
    } else if (ch === 10 /* \n */) {
      lines.push({
        value: text.slice(lineStart, i),
        lineEnding: '\n',
      });
      lineStart = i + 1;
    }
  }

  if (lineStart < len) {
    lines.push({
      value: text.slice(lineStart),
      lineEnding: '',
    });
  }

  return lines;
}
