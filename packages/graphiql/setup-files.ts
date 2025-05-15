'use no memo';

import '@testing-library/jest-dom';

vi.mock('codemirror');
vi.mock('zustand'); // to make it works like Jest (auto-mocking)

// @ts-expect-error
document.createRange = function () {
  return {
    setEnd() {},
    setStart() {},
    getClientRects() {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    },
    getBoundingClientRect() {
      return { right: 0 };
    },
  };
};
