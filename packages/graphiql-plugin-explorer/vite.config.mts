import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import dts from 'vite-plugin-dts';
import packageJSON from './package.json';

export default defineConfig({
  plugins: [
    react({ jsxRuntime: 'classic' }),
    svgr({
      svgrOptions: {
        titleProp: true,
      },
    }),
    dts({ include: ['src/**'] }),
  ],
  css: {
    transformer: 'lightningcss',
  },
  build: {
    minify: false,
    lib: {
      entry: 'src/index.tsx',
      fileName: (_format, filePath) => `${filePath}.js`,
      formats: ['es'],
      cssFileName: 'style',
    },
    rollupOptions: {
      external: [
        // Exclude peer dependencies and dependencies from bundle
        ...Object.keys({
          ...packageJSON.peerDependencies,
          ...packageJSON.dependencies,
        }),
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
