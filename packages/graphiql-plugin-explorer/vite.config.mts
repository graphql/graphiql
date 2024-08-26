import { createRequire } from 'node:module';
import { defineConfig, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import dts from 'vite-plugin-dts';
import packageJSON from './package.json';

const IS_UMD = process.env.UMD === 'true';

export default defineConfig({
  plugins: [
    react({ jsxRuntime: 'classic' }),
    svgr({
      exportAsDefault: true,
      svgrOptions: {
        titleProp: true,
      },
    }),
    !IS_UMD && [dts({ rollupTypes: true }), htmlPlugin()],
  ],
  build: {
    minify: IS_UMD
      ? 'terser' // produce better bundle size than esbuild
      : false,
    // avoid clean cjs/es builds
    emptyOutDir: !IS_UMD,
    lib: {
      entry: 'src/index.tsx',
      fileName: 'index',
      name: 'GraphiQLPluginExplorer',
      formats: IS_UMD ? ['umd'] : ['cjs', 'es'],
    },
    rollupOptions: {
      external: [
        // Exclude peer dependencies and dependencies from bundle
        ...Object.keys(packageJSON.peerDependencies),
        ...(IS_UMD ? [] : Object.keys(packageJSON.dependencies)),
      ],
      output: {
        chunkFileNames: '[name].[format].js',
        globals: {
          '@graphiql/react': 'GraphiQL.React',
          graphql: 'GraphiQL.GraphQL',
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    commonjsOptions: {
      esmExternals: true,
      requireReturnsDefault: 'auto',
    },
  },
});

function htmlPlugin(): PluginOption {
  const require = createRequire(import.meta.url);

  const graphiqlPath = require
    .resolve('graphiql/package.json')
    .replace('/package.json', '');

  const htmlForVite = `<link rel="stylesheet" href="${graphiqlPath}/src/style.css" />
<script type="module">
import React from 'react';
import ReactDOM from 'react-dom/client';
import GraphiQL from '${graphiqlPath}/src/cdn';
import * as GraphiQLPluginExplorer from './src';

Object.assign(globalThis, { React, ReactDOM, GraphiQL, GraphiQLPluginExplorer });
</script>`;

  return {
    name: 'html-replace-umd-with-src',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const start = '</style>';
        const end = '<body>';
        const contentToReplace = html.slice(
          html.indexOf(start) + start.length,
          html.indexOf(end),
        );
        return html.replace(contentToReplace, htmlForVite);
      },
    },
  };
}
