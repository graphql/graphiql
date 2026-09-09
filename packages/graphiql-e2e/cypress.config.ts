import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'cypress';

const target = process.env.GRAPHIQL_E2E_TARGET;

if (target !== 'source' && target !== 'built') {
  throw new Error(
    'Set GRAPHIQL_E2E_TARGET to either "source" or "built" before running Cypress.',
  );
}

const port = target === 'source' ? 5173 : 8080;

export default defineConfig({
  e2e: {
    baseUrl: `http://localhost:${port}`,
    env: { target },
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
