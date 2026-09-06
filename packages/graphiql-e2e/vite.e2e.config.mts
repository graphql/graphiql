import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/dist/e2e/',
  resolve: {
    alias: [
      {
        find: 'graphiql/setup-workers/vite',
        replacement: fileURLToPath(
          new URL('../graphiql/dist/setup-workers/vite.js', import.meta.url),
        ),
      },
      {
        find: 'graphiql',
        replacement: fileURLToPath(
          new URL('../graphiql/dist/index.js', import.meta.url),
        ),
      },
    ],
  },
  build: {
    emptyOutDir: false,
    outDir: 'dist/e2e',
    sourcemap: true,
    rollupOptions: {
      input: 'src/e2e.ts',
      preserveEntrySignatures: false,
      output: {
        entryFileNames: 'index.js',
      },
    },
  },
  worker: {
    format: 'es',
  },
});
