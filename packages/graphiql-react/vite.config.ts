import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import monacoEditorPlugin from "vite-plugin-monaco-editor"

import path, { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.tsx'),
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format}.js`
    },
  },

  plugins: [react(), monacoEditorPlugin({
      languageWorkers: ["json", "editorWorkerService"],
      customWorkers: [{label: "graphql", entry: "monaco-graphql/esm/graphql.worker"}]
    })],
});
