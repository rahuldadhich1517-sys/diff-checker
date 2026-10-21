import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'diff-checker/index': 'src/diff-checker/index.ts',
    'unified-diff/index': 'src/unified-diff/index.ts',
    'summary/index': 'src/summary/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  minify: false,
  splitting: false,
});
