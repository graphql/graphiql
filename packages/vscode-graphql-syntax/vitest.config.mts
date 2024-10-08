import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./tests/__utilities__/serializer.ts'],
    include: ['**/*.spec.ts'],
  },
});
