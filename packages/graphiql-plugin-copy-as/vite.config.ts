import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.tsx',
      fileName: 'graphiql-plugin-copy-as',
      name: 'GraphiQLPluginCopyAs',
      formats: ['cjs', 'es', 'umd'],
    },
    rollupOptions: {
      external: ['@graphiql/react', 'graphql', 'react', 'react-dom'],
      output: {
        chunkFileNames: '[name].[format].js',
        globals: {
          '@graphiql/react': 'GraphiQL.React',
          react: 'React',
        },
      },
    },
    commonjsOptions: {
      esmExternals: true,
      requireReturnsDefault: 'auto',
    },
  },
});
