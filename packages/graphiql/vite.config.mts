import path from 'node:path';
import { defineConfig, PluginOption } from 'vite';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react';
import { reactCompilerConfig as $reactCompilerConfig } from '../graphiql-react/vite.config.mjs';
import type { PluginOptions as ReactCompilerConfig } from 'babel-plugin-react-compiler';
import packageJSON from './package.json';

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

const umdConfig = defineConfig({
  define: {
    // graphql v17
    'globalThis.process.env.NODE_ENV': 'true',
    // https://github.com/graphql/graphql-js/blob/16.x.x/website/pages/docs/going-to-production.mdx
    'globalThis.process': 'true',
    'process.env.NODE_ENV': '"production"',
  },
  plugins,
  css: {
    transformer: 'lightningcss',
  },
  build: {
    minify: 'terser', // produce less bundle size
    sourcemap: true,
    emptyOutDir: false,
    lib: {
      entry: 'src/cdn.ts',
      /**
       * The name of the exposed global variable. Required when the `formats` option includes `umd`
       * or `iife`.
       */
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
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        entryFileNames: 'workers/[name].js',
        // Just to group worker assets, add shared/internal chunks too
        chunkFileNames: 'workers/[name].js',
      },
    },
  },
});

const esmConfig = defineConfig({
  build: {
    cssCodeSplit: true,
    minify: false,
    sourcemap: true,
    lib: {
      entry: [
        'src/index.ts',
        'src/e2e.ts',
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
  plugins: [
    ...plugins,
    htmlPlugin(),
    process.env.NODE_ENV === 'production' && removeImportsFromE2EFile(),
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

function htmlPlugin(): PluginOption {
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
        return html.replace(
          contentToReplace,
          '<script type="module" src="/src/e2e.ts"></script>',
        );
      },
    },
  };
}

function removeImportsFromE2EFile(): PluginOption {
  return {
    name: 'remove-imports-from-e2e-file',
    enforce: 'pre', // Ensure it runs before Vite's own transformers
    transform(code: string, id: string) {
      if (id.endsWith('e2e.ts')) {
        const transformedCode = code
          .split('\n')
          .filter(line => !line.startsWith('import '))
          .join('\n');
        return {
          code: transformedCode,
          // Remove source map to clean vite warning:
          // a plugin (remove-imports-from-e2e-file) was used to transform files, but didn't generate a sourcemap for the transformation
          map: null,
        };
      }
    },
  };
}

export default process.env.UMD === 'true' ? umdConfig : esmConfig;
