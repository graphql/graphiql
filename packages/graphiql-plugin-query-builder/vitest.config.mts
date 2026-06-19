import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        titleProp: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    alias: [
      {
        // Fixes Error: Failed to resolve entry for package "monaco-editor".
        find: /^monaco-editor$/,
        replacement: path.resolve(
          '../../node_modules/monaco-editor/esm/vs/editor/editor.api',
        ),
      },
    ],
  },
});
