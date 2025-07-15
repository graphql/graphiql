'use no memo';

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// to make it works like Jest (auto-mocking)
vi.mock('zustand');
vi.mock('monaco-editor');

configure({ asyncUtilTimeout: 7_000 });
