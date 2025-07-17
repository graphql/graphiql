import path from 'node:path';
import { defineConfig } from 'vitest/config';
import { plugins } from './vite.config.mjs';

export default defineConfig({
  plugins,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./setup-files.ts', '../graphiql/setup-window.ts'],
    alias: [
      {
        // Fixes Error: Failed to resolve entry for package "monaco-editor". The package may have incorrect main/module/exports specified in its package.json.
        find: /^monaco-editor$/,
        replacement: path.resolve(
          '../../node_modules/monaco-editor/esm/vs/editor/editor.api',
        ),
      },
    ],
  },
});
