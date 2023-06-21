import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
  },
  video: false,
  viewportWidth: 1920,
  viewportHeight: 1080
});
