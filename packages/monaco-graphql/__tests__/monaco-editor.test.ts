import { describe, it, expect } from 'vitest';
import { build, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const EXAMPLE_ROOT = path.resolve(
  import.meta.dirname,
  '../../../examples/monaco-graphql-react-vite',
);

describe('monaco-editor', () => {
  it('should include in bundle only graphql/json/typescript languages', async () => {
    const result = await build({
      root: EXAMPLE_ROOT,
      logLevel: 'warn',
      build: {
        write: false,
        minify: false,
        // esnext avoids Babel down-transpilation passes, saving time on CI.
        target: 'esnext',
        // Skip gzip-size computation; irrelevant for a file-list assertion.
        reportCompressedSize: false,
        rollupOptions: {
          // Treeshake is expensive for a 1000+ module bundle and irrelevant
          // for verifying which output files exist.
          treeshake: false,
          output: {
            entryFileNames: '[name].js',
            chunkFileNames: 'assets/[name].js',
            assetFileNames: 'assets/[name].[ext]',
          },
        },
      },
      plugins: [react()],
      worker: {
        format: 'es',
        rollupOptions: {
          treeshake: false,
          output: {
            entryFileNames: 'workers/[name].js',
            chunkFileNames: 'workers/[name].js',
          },
        },
      },
    } satisfies UserConfig);

    // `result` is an array: [main build output, ...worker build outputs].
    // The main build output already includes the worker assets as emitted
    // files, so we only need to inspect result[0].
    const mainOutput = Array.isArray(result) ? result[0] : result;
    const files = mainOutput.output
      .map(chunk => chunk.fileName)
      .sort();

    expect(files).toMatchInlineSnapshot(`
      [
        "assets/codicon.ttf",
        "assets/graphql.js",
        "assets/graphqlMode.js",
        "assets/index.css",
        "assets/index.js",
        "assets/jsonMode.js",
        "assets/tsMode.js",
        "assets/typescript.js",
        "index.html",
        "index.js",
        "workers/editor.worker.js",
        "workers/graphql.js",
        "workers/graphql.worker.js",
        "workers/json.worker.js",
        "workers/standalone.js",
        "workers/ts.worker.js",
      ]
    `);
  }, 30_000);
});
