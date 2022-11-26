import { defineConfig } from 'vite';
import pluginReact from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    plugins: [
      pluginReact(),
    ],
  };
});
