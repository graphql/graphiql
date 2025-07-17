import { defineWebWorkers } from '@vitest/web-worker/pure';
/**
 * Fixes TypeError: Cannot read properties of null (reading 'webkitBackingStorePixelRatio')
 */
import 'vitest-canvas-mock';

defineWebWorkers();

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
 * Fixes ReferenceError: ResizeObserver is not defined
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (!window.ResizeObserver) {
  Object.defineProperty(window, 'ResizeObserver', {
    writable: false,
    value: vi.fn().mockReturnValue({
      observe() {},
      disconnect() {},
    }),
  });
}

/**
 * ReferenceError: ClipboardItem is not defined
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (!window.ClipboardItem) {
  Object.defineProperty(window, 'ClipboardItem', {
    writable: false,
    value: vi.fn(),
  });
}

process.on('unhandledRejection', reason => {
  if (
    reason instanceof Error &&
    reason.name === 'Canceled' &&
    reason.name === reason.message
  ) {
    // ignore DeferredPromise.cancel
    return;
  }
  throw reason;
});

// eslint-disable-next-line @typescript-eslint/no-restricted-imports, import-x/no-extraneous-dependencies
export * from 'monaco-editor';
