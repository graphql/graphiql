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
      'codemirror/addon/edit/matchbrackets': mockedCodemirror,
      'codemirror/addon/hint/show-hint': mockedCodemirror,
      'codemirror/addon/edit/closebrackets': mockedCodemirror,
      'codemirror/addon/fold/brace-fold': mockedCodemirror,
      'codemirror/addon/fold/foldgutter': mockedCodemirror,
      'codemirror/addon/lint/lint': mockedCodemirror,
      'codemirror/addon/search/searchcursor': mockedCodemirror,
      'codemirror/addon/search/jump-to-line': mockedCodemirror,
      'codemirror/addon/dialog/dialog': mockedCodemirror,
      'codemirror/keymap/sublime': mockedCodemirror,
      'codemirror/mode/javascript/javascript': mockedCodemirror,
      'codemirror/addon/comment/comment': mockedCodemirror,
      'codemirror/addon/search/search': mockedCodemirror,
      codemirror: mockedCodemirror,
    },
  },
});
