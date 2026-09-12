import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { plugins } from './vite.config.mjs';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins,
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./setup-files.ts'],
          alias: [
            {
              // Fixes Error: Failed to resolve entry for package "monaco-editor". The package may have incorrect main/module/exports specified in its package.json.
              find: /^monaco-editor$/,
              replacement: path.resolve(
                '../../node_modules/monaco-editor/esm/vs/editor/editor.api',
              ),
            },
          ],
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
