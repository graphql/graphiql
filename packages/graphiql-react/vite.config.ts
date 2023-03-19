import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import reactSvgPlugin from 'vite-plugin-react-svg';

export default defineConfig({
  plugins: [
    react(),
    reactSvgPlugin({
      defaultExport: 'component',
      expandProps: 'end',
      titleProp: true,
    }),
  ],
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
      external: ['graphql', 'react', 'react-dom', 'react/jsx-runtime'],
      output: {
        chunkFileNames: '[name].[format].js',
      },
    },
  },
});
