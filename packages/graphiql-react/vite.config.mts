/* eslint-disable no-console */
import fs from 'node:fs/promises';
import path from 'node:path';
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
    name: 'copy-original-setup-workers-file',
    async closeBundle() {
      const source = './src/setup-workers';
      const dest = './dist/setup-workers';
      const types = 'export {};\n';

      await fs.mkdir(dest, { recursive: true });

      const [esmSh, vite, webpack] = await Promise.all([
        fs.readFile(path.join(source, 'esm.sh.ts')),
        fs.readFile(path.join(source, 'vite.ts')),
        fs.readFile(path.join(source, 'webpack.ts')),
      ]);

      function removeTypes(raw: Buffer) {
        return raw.toString().replaceAll(': string', '');
      }

      await Promise.all([
        fs.writeFile(path.join(dest, 'esm.sh.js'), removeTypes(esmSh)),
        fs.writeFile(path.join(dest, 'esm.sh.d.ts'), types),
        fs.writeFile(path.join(dest, 'vite.js'), removeTypes(vite)),
        fs.writeFile(path.join(dest, 'vite.d.ts'), types),
        fs.writeFile(path.join(dest, 'webpack.js'), removeTypes(webpack)),
        fs.writeFile(path.join(dest, 'webpack.d.ts'), types),
      ]);

      console.info(`Build finished! Created "${dest}"...`);
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
        /zustand\//,
      ],
      output: {
        // Separate chunks for all modules
        preserveModules: true,
      },
    },
  },
  worker: {
    format: 'es',
  },
});
