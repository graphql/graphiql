import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type PluginOption } from 'vite';
import type { PluginOptions as ReactCompilerConfig } from 'babel-plugin-react-compiler';
import { reactCompilerConfig as $reactCompilerConfig } from '../graphiql-react/vite.config.mjs';

const reactCompilerConfig: Partial<ReactCompilerConfig> = {
  ...$reactCompilerConfig,
  sources(filename) {
    return filename.includes(`packages${path.sep}graphiql-e2e${path.sep}src`);
  },
};

export default defineConfig({
  server: {
    open: false,
    proxy: {
      '/graphql': 'http://localhost:8080',
      '/subscriptions': {
        target: 'ws://localhost:8081',
        ws: true,
      },
    },
  },
  optimizeDeps: {
    entries: ['src/e2e.ts'],
  },
  resolve: {
    alias: [
      {
        find: 'graphiql/setup-workers/vite',
        replacement: fileURLToPath(
          new URL('../graphiql/src/setup-workers/vite.ts', import.meta.url),
        ),
      },
      {
        find: 'graphiql',
        replacement: fileURLToPath(
          new URL('../graphiql/src/index.ts', import.meta.url),
        ),
      },
    ],
  },
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', reactCompilerConfig]],
      },
    }),
    htmlPlugin(),
  ],
  worker: {
    format: 'es',
  },
});

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
