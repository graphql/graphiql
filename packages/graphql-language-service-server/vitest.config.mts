import { defineConfig } from 'vitest/config';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 5000,
    clearMocks: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/esm/**'],
    // Required for the source alias below; tells vite to bundle this
    // dependency through its pipeline instead of treating it as external.
    server: {
      deps: {
        inline: ['graphql-language-service'],
      },
    },
    alias: [
      // Load sibling workspace package source directly so tests run
      // against current code without a build step.
      {
        find: /^graphql-language-service$/,
        replacement: path.resolve(
          __dirname,
          '../graphql-language-service/src/index.ts',
        ),
      },
      // Vitest's module pipeline can resolve `graphql` from different
      // paths when inlining workspace source, creating duplicate module
      // instances. GraphQL's instanceof checks fail across instances,
      // so we pin to a single resolution.
      { find: /^graphql$/, replacement: require.resolve('graphql') },
    ],
  },
});
