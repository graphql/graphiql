import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CollectionItemRow } from './collection-item-row';
import type { Collection, CollectionItem } from '../types';

const item: CollectionItem = {
  id: 'item-1',
  name: 'MyOperation',
  query: '{ __typename }',
  createdAt: 1000,
  updatedAt: 1000,
};

const allCollections: Collection[] = [
  {
    id: 'col-1',
    name: 'Col One',
    createdAt: 1000,
    updatedAt: 1000,
    items: [item],
  },
];

function renderRow(
  overrides: Partial<Parameters<typeof CollectionItemRow>[0]> = {},
) {
  const onOpen = vi.fn();
  const onCopy = vi.fn();
  const onDelete = vi.fn();
  const onMove = vi.fn();
  render(
    <CollectionItemRow
      item={item}
      collectionId="col-1"
      index={0}
      totalItems={1}
      allCollections={allCollections}
      onOpen={onOpen}
      onCopy={onCopy}
      onDelete={onDelete}
      onMove={onMove}
      {...overrides}
    />,
  );
  return { onOpen, onCopy, onDelete, onMove };
}

describe('CollectionItemRow', () => {
  it('clicking "Copy operation" calls onCopy with the item id, not onOpen', () => {
    const { onCopy, onOpen } = renderRow();
    fireEvent.click(screen.getByText('Copy operation'));
    expect(onCopy).toHaveBeenCalledOnce();
    expect(onCopy).toHaveBeenCalledWith('item-1');
    // Menu clicks must not fall through to the row's open handler.
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('clicking "Delete" calls onDelete with collectionId and itemId, not onOpen', () => {
    const { onDelete, onOpen } = renderRow();
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('col-1', 'item-1');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('readOnly hides Delete and Move affordances and disables drag', () => {
    const twoItems: Collection[] = [
      {
        id: 'col-1',
        name: 'Col One',
        createdAt: 1000,
        updatedAt: 1000,
        items: [item, { ...item, id: 'item-2', name: 'Second' }],
      },
      {
        id: 'col-2',
        name: 'Col Two',
        createdAt: 1000,
        updatedAt: 1000,
        items: [],
      },
    ];
    const { container } = render(
      <CollectionItemRow
        item={item}
        collectionId="col-1"
        index={0}
        totalItems={2}
        allCollections={twoItems}
        readOnly
        onOpen={vi.fn()}
        onCopy={vi.fn()}
        onDelete={vi.fn()}
        onMove={vi.fn()}
      />,
    );
    expect(screen.queryByText('Delete')).toBeNull();
    expect(screen.queryByText('Move down')).toBeNull();
    expect(screen.queryByText(/^Move to:/)).toBeNull();
    // Still openable / copyable.
    expect(screen.getByText('Open')).toBeTruthy();
    expect(screen.getByText('Copy operation')).toBeTruthy();
    const row = container.querySelector('.graphiql-collection-item-row');
    expect(row?.getAttribute('draggable')).toBe('false');
  });

  it('allowCopy:false hides "Copy operation"', () => {
    renderRow({ allowCopy: false });
    expect(screen.queryByText('Copy operation')).toBeNull();
    expect(screen.getByText('Open')).toBeTruthy();
  });
});
