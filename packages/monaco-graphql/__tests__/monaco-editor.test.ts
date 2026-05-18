import { describe, it, expect } from 'vitest';
import { build, type UserConfig } from 'vite';
import path from 'node:path';

const FIXTURE_ROOT = path.resolve(
  import.meta.dirname,
  '../__fixtures__/bundle-test',
);

describe('monaco-editor', () => {
  it('should not bundle Monaco language modules beyond graphql and json', async () => {
    const result = await build({
      root: FIXTURE_ROOT,
      logLevel: 'warn',
      build: {
        write: false,
        minify: false,
        target: 'esnext',
        reportCompressedSize: false,
        rollupOptions: {
          treeshake: false,
          output: {
            entryFileNames: '[name].js',
            chunkFileNames: 'assets/[name].js',
            assetFileNames: 'assets/[name].[ext]',
          },
        },
      },
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

    const mainOutput = Array.isArray(result) ? result[0] : result;
    const files = mainOutput.output.map(chunk => chunk.fileName).sort();

    // Explicit negative assertion: importing monaco-graphql must not pull in
    // TypeScript, CSS, or HTML language services. A consumer who only wants
    // GraphQL + JSON should not be forced to ship them.
    for (const file of files) {
      expect(file).not.toMatch(
        /typescript|tsMode|tsWorker|ts\.worker|cssMode|css\.worker|htmlMode|html\.worker/i,
      );
    }

    expect(files).toMatchInlineSnapshot(`
      [
        "assets/codicon.ttf",
        "assets/graphql.js",
        "assets/graphqlMode.js",
        "assets/index.css",
        "assets/jsonMode.js",
        "index.html",
        "index.js",
        "workers/editor.worker.js",
        "workers/graphql.js",
        "workers/graphql.worker.js",
        "workers/json.worker.js",
        "workers/standalone.js",
      ]
    `);
  }, 60_000);
});
