/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
  return {
    plugins: [react()],
    server: {
      open: false,
    },
  };
});
