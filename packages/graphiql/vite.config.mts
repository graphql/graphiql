import path from 'node:path';
import { defineConfig, PluginOption } from 'vite';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react';
import { reactCompilerConfig as $reactCompilerConfig } from '../graphiql-react/vite.config.mjs';
import type { PluginOptions as ReactCompilerConfig } from 'babel-plugin-react-compiler';
import packageJSON from './package.json' with { type: 'json' };

const reactCompilerConfig: Partial<ReactCompilerConfig> = {
  ...$reactCompilerConfig,
  sources(filename) {
    if (
      filename.includes('__tests__') ||
      /\.(spec|test)\.tsx?$/.test(filename)
    ) {
      return false;
    }
    return filename.includes(`packages${path.sep}graphiql${path.sep}src`);
  },
};

export const plugins: PluginOption[] = [
  react({
    babel: {
      plugins: [['babel-plugin-react-compiler', reactCompilerConfig]],
    },
  }),
];

export default defineConfig({
  build: {
    cssCodeSplit: true,
    minify: false,
    sourcemap: true,
    lib: {
      entry: [
        'src/index.ts',
        'src/setup-workers/webpack.ts',
        'src/setup-workers/vite.ts',
        'src/setup-workers/esm.sh.ts',
      ],
      fileName: (_format, filePath) => `${filePath}.js`,
      formats: ['es'],
      cssFileName: 'style',
    },
    rollupOptions: {
      external: [
        'react/jsx-runtime',
        // Exclude peer dependencies and dependencies from bundle
        ...Object.keys({
          ...packageJSON.peerDependencies,
          ...packageJSON.dependencies,
        }),
        /^@graphiql\/react\//,
      ],
      output: {
        // Separate chunks for all modules
        preserveModules: true,
      },
    },
  },
  plugins: [
    ...plugins,
    dts({
      include: ['src/**'],
      outDir: ['dist'],
      exclude: ['**/*.spec.{ts,tsx}', '**/__tests__/'],
    }),
  ],
  worker: {
    format: 'es',
  },
});
