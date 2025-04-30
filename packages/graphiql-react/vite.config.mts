/* eslint-disable no-console */
import { defineConfig, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
// @ts-expect-error -- no types
import postCssNestingPlugin from 'postcss-nesting';
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
];

export default defineConfig({
  plugins,
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
      fileName(_format, entryName) {
        const filePath = entryName.replace(/\.svg$/, '');
        return `${filePath}.js`;
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'react/jsx-runtime',
        'react-dom/client',
        // Exclude peer dependencies and dependencies from bundle
        ...Object.keys(packageJSON.peerDependencies),
        ...Object.keys(packageJSON.dependencies),
        // Exclude `codemirror/...` and `codemirror-graphql/...` but not `../style/codemirror.css`
        /codemirror[/-]/,
      ],
      output: {
        preserveModules: true,
      },
    },
  },
});
