import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ExportDialog } from './export-dialog';
import { collectionsStore } from '../store';

beforeEach(() => {
  collectionsStore.setState({
    collections: [
      {
        id: 'c1',
        name: 'Mine',
        createdAt: 1,
        updatedAt: 1,
        items: [],
      },
    ],
    loaded: true,
  });
});

describe('ExportDialog', () => {
  it('renders a textarea with the exported JSON and action buttons when open', () => {
    render(<ExportDialog open onClose={vi.fn()} />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toContain('Mine');
    expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Download JSON' })).toBeTruthy();
  });

  it('renders a textarea with empty value when open is false', () => {
    render(<ExportDialog open={false} onClose={vi.fn()} />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
  });

  it('clicking Copy JSON copies the export and closes the dialog', async () => {
    const writeText = vi.fn().mockResolvedValue(null);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const onClose = vi.fn();
    render(<ExportDialog open onClose={onClose} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy JSON' }));
    });

    expect(writeText).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('clicking Download JSON closes the dialog', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:mock');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      value: createObjectURL,
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: revokeObjectURL,
      configurable: true,
    });
    // jsdom doesn't implement navigation on anchor click; stub it out.
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    const onClose = vi.fn();
    render(<ExportDialog open onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    clickSpy.mockRestore();
  });
});
