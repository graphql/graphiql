import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
