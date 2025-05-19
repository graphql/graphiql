'use no memo';

import '@testing-library/jest-dom';

vi.mock('zustand'); // to make it works like Jest (auto-mocking)

import './__mocks__/monaco-editor/canvas';
import './__mocks__/monaco-editor/get-selection';//
import './__mocks__/monaco-editor/match-media';
import './__mocks__/monaco-editor/query-command-supported';//
import './__mocks__/monaco-editor/resize-observer';
import './__mocks__/monaco-editor/worker';

// @ts-expect-error
// document.createRange = function () {
//   return {
//     setEnd() {},
//     setStart() {},
//     getClientRects() {
//       return { top: 0, bottom: 0, left: 0, right: 0 };
//     },
//     getBoundingClientRect() {
//       return { right: 0 };
//     },
//   };
// };

// Mocking clipboard object
globalThis.navigator.clipboard = {
  write: vi.fn().mockResolvedValue(null),
};

globalThis.ClipboardItem = vi.fn();
