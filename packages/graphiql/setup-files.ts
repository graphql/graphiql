'use no memo';

import { vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';

afterEach(cleanup);

// to make it works like Jest (auto-mocking)
vi.mock('zustand');
vi.mock('monaco-editor');
// These UI tests do not inspect Monaco worker responses. Loading the simulated
// workers can race Vitest 5's module cache when the suite tears down.
vi.mock('monaco-editor/editor/editor.worker.js?worker', () => ({
  default: class {
    postMessage() {}
    terminate() {}
    addEventListener() {}
    removeEventListener() {}
  },
}));
vi.mock('monaco-editor/languages/features/json/json.worker.js?worker', () => ({
  default: class {
    postMessage() {}
    terminate() {}
    addEventListener() {}
    removeEventListener() {}
  },
}));
vi.mock('monaco-graphql/esm/graphql.worker.js?worker', () => ({
  default: class {
    postMessage() {}
    terminate() {}
    addEventListener() {}
    removeEventListener() {}
  },
}));

// Since we load `monaco-editor` dynamically, we need to allow more time for tests that assert editor values
configure({ asyncUtilTimeout: 9_000 });
