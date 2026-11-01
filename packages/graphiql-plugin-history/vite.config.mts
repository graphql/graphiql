import { defineConfig, PluginOption } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import type { PluginOptions as ReactCompilerConfig } from 'babel-plugin-react-compiler';
import packageJSON from './package.json' with { type: 'json' };
import dts from 'vite-plugin-dts';
import { reactCompilerConfig as $reactCompilerConfig } from '../graphiql-react/vite.config.mjs';

export const reactCompilerConfig: Partial<ReactCompilerConfig> = {
  ...$reactCompilerConfig,
  sources(filename) {
    if (filename.includes('__tests__')) {
      return false;
    }
    return filename.includes('/graphiql-plugin-history/src/');
  },
};

export const plugins: PluginOption[] = [
  react(),
  babel({
    include: /\.[jt]sx?(?:$|\?)/,
    presets: [reactCompilerPreset(reactCompilerConfig)],
  }),
  dts({
    compilerOptions: { rootDir: 'src' },
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
        // Separate chunks for all modules
        preserveModules: true,
      },
    },
  },
});
