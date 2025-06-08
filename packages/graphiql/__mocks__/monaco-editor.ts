// eslint-disable-next-line @typescript-eslint/no-restricted-imports, import-x/no-extraneous-dependencies
import {
  editor as monacoEditor,
  languages,
  Emitter,
  Uri,
  KeyCode,
  KeyMod,
} from 'monaco-editor';
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

const mockedTextAreas: Record<string, HTMLTextAreaElement> =
  Object.create(null);

export { languages, Emitter, Uri, KeyCode, KeyMod };

export const editor: typeof monacoEditor = {
  ...monacoEditor,
  createModel(value, language, uri) {
    if (uri?.path) {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.className = 'mockMonaco';
      mockedTextAreas[uri.path] = textarea;
    }
    return monacoEditor.createModel(value, language, uri);
  },
  create(editorContainer, options) {
    const { path } = options!.model!.uri;
    const textAreaEl = mockedTextAreas[path]!;
    editorContainer.append(textAreaEl);
    return Object.assign(monacoEditor.create(editorContainer, options), {
      getValue() {
        const { value } = mockedTextAreas[path]!;
        return value;
      },
      setValue(newValue: string) {
        mockedTextAreas[path]!.value = newValue;
      },
    });
  },
};
