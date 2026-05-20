import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Emit relative asset/worker URLs so the bundle can be served from any
  // CDN path (jsdelivr/unpkg/esm.sh `?raw`) rather than only the origin root.
  // Without this, Vite hard-codes `new Worker("/workers/json.worker.js", ...)`
  // which resolves to `https://<cdn-origin>/workers/...` (404) instead of
  // `https://<cdn-origin>/.../dist/workers/...`.
  base: './',
  define: {
    // graphql v17
    'globalThis.process.env.NODE_ENV': 'true',
    // https://github.com/graphql/graphql-js/blob/16.x.x/website/pages/docs/going-to-production.mdx
    'globalThis.process': 'true',
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [
    react(),
    dts({
      include: ['src/**'],
      outDir: ['dist'],
    }),
  ],
  css: {
    transformer: 'lightningcss',
  },
  build: {
    minify: 'terser',
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'graphiql',
      cssFileName: 'style',
    },
    rollupOptions: {
      external: id =>
        id === 'react' ||
        id.startsWith('react/') ||
        id === 'react-dom' ||
        id.startsWith('react-dom/') ||
        id === 'graphql' ||
        id.startsWith('graphql/'),
      output: {
        // Inline every lazy `import(...)` into the main bundle. Critical for
        // the CDN use case: monaco-editor's language contributions lazy-load
        // their tokenizers via dynamic imports; if those land in separate
        // chunks they ship as separate URLs that fragment monaco-editor into
        // multiple instances at runtime. A single self-contained file
        // guarantees one instance.
        inlineDynamicImports: true,
      },
    },
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        entryFileNames: 'workers/[name].js',
        // Just to group worker assets, add shared/internal chunks too
        chunkFileNames: 'workers/[name].js',
        // Workers are inlined as blob URLs (Vite's `?worker&inline`). The
        // default sourcemap setting writes a `.js.map` next to the worker
        // and appends `//# sourceMappingURL=foo.worker.js.map` to the
        // source — but blob URLs have no real origin, so the comment
        // resolves to `blob://nullnull/foo.worker.js.map` and the browser
        // logs a CORS/local-resource error trying to fetch it. Suppress
        // worker sourcemaps to keep the consumer's console clean.
        sourcemap: false,
      },
    },
  },
});
