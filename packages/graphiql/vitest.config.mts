import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const mockedCodemirror = path.resolve('__mocks__', 'codemirror.ts');

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./setup-files.ts'],
    alias: {
      'codemirror/addon/edit/matchbrackets.js': mockedCodemirror,
      'codemirror/addon/hint/show-hint.js': mockedCodemirror,
      'codemirror/addon/edit/closebrackets.js': mockedCodemirror,
      'codemirror/addon/fold/brace-fold.js': mockedCodemirror,
      'codemirror/addon/fold/foldgutter.js': mockedCodemirror,
      'codemirror/addon/lint/lint.js': mockedCodemirror,
      'codemirror/addon/search/searchcursor.js': mockedCodemirror,
      'codemirror/addon/search/jump-to-line.js': mockedCodemirror,
      'codemirror/addon/dialog/dialog.js': mockedCodemirror,
      'codemirror/keymap/sublime.js': mockedCodemirror,
      'codemirror/mode/javascript/javascript.js': mockedCodemirror,
      'codemirror/addon/comment/comment.js': mockedCodemirror,
      'codemirror/addon/search/search.js': mockedCodemirror,
      codemirror: mockedCodemirror,
    },
  },
});
