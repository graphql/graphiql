/// <reference types="vite/client" />

import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    server: {
      open: false,
    },
  };
});
