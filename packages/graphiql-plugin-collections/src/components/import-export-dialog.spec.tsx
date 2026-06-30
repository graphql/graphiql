import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ImportExportDialog } from './import-export-dialog';

function renderDialog(
  overrides: Partial<Parameters<typeof ImportExportDialog>[0]> = {},
) {
  render(
    <ImportExportDialog
      open
      onClose={vi.fn()}
      onImport={vi.fn()}
      {...overrides}
    />,
  );
}

describe('ImportExportDialog gating', () => {
  it('defaults show Export and Import tabs plus Merge/Replace radios', () => {
    renderDialog();
    expect(screen.getByText('Export')).toBeTruthy();
    expect(screen.getByText('Import')).toBeTruthy();
    // Radios live under the Import tab.
    fireEvent.click(screen.getByText('Import'));
    expect(screen.getByText(/Merge/)).toBeTruthy();
    expect(screen.getByText(/Replace/)).toBeTruthy();
  });

  it('allowReplace:false hides the Replace radio (forces merge)', () => {
    renderDialog({ allowReplace: false });
    // Switch to the import tab so the radios render.
    fireEvent.click(screen.getByText('Import'));
    expect(screen.queryByText(/Replace/)).toBeNull();
    expect(screen.getByText(/Merge/)).toBeTruthy();
  });

  it('readOnly hides the Import tab and import controls, keeping Export', () => {
    renderDialog({ readOnly: true });
    // Export content is present.
    expect(screen.getByText('Copy JSON')).toBeTruthy();
    // No Import tab button, no import mode radios.
    expect(screen.queryByText('Import')).toBeNull();
    expect(screen.queryByText(/Merge/)).toBeNull();
  });
});
