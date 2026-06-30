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
});
