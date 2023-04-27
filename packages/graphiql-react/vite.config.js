import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import reactSvgPlugin from 'vite-plugin-react-svg';
import postCssNestingPlugin from 'postcss-nesting';
// import noBundlePlugin from 'vite-plugin-no-bundle';
export default defineConfig({
  plugins: [
    // TODO:  disable bundling dependencies
    // noBundlePlugin(),
    react(),
    reactSvgPlugin({
      defaultExport: 'component',
      expandProps: 'end',
      titleProp: true,
    }),
  ],
  css: {
    postcss: {
      // @ts-expect-error
      plugins: [postCssNestingPlugin()],
    },
  },
  esbuild: {
    // We use function names for generating readable error messages, so we want
    // them to be preserved when building and minifying.
    keepNames: true,
  },
  build: {
    sourcemap: true,
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
