import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
