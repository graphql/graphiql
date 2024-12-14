import { defineConfig } from 'vitest/config';
import { plugins } from './vite.config.mjs';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./setup-files.ts'],
  },
  plugins,
});
