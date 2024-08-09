import { defineConfig } from 'vite';
import packageJSON from './package.json';
import dts from 'vite-plugin-dts';
import commonjs from 'vite-plugin-commonjs';

const umdConfig = defineConfig({
  define: {
    // https://github.com/graphql/graphql-js/blob/16.x.x/website/docs/tutorials/going-to-production.md#vite
    'globalThis.process': 'true',
    'process.env.NODE_ENV': '"production"',
  },
  // To bundle `const { createClient } = require('graphql-ws')` in `createWebsocketsFetcherFromUrl` function
  plugins: [commonjs()],
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
      '/bad/graphql': 'http://localhost:8080',
      '/http-error/graphql': 'http://localhost:8080',
      '/graphql-error/graphql': 'http://localhost:8080',
      '/subscriptions': {
        target: 'ws://localhost:8081',
        ws: true,
      },
    },
  },
  plugins: [dts({ rollupTypes: true })],
});

export default process.env.UMD === 'true' ? umdConfig : esmConfig;
