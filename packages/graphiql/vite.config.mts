import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

export default defineConfig(({ command }) => ({
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
  server: {
    // Prevent a browser window from opening automatically
    open: false,
    proxy: {
      '/graphql': 'http://localhost:8080',
      '/subscriptions': {
        target: 'ws://localhost:8081',
        ws: true,
      },
    },
  },
  optimizeDeps:
    command === 'serve'
      ? {
          entries: ['src/e2e.ts'],
        }
      : undefined,
  resolve:
    command === 'serve'
      ? {
          alias: [
            {
              find: 'graphiql/setup-workers/vite',
              replacement: fileURLToPath(
                new URL('./src/setup-workers/vite.ts', import.meta.url),
              ),
            },
            {
              find: 'graphiql',
              replacement: fileURLToPath(
                new URL('./src/index.ts', import.meta.url),
              ),
            },
          ],
        }
      : undefined,
  plugins: [
    ...plugins,
    htmlPlugin(),
    dts({
      include: ['src/**'],
      outDir: ['dist'],
      exclude: ['src/e2e.ts', '**/*.spec.{ts,tsx}', '**/__tests__/'],
    }),
  ],
  worker: {
    format: 'es',
  },
}));

function htmlPlugin(): PluginOption {
  return {
    name: 'html-use-source-entry',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const start = '<!--vite-replace-start-->';
        const end = '<!--vite-replace-end-->';
        const contentToReplace = html.slice(
          html.indexOf(start),
          html.indexOf(end) + end.length,
        );
        return html.replace(
          contentToReplace,
          '<script type="module" src="/src/e2e.ts"></script>',
        );
      },
    },
  };
}
