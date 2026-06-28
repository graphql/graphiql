import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'cypress';

const PORT = process.env.CI === 'true' ? 8080 : 5173;

export default defineConfig({
  e2e: {
    baseUrl: `http://localhost:${PORT}`,
    setupNodeEvents(on) {
      on('task', {
        writeBaseline({ filePath, data }: { filePath: string; data: unknown }) {
          const abs = path.isAbsolute(filePath)
            ? filePath
            : path.resolve(process.cwd(), filePath);
          const dir = path.dirname(abs);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(abs, JSON.stringify(data, null, 2) + '\n');
          return null;
        },
      });
    },
  },
  video: true,
  viewportWidth: 1920,
  viewportHeight: 1080,
});
