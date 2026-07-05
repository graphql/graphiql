import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CollectionRow } from './collection-row';
import type { Collection } from '../types';

const collection: Collection = {
  id: 'col-1',
  name: 'My Collection',
  createdAt: 1000,
  updatedAt: 1000,
  items: [],
};

function renderRow(
  overrides: Partial<Parameters<typeof CollectionRow>[0]> = {},
) {
  render(
    <CollectionRow
      collection={collection}
      allCollections={[collection]}
      onRename={vi.fn()}
      onDelete={vi.fn()}
      onCopy={vi.fn()}
      onOpenItem={vi.fn()}
      onCopyItem={vi.fn()}
      onDeleteItem={vi.fn()}
      onMoveItem={vi.fn()}
      onAddItem={vi.fn() as never}
      onRenameItem={vi.fn()}
      {...overrides}
    />,
  );
}

describe('CollectionRow gating', () => {
  it('defaults show Rename, Copy to clipboard, and Delete', () => {
    renderRow();
    expect(screen.getByText('Rename')).toBeTruthy();
    expect(screen.getByText('Copy to clipboard')).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('allowCopy:false hides "Copy to clipboard"', () => {
    renderRow({ allowCopy: false });
    expect(screen.queryByText('Copy to clipboard')).toBeNull();
    expect(screen.getByText('Rename')).toBeTruthy();
  });

  it('readOnly hides Rename and Delete but keeps Copy to clipboard', () => {
    renderRow({ readOnly: true });
    expect(screen.queryByText('Rename')).toBeNull();
    expect(screen.queryByText('Delete')).toBeNull();
    expect(screen.getByText('Copy to clipboard')).toBeTruthy();
  });
});

describe('CollectionRow expand/collapse', () => {
  it('toggle button is a real button with aria-expanded', () => {
    renderRow();
    const toggle = screen.getByRole('button', {
      name: /Toggle My Collection/i,
    });
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('clicking the toggle button flips aria-expanded', () => {
    renderRow();
    const toggle = screen.getByRole('button', {
      name: /Toggle My Collection/i,
    });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('committing a rename via blur does NOT change expanded state', () => {
    const onRename = vi.fn();
    renderRow({ onRename });
    const toggle = screen.getByRole('button', {
      name: /Toggle My Collection/i,
    });
    // Record the initial expanded state (true).
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    // Open rename via the dropdown menu item.
    fireEvent.click(screen.getByText('Rename'));

    // The input should now be visible; the toggle button is replaced.
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toBeTruthy();

    // Commit the rename via blur.
    fireEvent.blur(input);

    // After rename the toggle button comes back — expanded must still be true.
    const toggleAfter = screen.getByRole('button', {
      name: /Toggle My Collection/i,
    });
    expect(toggleAfter.getAttribute('aria-expanded')).toBe('true');
  });

  it('clicking the kebab/menu button does NOT toggle expanded state', () => {
    renderRow();
    const toggle = screen.getByRole('button', {
      name: /Toggle My Collection/i,
    });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    // The DropdownMenu.Button mock renders its children directly (not as a
    // button element with an accessible name), so locate it by text content.
    const kebab = screen.getByText('···');
    fireEvent.click(kebab);

    // Expanded state must not have changed.
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('CollectionRow pencil rename button', () => {
  it('pencil button enters rename mode', () => {
    const onRename = vi.fn();
    renderRow({ onRename });
    const pencil = screen.getByLabelText('Rename My Collection');
    fireEvent.click(pencil);
    // Rename input should now be visible.
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe('My Collection');
  });

  it('pencil button does NOT toggle expanded state', () => {
    renderRow();
    const toggle = screen.getByRole('button', {
      name: /Toggle My Collection/i,
    });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const pencil = screen.getByLabelText('Rename My Collection');
    fireEvent.click(pencil);
    // Commit rename to exit rename mode, then check expanded state.
    fireEvent.blur(screen.getByRole('textbox'));
    const toggleAfter = screen.getByRole('button', {
      name: /Toggle My Collection/i,
    });
    expect(toggleAfter.getAttribute('aria-expanded')).toBe('true');
  });

  it('readOnly hides the pencil button', () => {
    renderRow({ readOnly: true });
    expect(screen.queryByLabelText('Rename My Collection')).toBeNull();
  });
});
