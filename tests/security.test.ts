import { describe, it, expect, vi } from 'vitest';
import { diffChecker, formatUnifiedDiff } from '../src/index.js';

describe('diffChecker - Security and Untrusted Text Handling', () => {
  it('treats HTML, scripts, and event handlers purely as inert text', () => {
    const original = '<script>alert("xss")</script>\n<img src="x" onerror="evil()" />\n';
    const modified = '<script>console.log("safe")</script>\n<img src="x" onerror="evil()" />\n';

    const result = diffChecker(original, modified);
    expect(result.changes[0]?.value).toBe('<script>alert("xss")</script>');
    expect(result.changes[1]?.value).toBe('<script>console.log("safe")</script>');
    expect(result.changes[2]?.value).toBe('<img src="x" onerror="evil()" />');

    const formatted = formatUnifiedDiff(result);
    expect(formatted).toContain('-<script>alert("xss")</script>');
    expect(formatted).toContain('+<script>console.log("safe")</script>');
  });

  it('does not evaluate JavaScript code, functions, or expressions', () => {
    const spy = vi.spyOn(console, 'log');

    const original = 'console.log("should not run");\nprocess.exit(1);\n';
    const modified = 'console.log("still should not run");\n';

    const result = diffChecker(original, modified);
    expect(result.summary.changed).toBe(1);
    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  it('handles SQL statements without interpretation', () => {
    const original = "SELECT * FROM users WHERE id = '1' OR '1'='1';\n";
    const modified = 'SELECT id, username FROM users WHERE id = ?;\n';

    const result = diffChecker(original, modified);
    expect(result.summary.changed).toBe(1);
    expect(result.changes[0]?.value).toBe("SELECT * FROM users WHERE id = '1' OR '1'='1';");
  });

  it('handles shell commands, pipelines, and backticks safely', () => {
    const original = 'rm -rf / --no-preserve-root\n';
    const modified = 'echo "hello" | cat > /dev/null\n';

    const result = diffChecker(original, modified);
    expect(result.changes[0]?.value).toBe('rm -rf / --no-preserve-root');
    expect(result.changes[1]?.value).toBe('echo "hello" | cat > /dev/null');
  });

  it('is immune to prototype pollution attack payloads in text or options', () => {
    const original = '__proto__.polluted = true;\nconstructor.prototype.isAdmin = true;\n';
    const modified = '__proto__.polluted = false;\n';

    // Verify Object prototype before
    expect((Object.prototype as Record<string, unknown>)['polluted']).toBeUndefined();
    expect((Object.prototype as Record<string, unknown>)['isAdmin']).toBeUndefined();

    const result = diffChecker(original, modified);
    expect(result.identical).toBe(false);

    // Verify Object prototype untouched
    expect((Object.prototype as Record<string, unknown>)['polluted']).toBeUndefined();
    expect((Object.prototype as Record<string, unknown>)['isAdmin']).toBeUndefined();
  });
});
