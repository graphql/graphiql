import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import postCssNestingPlugin from 'postcss-nesting';
import dts from 'vite-plugin-dts';
import packageJSON from './package.json';

export default defineConfig({
  plugins: [
    react(),
    dts(),
    svgr({
      exportAsDefault: true,
      svgrOptions: {
        titleProp: true,
      },
    }),
  ],
  css: {
    postcss: {
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
      fileName: 'index',
      formats: ['cjs', 'es'],
    },
    rollupOptions: {
      external: [
        'react/jsx-runtime',
        // Exclude peer dependencies and dependencies from bundle
        ...Object.keys(packageJSON.peerDependencies),
        ...Object.keys(packageJSON.dependencies).filter(
          dependency => dependency !== 'codemirror',
        ),
      ],
      output: {
        chunkFileNames: '[name].[format].js',
      },
    },
  },
});
