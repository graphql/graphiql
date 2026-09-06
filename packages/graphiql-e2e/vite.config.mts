import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Alias } from 'vite';
import type { PluginOptions as ReactCompilerConfig } from 'babel-plugin-react-compiler';
import { reactCompilerConfig as $reactCompilerConfig } from '../graphiql-react/vite.config.mjs';

const reactCompilerConfig: Partial<ReactCompilerConfig> = {
  ...$reactCompilerConfig,
  sources(filename) {
    return filename.includes(`packages${path.sep}graphiql-e2e${path.sep}src`);
  },
};

export default defineConfig(({ mode }) => {
  if (mode !== 'source' && mode !== 'built') {
    throw new Error(
      'Run Vite with either `--mode source` or `--mode built` in graphiql-e2e.',
    );
  }

  const aliases: Alias[] = [
    {
      find: /^graphiql\/style\.css$/,
      replacement: fileURLToPath(
        new URL(
          mode === 'source'
            ? '../graphiql/src/style.css'
            : '../graphiql/dist/style.css',
          import.meta.url,
        ),
      ),
    },
    {
      find: /^graphiql\/setup-workers\/vite$/,
      replacement: fileURLToPath(
        new URL(
          mode === 'source'
            ? '../graphiql/src/setup-workers/vite.ts'
            : '../graphiql/dist/setup-workers/vite.js',
          import.meta.url,
        ),
      ),
    },
    {
      find: /^graphiql$/,
      replacement: fileURLToPath(
        new URL(
          mode === 'source'
            ? '../graphiql/src/index.ts'
            : '../graphiql/dist/index.js',
          import.meta.url,
        ),
      ),
    },
  ];

  return {
    base: mode === 'built' ? '/e2e/' : '/',
    build: {
      assetsDir: 'assets',
      outDir: 'dist',
      sourcemap: true,
    },
    optimizeDeps: {
      entries: ['src/e2e.ts'],
    },
    resolve: { alias: aliases },
    server: {
      open: false,
      proxy: {
        '/graphql': 'http://localhost:8080',
        '/resources': 'http://localhost:8080',
        '/subscriptions': {
          target: 'ws://localhost:8081',
          ws: true,
        },
      },
    },
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler', reactCompilerConfig]],
        },
      }),
    ],
    worker: {
      format: 'es',
    },
  };
});
