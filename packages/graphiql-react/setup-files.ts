/**
 * Fixes TypeError: document.queryCommandSupported is not a function
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    writable: false,
    value: {
      write: async () => null,
    },
  });
}

/**
 * Fixes TypeError: mainWindow.matchMedia is not a function
 * @see https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: false,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

export {};
