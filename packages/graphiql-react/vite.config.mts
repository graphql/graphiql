import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import postCssNestingPlugin from 'postcss-nesting';
import packageJSON from './package.json';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    svgr({
      exportAsDefault: true,
      svgrOptions: {
        titleProp: true,
      },
    }),
    dts({
      outDir: ['dist/types'],
      exclude: ['**/*.spec.{ts,tsx}', '**/__tests__/'],
    }),
  ],
  css: {
    postcss: {
      plugins: [postCssNestingPlugin()],
    },
  },
  build: {
    minify: false,
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
        chunkFileNames: '[format]/[name].js',
      },
    },
  },
});
