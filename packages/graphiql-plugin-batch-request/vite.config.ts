import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.tsx',
      fileName: 'graphiql-plugin-batch-request',
      name: 'GraphiQLPluginBatchRequest',
      formats: ['cjs', 'es', 'umd'],
    },
    rollupOptions: {
      external: ['@graphiql/react', 'graphql', 'react', 'react-dom'],
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
