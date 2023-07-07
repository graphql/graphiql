import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import packageJSON from './package.json';

const IS_UMD = process.env.UMD === 'true';

const plugins = [react({ jsxRuntime: 'classic' })];

if (!IS_UMD) {
  plugins.push(
    dts({
      cleanVueFileName: true,
      copyDtsFiles: true,
      outDir: 'types',
      staticImport: true,
    }),
  );
}

export default defineConfig({
  plugins,
  build: {
    // avoid clean cjs/es builds
    emptyOutDir: !IS_UMD,
    lib: {
      entry: 'src/index.tsx',
      fileName: 'index',
      name: 'GraphiQLPluginCodeExporter',
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
