import { defineConfig } from '@playwright/test';

// Electron itself is the "browser" here (via `_electron.launch` in the spec),
// so there's no `use.browserName`/`webServer` to configure — the test drives
// the packaged app's `dist/` output directly. Run `yarn build` (and
// `yarn electron:setup`) first.
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    trace: 'retain-on-failure',
  },
});
