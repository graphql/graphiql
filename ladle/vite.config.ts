import { defineConfig } from 'vite';
import pluginReact from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    plugins: [pluginReact()],
    server: {
      // prevent browser window from opening automatically
      open: false,
      proxy: {
        '/graphql': 'http://localhost:8080',
        '/bad/graphql': 'http://localhost:8080',
        '/http-error/graphql': 'http://localhost:8080',
        '/graphql-error/graphql': 'http://localhost:8080',
        '/subscriptions': {
          target: 'ws://localhost:8081',
          ws: true,
        },
      },
    },
  };
});
