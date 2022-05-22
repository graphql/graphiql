import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
