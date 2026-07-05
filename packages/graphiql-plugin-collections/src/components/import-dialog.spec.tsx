import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ImportDialog } from './import-dialog';

// ---------------------------------------------------------------------------
// FileReader mock helpers
// ---------------------------------------------------------------------------

type FileReaderOnload = (event: { target: { result: string } }) => void;

let capturedOnload: FileReaderOnload | null = null;

/** Simulate the FileReader completing with the given text content. */
function triggerFileReaderLoad(text: string) {
  act(() => {
    capturedOnload?.({ target: { result: text } });
  });
}

beforeEach(() => {
  capturedOnload = null;
  vi.stubGlobal(
    'FileReader',
    class MockFileReader {
      onload: FileReaderOnload | null = null;
      // Arrow field so `this` is lexically bound — no alias needed.
      readAsText = (_file: Blob) => {
        capturedOnload = e => {
          this.onload?.(e);
        };
      };
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A minimal valid collections export envelope with one collection. */
const VALID_EXPORT = JSON.stringify({
  version: 1,
  collections: [
    {
      id: 'col-1',
      name: 'Test',
      createdAt: 1000,
      updatedAt: 1000,
      items: [],
    },
  ],
});

function renderDialog(
  overrides: Partial<Parameters<typeof ImportDialog>[0]> = {},
) {
  const onClose = vi.fn();
  const onImport = vi.fn();
  render(
    <ImportDialog open onClose={onClose} onImport={onImport} {...overrides} />,
  );
  return { onClose, onImport };
}

/** Attach a fake file to the file input. */
function attachFakeFile() {
  const fileInput = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  const fakeFile = new File([''], 'test.json', { type: 'application/json' });
  Object.defineProperty(fileInput, 'files', {
    value: [fakeFile],
    configurable: true,
  });
  return fileInput;
}

// ---------------------------------------------------------------------------
// Render tests
// ---------------------------------------------------------------------------

describe('ImportDialog render', () => {
  it('default render shows a file input and Merge + Replace radios', () => {
    renderDialog();
    expect(document.querySelector('input[type="file"]')).toBeTruthy();
    expect(screen.getByText(/Merge/)).toBeTruthy();
    expect(screen.getByText(/Replace/)).toBeTruthy();
  });

  it('allowReplace:false hides the Replace radio but keeps Merge', () => {
    renderDialog({ allowReplace: false });
    expect(document.querySelector('input[type="file"]')).toBeTruthy();
    expect(screen.queryByText(/Replace/)).toBeNull();
    expect(screen.getByText(/Merge/)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Import flow tests
// ---------------------------------------------------------------------------

describe('ImportDialog import flow', () => {
  it('invalid JSON keeps dialog open with an inline error and does not call onImport/onClose', () => {
    const { onClose, onImport } = renderDialog();
    attachFakeFile();

    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    triggerFileReaderLoad('not json at all');

    expect(screen.getByText(/Invalid JSON file/)).toBeTruthy();
    expect(onImport).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('valid JSON that analyzeImport rejects keeps dialog open with an inline error', () => {
    const { onClose, onImport } = renderDialog();
    attachFakeFile();

    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    // Valid JSON but no collections array — analyzeImport returns ok:false.
    triggerFileReaderLoad(JSON.stringify({ something: 'else' }));

    expect(screen.getByText(/isn.t a valid collections export/)).toBeTruthy();
    expect(onImport).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('valid collections export calls onImport with text and mode, then closes', () => {
    const { onClose, onImport } = renderDialog();
    attachFakeFile();

    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    triggerFileReaderLoad(VALID_EXPORT);

    expect(onImport).toHaveBeenCalledOnce();
    expect(onImport).toHaveBeenCalledWith(VALID_EXPORT, 'merge');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('selecting Replace then importing passes "replace" to onImport', () => {
    const { onClose, onImport } = renderDialog();
    attachFakeFile();

    fireEvent.click(screen.getByLabelText(/Replace/));

    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    triggerFileReaderLoad(VALID_EXPORT);

    expect(onImport).toHaveBeenCalledWith(VALID_EXPORT, 'replace');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
