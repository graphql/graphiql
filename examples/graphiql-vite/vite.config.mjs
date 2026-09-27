import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  worker: { format: 'es' },
  optimizeDeps: {
    include: [
      'graphiql > @graphiql/react > graphql-language-service > nullthrows',
      'graphiql > @graphiql/react > monaco-graphql > picomatch-browser',
      'graphiql > @graphiql/react > prettier/parser-graphql',
      'graphiql > @graphiql/react > prettier/parser-babel',
    ],
    exclude: [
      'graphiql/setup-workers/vite',
      '@graphiql/react/setup-workers/vite',
    ],
  },
});
