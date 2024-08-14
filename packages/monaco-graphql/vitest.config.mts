// eslint-disable-next-line import-x/no-unresolved -- todo: try to fix better rather ignoring here?
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
});
