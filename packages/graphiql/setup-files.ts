'use no memo';

import '@testing-library/jest-dom';

vi.mock('zustand'); // to make it works like Jest (auto-mocking)

// Mocking clipboard object
window.navigator.clipboard = {
  write: vi.fn().mockResolvedValue(null),
};

/**
 * Fixes TypeError: Cannot read properties of null (reading 'webkitBackingStorePixelRatio')
 */
import 'vitest-canvas-mock';

/**
 * Fixes Error: Unexpected usage
 */
window.Worker ||= class {
  removeEventListener() {}

  postMessage() {}

  terminate() {}
};

/**
 * Fixes ReferenceError: ResizeObserver is not defined
 */
window.ResizeObserver ||= class {
  observe() {}

  disconnect() {}
};

/**
 * ReferenceError: ClipboardItem is not defined
 */
window.ClipboardItem = vi.fn();

/**
 * Fixes TypeError: mainWindow.matchMedia is not a function
 * @see https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
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

vi.mock('monaco-editor', async () => {
  const actual =
    await vi.importActual<typeof import('monaco-editor')>('monaco-editor');
  const mockedTextAreas: Record<string, HTMLTextAreaElement> = {};

  const create: (typeof actual)['editor']['create'] = (
    editorContainer,
    options,
  ) => {
    const { path } = options!.model!.uri;
    const textAreaEl = mockedTextAreas[path];
    editorContainer.append(textAreaEl);
    return Object.assign(actual.editor.create(editorContainer, options), {
      getValue() {
        const { value } = mockedTextAreas[path];
        return value;
      },
      setValue(newValue) {
        mockedTextAreas[path] = newValue;
      },
    });
  };

  const createModel: (typeof actual)['editor']['createModel'] = (
    value,
    language,
    uri,
  ) => {
    if (uri?.path) {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.className = 'mockMonaco';
      mockedTextAreas[uri.path] = textarea;
    }
    return actual.editor.createModel(value, language, uri);
  };

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

  return {
    ...actual,
    editor: {
      ...actual.editor,
      createModel,
      create,
    },
  };
});
