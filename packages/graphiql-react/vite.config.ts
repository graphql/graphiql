import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    // We use function names for generating readable error messages, so we want
    // them to be preserved when building and minifying.
    keepNames: true,
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      fileName: 'graphiql-react',
      formats: ['cjs', 'es'],
    },
    rollupOptions: {
      external: ['graphql', 'react', 'react-dom'],
      output: {
        chunkFileNames: '[name].[format].js',
      },
    },
  },
});
