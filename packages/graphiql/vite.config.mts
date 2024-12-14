import { sep } from 'node:path';
import { defineConfig, PluginOption } from 'vite';
import dts from 'vite-plugin-dts';
import commonjs from 'vite-plugin-commonjs';
import react from '@vitejs/plugin-react';
import packageJSON from './package.json';

const ReactCompilerConfig = {
  target: '17',
  sources(filename) {
    if (!filename.includes(`packages${sep}graphiql${sep}`)) {
      return false;
    }
    // eslint-disable-next-line no-console
    console.log({ filename });
    return true;
  },
};

const plugins = [
  react({
    babel: {
      plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
    },
  }),
];

const umdConfig = defineConfig({
  define: {
    // graphql v17
    'globalThis.process.env.NODE_ENV': 'true',
    // https://github.com/graphql/graphql-js/blob/16.x.x/website/docs/tutorials/going-to-production.md#vite
    'globalThis.process': 'true',
    'process.env.NODE_ENV': '"production"',
  },
  // To bundle `const { createClient } = require('graphql-ws')` in `createWebsocketsFetcherFromUrl` function
  plugins: [...plugins, commonjs()],
  build: {
    minify: 'terser', // produce less bundle size
    sourcemap: true,
    emptyOutDir: false,
    lib: {
      entry: 'src/cdn.ts',
      // 👇 The name of the exposed global variable. Required when the formats option includes umd or iife
      name: 'GraphiQL',
      fileName: 'index',
      formats: ['umd'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});

const esmConfig = defineConfig({
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      fileName: 'index',
      formats: ['cjs', 'es'],
    },
    rollupOptions: {
      external: [
        // Exclude peer dependencies and dependencies from bundle
        ...Object.keys(packageJSON.peerDependencies),
        ...Object.keys(packageJSON.dependencies),
      ],
    },
  },
  server: {
    // prevent browser window from opening automatically
    open: false,
    proxy: {
      '/graphql': 'http://localhost:8080',
      '/subscriptions': {
        target: 'ws://localhost:8081',
        ws: true,
      },
    },
  },
  plugins: [...plugins, htmlPlugin(), dts({ rollupTypes: true })],
});

function htmlPlugin(): PluginOption {
  const htmlForVite = /* HTML */ `
    <script type="module">
      import React from 'react';
      import ReactDOM from 'react-dom/client';
      import GraphiQL from './src/cdn';

      Object.assign(globalThis, { React, ReactDOM, GraphiQL });
    </script>
    <link href="/src/style.css" rel="stylesheet" />
  `;

  return {
    name: 'html-replace-umd-with-src',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const start = '<!--vite-replace-start-->';
        const end = '<!--vite-replace-end-->';
        const contentToReplace = html.slice(
          html.indexOf(start),
          html.indexOf(end) + end.length,
        );
        return html.replace(contentToReplace, htmlForVite);
      },
    },
  };
}

export default process.env.UMD === 'true' ? umdConfig : esmConfig;
