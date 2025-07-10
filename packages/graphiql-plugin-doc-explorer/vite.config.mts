import { defineConfig, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import type { PluginOptions as ReactCompilerConfig } from 'babel-plugin-react-compiler';
import packageJSON from './package.json' assert { type: 'json' };
import dts from 'vite-plugin-dts';
import { reactCompilerConfig as $reactCompilerConfig } from '../graphiql-react/vite.config.mjs';

export const reactCompilerConfig: Partial<ReactCompilerConfig> = {
  ...$reactCompilerConfig,
  sources(filename) {
    if (filename.includes('__tests__')) {
      return false;
    }
    return filename.includes('/graphiql-plugin-doc-explorer/src/');
  },
};

export const plugins: PluginOption[] = [
  react({
    babel: {
      plugins: [['babel-plugin-react-compiler', reactCompilerConfig]],
    },
  }),
  dts({
    include: ['src/**'],
    exclude: ['**/*.spec.{ts,tsx}', '**/__tests__/'],
  }),
];

export default defineConfig({
  plugins,
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
        // Exclude peer dependencies and dependencies from bundle
        ...Object.keys(packageJSON.peerDependencies),
        ...Object.keys(packageJSON.dependencies),
      ],
      output: {
        preserveModules: true,
      },
    },
  },
});
