'use no memo';

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// to make it works like Jest (auto-mocking)
vi.mock('zustand');
vi.mock('monaco-editor');

// Since we load `monaco-editor` dynamically, we need to allow more time for tests that assert editor values
configure({ asyncUtilTimeout: 9_000 });
