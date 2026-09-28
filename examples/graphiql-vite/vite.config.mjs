import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'graphiql > @graphiql/react > graphql-language-service > nullthrows',
      'graphiql > @graphiql/react > monaco-graphql > picomatch-browser',
    ],
    exclude: [
      'graphiql/setup-workers/vite',
      '@graphiql/react/setup-workers/vite',
    ],
  },
});
