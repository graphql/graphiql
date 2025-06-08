import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import packageJSON from './package.json';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' }), dts({ include: ['src/**'] })],
  css: {
    transformer: 'lightningcss',
  },
  build: {
    minify: false,
    lib: {
      entry: 'src/index.tsx',
      fileName: (_format, filePath) => `${filePath}.js`,
      formats: ['es'],
      cssFileName: 'style',
    },
    rollupOptions: {
      external: [
        // Exclude peer dependencies and dependencies from bundle
        ...Object.keys({
          ...packageJSON.peerDependencies,
          ...packageJSON.dependencies,
        }),
      ],
    },
  },
});
