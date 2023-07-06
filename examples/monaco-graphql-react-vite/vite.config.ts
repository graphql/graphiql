import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { default as monacoEditorPlugin } from 'vite-plugin-monaco-editor';

export default defineConfig({
  plugins: [
    react(),
    monacoEditorPlugin({
      publicPath: 'workers',
      languageWorkers: ['json', 'editorWorkerService'],
      customWorkers: [
        {
          label: 'graphql',
          entry: 'monaco-graphql/dist/graphql.worker',
        },
      ],
    }),
  ],
});
