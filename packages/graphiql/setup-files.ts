'use no memo';

import { vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';

afterEach(cleanup);

// to make it works like Jest (auto-mocking)
vi.mock('zustand');
vi.mock('monaco-editor');
// These UI tests do not inspect Monaco worker responses. Mock the setup module
// itself so internal Monaco workers cannot reuse Vitest's worker module cache.
vi.mock('@graphiql/react/setup-workers/vite', () => {
  class TestWorker extends EventTarget implements Worker {
    onerror: Worker['onerror'] = null;
    onmessage: Worker['onmessage'] = null;
    onmessageerror: Worker['onmessageerror'] = null;
    postMessage() {}
    terminate() {}
  }

  globalThis.MonacoEnvironment = {
    getWorker: () => new TestWorker(),
  };
  return {};
});

// Since we load `monaco-editor` dynamically, we need to allow more time for tests that assert editor values
configure({ asyncUtilTimeout: 9_000 });
