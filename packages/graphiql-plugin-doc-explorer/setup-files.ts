'use no memo';

import { vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

afterEach(cleanup);

// to make it works like Jest (auto-mocking)
vi.mock('zustand');
vi.mock('monaco-editor');
