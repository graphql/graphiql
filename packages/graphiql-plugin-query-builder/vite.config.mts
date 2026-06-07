import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import dts from 'vite-plugin-dts';
import packageJSON from './package.json' with { type: 'json' };

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        titleProp: true,
      },
    }),
    dts({
      include: ['src/**'],
      exclude: ['**/*.spec.{ts,tsx}', '**/__tests__/'],
    }),
  ],
  css: {
    transformer: 'lightningcss',
  },
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      fileName(_format, entryName) {
        const filePath = entryName.replace(/\.svg$/, '');
        return `${filePath}.js`;
      },
      formats: ['es'],
      cssFileName: 'style',
    },
    rollupOptions: {
      external: [
        'react/jsx-runtime',
        // Exclude peer dependencies from bundle
        ...Object.keys(packageJSON.peerDependencies),
      ],
      output: {
        preserveModules: true,
      },
    },
  },
});
