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
      languageWorkers: ['json'],
      customWorkers: [
        {
          label: 'graphql',
          entry: 'monaco-graphql/esm/graphql.worker',
        },
      ],
    }),
  ],
});
