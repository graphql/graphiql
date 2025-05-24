/* eslint-disable no-console */
import fs from 'node:fs/promises';
import { defineConfig, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import type { PluginOptions as ReactCompilerConfig } from 'babel-plugin-react-compiler';
import packageJSON from './package.json' assert { type: 'json' };
import dts from 'vite-plugin-dts';

export const reactCompilerConfig: Partial<ReactCompilerConfig> = {
  target: '18',
  sources(filename) {
    if (filename.includes('__tests__')) {
      return false;
    }
    return filename.includes('graphiql-react');
  },
  logger: {
    logEvent(filename, result) {
      if (result.kind === 'CompileSuccess') {
        console.info('🚀 File', filename, 'was optimized with react-compiler');
        return;
      }
      if (result.kind === 'CompileSkip') {
        console.info(
          '🚫 File',
          filename,
          'was skipped due to "use no memo" directive',
        );
        return;
      }
      console.error(
        '❌ File',
        filename,
        'was not optimized with react-compiler',
        result,
      );
      const isDev = process.argv.at(-1)! === '--watch';
      if (!isDev) {
        process.exit(1);
      }
    },
  },
};

export const plugins: PluginOption[] = [
  react({
    babel: {
      plugins: [['babel-plugin-react-compiler', reactCompilerConfig]],
    },
  }),
  svgr({
    svgrOptions: {
      titleProp: true,
    },
  }),
  dts({
    include: ['src/**'],
    outDir: ['dist'],
    exclude: ['**/*.spec.{ts,tsx}', '**/__tests__/'],
  }),
  {
    // Vite transform workers source code,
    // we must use original import paths `monaco-editor/esm/...` and `monaco-graphql/esm/...` in Next.js
    name: 'ignore-setup-workers-file',
    load(id) {
      return id.endsWith('setup-workers/webpack.ts') ? '' : null;
    },
  },
  {
    name: 'copy-original-setup-workers-file',
    async closeBundle() {
      const dest = './dist/setup-workers/webpack.js';

      console.info(`Build finished! Writing "${dest}"...`);
      const content = await fs.readFile(
        './src/setup-workers/webpack.ts',
        'utf8',
      );
      await fs.writeFile(
        dest,
        // Strip TypeScript types
        content.replaceAll(': string', ''),
        'utf8',
      );
    },
  },
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
      entry: [
        'src/index.ts',
        'src/setup-workers/webpack.ts',
        'src/setup-workers/vite.ts',
      ],
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
        'react-dom/client',
        // Exclude peer dependencies and dependencies from bundle
        ...Object.keys({
          ...packageJSON.peerDependencies,
          ...packageJSON.dependencies,
        }),
        /monaco-graphql\//,
        /monaco-editor\//,
        /prettier\//,
        /graphql-language-service\//,
      ],
      output: {
        preserveModules: true,
      },
    },
  },
  worker: {
    format: 'es',
  },
});
