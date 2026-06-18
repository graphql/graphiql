import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom doesn't implement scrollIntoView; the cursor reveal calls it.
Element.prototype.scrollIntoView ||= () => {};

afterEach(() => {
  cleanup();
});
