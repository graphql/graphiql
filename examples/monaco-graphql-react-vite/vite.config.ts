import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  build: {
    minify: false,
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  plugins: [
    react(),
    watchPackages(['monaco-graphql', 'graphql-language-service']),
  ],
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        entryFileNames: 'workers/[name].js',
        chunkFileNames: 'workers/[name].js',
      },
    },
  },
});

function watchPackages(packageNames: string[]) {
  let isWatching = false;

  return {
    name: 'vite-plugin-watch-packages',
    buildStart() {
      if (!isWatching) {
        for (const packageName of packageNames) {
          this.addWatchFile(require.resolve(packageName));
        }

        isWatching = true;
      }
    },
  };
}
