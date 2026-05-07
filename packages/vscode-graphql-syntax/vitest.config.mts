import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./tests/__utilities__/serializer.ts'],
    include: ['**/*.spec.ts'],
  },
});
