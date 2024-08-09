import { defineConfig } from 'cypress';

const PORT = process.env.CI === 'true' ? 8080 : 5173;

export default defineConfig({
  e2e: {
    baseUrl: `http://localhost:${PORT}`,
  },
  video: false,
  viewportWidth: 1920,
  viewportHeight: 1080,
});
