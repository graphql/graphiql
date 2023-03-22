import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' })],
  build: {
    lib: {
      entry: 'src/index.tsx',
      fileName: 'graphiql-plugin-code-exporter',
      name: 'GraphiQLPluginCodeExporter',
      formats: ['cjs', 'es', 'umd'],
    },
    rollupOptions: {
      external: ['graphql', 'react', 'react-dom'],
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
