import { defineConfig } from 'vitest/config';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./setup-files.ts'],
    alias: {
      // fixes Duplicate "graphql" modules cannot be used at the same time since different
      graphql: require.resolve('graphql'),
    },
  },
});
