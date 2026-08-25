import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const rendererRoot = fileURLToPath(new URL('./src/renderer', import.meta.url));
const outDir = fileURLToPath(new URL('./dist/renderer', import.meta.url));

export default defineConfig({
  root: rendererRoot,
  // Assets are loaded via the custom `graphiql-desktop://` scheme rather
  // than `file://`, but relative asset URLs keep things simple either way.
  base: './',
  plugins: [react()],
  build: {
    outDir,
    emptyOutDir: true,
  },
  // monaco's `?worker` imports (via `graphiql/setup-workers/vite`) pull in
  // code that itself uses dynamic imports, which Rollup can't code-split
  // for the default IIFE worker format.
  worker: {
    format: 'es',
  },
});
