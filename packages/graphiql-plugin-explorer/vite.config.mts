import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import packageJSON from './package.json';
import dts from 'vite-plugin-dts';

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
    dts(),
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
