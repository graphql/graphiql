import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        titleProp: true,
      },
    }),
  ],
  resolve: {
    alias: {
      // Point @graphiql/react to our stub so tests don't need a built dist.
      '@graphiql/react': path.resolve(
        __dirname,
        'src/__mocks__/@graphiql/react.ts',
      ),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
