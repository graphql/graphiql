import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

export default defineConfig({
  build: {
    minify: false,
  },
  plugins: [
    react(),
    monacoEditorPlugin({
      publicPath: 'workers',
      // note that this only loads the worker, not the full main process language support
      languageWorkers: ['json', 'typescript', 'editorWorkerService'],
      customWorkers: [
        {
          label: 'graphql',
          entry: 'monaco-graphql/esm/graphql.worker',
        },
      ],
    }),
  ],
});
